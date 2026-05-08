import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/utils/query/auth";
import { resetVerification } from "@/utils/query/profiles";
import { supersedeVerifications } from "@/utils/query/verification";

/**
 * Reset a user's verified state so they can re-submit a college email.
 * - Clears college_email and resets verification_status on the profile
 * - Marks any pending college_verifications rows as superseded
 * The user is expected to be redirected back to /student-verification after
 * a successful response.
 */
export async function POST() {
  try {
    const supabase = await createClient();
    const { user, error: userError } = await getCurrentUser(supabase);

    if (userError || !user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Reset profile verification fields
    const { error: profileError } = await resetVerification(supabase, user.id);

    if (profileError) {
      console.error("Reverify: failed to reset profile:", profileError);
      return NextResponse.json(
        { message: "Failed to reset verification status" },
        { status: 500 }
      );
    }

    // Supersede any in-flight verification records so OTP rate counters / review
    // queues start fresh for the next attempt.
    const { error: superErr } = await supersedeVerifications(supabase, user.id);

    if (superErr) {
      // Not fatal — log and continue
      console.error("Reverify: failed to supersede verifications:", superErr);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Reverify error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
