import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { sendOtpEmail } from "@/lib/email/send-otp";
import { checkOtpGenerationRateLimit } from "@/lib/rate-limit/otp";
import { getCurrentUser } from "@/utils/query/auth";
import { getVerificationStatus, getProfileById, updateProfile } from "@/utils/query/profiles";
import { supersedeVerifications, createVerificationRecord } from "@/utils/query/verification";

const PERSONAL_EMAIL_DOMAINS = new Set([
  "gmail.com", "googlemail.com",
  "yahoo.com", "yahoo.co.in", "yahoo.co.uk", "yahoo.com.au",
  "hotmail.com", "hotmail.co.uk", "hotmail.in",
  "outlook.com", "outlook.in",
  "live.com", "live.in",
  "icloud.com", "me.com", "mac.com",
  "rediffmail.com", "rediff.com",
  "protonmail.com", "proton.me",
  "zoho.com",
  "aol.com",
  "msn.com",
  "ymail.com",
]);

function normalizeDomain(email: string) {
  return email.split("@").at(1)?.trim().toLowerCase() ?? "";
}

function isPersonalEmailDomain(domain: string) {
  return PERSONAL_EMAIL_DOMAINS.has(domain.toLowerCase());
}

function generateOTP() {
  return crypto.randomInt(0, 1000000).toString().padStart(6, "0");
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { user, error: userError } = await getCurrentUser(supabase);

    if (userError || !user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 },
      );
    }

    const { data: existingProfile } = await getVerificationStatus(supabase, user.id);

    if (existingProfile?.verification_status === "verified") {
      return NextResponse.json(
        { message: "Your account is already verified.", code: "already-verified" },
        { status: 409 },
      );
    }

    const rateLimitCheck = await checkOtpGenerationRateLimit(supabase, user.id);
    if (!rateLimitCheck.allowed) {
      return NextResponse.json(
        {
          message: "Too many OTP requests. Please try again later.",
          code: "rate-limited",
          retryAfter: rateLimitCheck.retryAfter,
          nextRetryAt: rateLimitCheck.nextRetryAt,
        },
        { status: 429 },
      );
    }

    const body = await request.json();
    const { collegeName, collegeEmail: rawCollegeEmail, fullName } = body;

    let collegeEmail = rawCollegeEmail as string | undefined;
    let resolvedCollegeName = collegeName as string | undefined;

    if (!collegeEmail) {
      const { data: profile } = await getProfileById(supabase, user.id);

      if (!profile?.college_email) {
        return NextResponse.json(
          { message: "Please complete college information first" },
          { status: 400 },
        );
      }
      collegeEmail = profile.college_email;
      resolvedCollegeName = profile.college_name ?? resolvedCollegeName;
    }

    if (!collegeEmail?.includes("@")) {
      return NextResponse.json(
        { message: "Invalid email address" },
        { status: 400 },
      );
    }

    const domain = normalizeDomain(collegeEmail.toLowerCase());

    // Always persist profile data before branching on email type
    const profileUpdate: Record<string, string> = {
      college_email: collegeEmail.toLowerCase(),
      college_domain: domain,
      verification_status: "pending",
    };
    if (resolvedCollegeName) profileUpdate.college_name = resolvedCollegeName;
    if (fullName?.trim()) profileUpdate.full_name = fullName.trim();

    const { error: profileError } = await updateProfile(supabase, user.id, profileUpdate);

    if (profileError) {
      return NextResponse.json(
        { message: "Failed to update profile" },
        { status: 500 },
      );
    }

    // Personal email -> manual review path
    if (isPersonalEmailDomain(domain)) {
      await supersedeVerifications(supabase, user.id, "manual_review");

      const { error: reviewError } = await createVerificationRecord(supabase, {
          user_id: user.id,
          college_email: collegeEmail.toLowerCase(),
          email_domain: domain,
          verification_method: "manual_review",
          status: "pending",
          notes: `Manual review requested. Personal email domain: ${domain}`,
        });

      if (reviewError) {
        return NextResponse.json(
          { message: "Failed to submit review request" },
          { status: 500 },
        );
      }

      return NextResponse.json({ success: true, requiresReview: true });
    }

    // Institutional email -> OTP path
    await supersedeVerifications(supabase, user.id, "otp");

    const otp = generateOTP();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    const { data: verification, error: verificationError } = await createVerificationRecord(supabase, {
        user_id: user.id,
        college_email: collegeEmail.toLowerCase(),
        email_domain: domain,
        otp_code: otp,
        otp_expires_at: otpExpiresAt.toISOString(),
        verification_method: "otp",
        status: "pending",
        notes: `OTP sent to ${collegeEmail}`,
      });

    if (verificationError) {
      return NextResponse.json(
        { message: "Failed to initiate verification" },
        { status: 500 },
      );
    }

    try {
      await sendOtpEmail(collegeEmail.toLowerCase(), otp);
    } catch (emailError) {
      console.error("Failed to send OTP email:", emailError);
      if (verification?.id) {
        await supabase
          .from("college_verifications")
          .update({ status: "rejected", notes: "OTP email delivery failed." })
          .eq("id", verification.id);
      }
      return NextResponse.json(
        { message: "Failed to send verification email.", code: "otp-send" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, nextRetryAt: rateLimitCheck.nextRetryAt });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
