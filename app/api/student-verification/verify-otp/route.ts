import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { checkOtpVerificationRateLimit } from "@/lib/rate-limit/otp";
import { getCurrentUser } from "@/utils/query/auth";
import { getVerificationStatus } from "@/utils/query/profiles";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { user, error: userError } = await getCurrentUser(supabase);

    if (userError || !user) {
      return NextResponse.json(
        { message: "Unauthorized", code: "unauthorized" },
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

    const rateLimitCheck = await checkOtpVerificationRateLimit(supabase, user.id);
    if (!rateLimitCheck.allowed) {
      return NextResponse.json(
        {
          message: "Too many verification attempts. Please try again later.",
          code: "rate-limited",
          retryAfter: rateLimitCheck.retryAfter,
          nextRetryAt: rateLimitCheck.nextRetryAt,
        },
        { status: 429 },
      );
    }

    const { otp } = await request.json();

    if (!otp || String(otp).trim().length !== 6) {
      return NextResponse.json(
        { message: "Please enter the 6-digit code from your email.", code: "invalid-otp" },
        { status: 400 },
      );
    }

    // Delegate to a SECURITY DEFINER function that atomically:
    //   1. Validates the OTP against college_verifications
    //   2. Marks the verification record as 'verified'
    //   3. Sets profiles.verification_status = 'verified'
    // This is the only code path that can set verification_status — direct column
    // updates from the authenticated role are revoked at the DB level.
    const { data: result, error: rpcError } = await supabase.rpc("verify_student_otp", {
      p_otp: String(otp).trim(),
    });

    if (rpcError) {
      console.error("verify_student_otp RPC error:", rpcError);
      return NextResponse.json(
        { message: "Verification failed. Please try again.", code: "otp-verify" },
        { status: 500 },
      );
    }

    const verifyResult = result as { success?: boolean; message?: string; code?: string } | null;

    if (!verifyResult?.success) {
      return NextResponse.json(
        {
          message: verifyResult?.message ?? "Invalid verification code",
          code: verifyResult?.code ?? "invalid-otp",
        },
        { status: 400 },
      );
    }

    return NextResponse.json({ success: true, verified: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Internal server error", code: "otp-verify" },
      { status: 500 },
    );
  }
}