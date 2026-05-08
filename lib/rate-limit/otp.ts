import { SupabaseClient } from "@supabase/supabase-js";

// Durable rate limiting using Supabase database
const OTP_GENERATION_LIMIT = 3; // 3 requests per window
const OTP_GENERATION_WINDOW = 60 * 60 * 1000; // 1 hour

const OTP_VERIFICATION_LIMIT = 5; // 5 attempts per window
const OTP_VERIFICATION_WINDOW = 15 * 60 * 1000; // 15 minutes

interface RateLimitResult {
  allowed: boolean;
  retryAfter?: number;
  nextRetryAt?: string; // ISO timestamp
  attemptsRemaining?: number;
}

async function checkRateLimit(
  supabase: SupabaseClient,
  userId: string,
  attemptType: "otp_gen" | "otp_verify",
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  const cutoffTime = new Date(Date.now() - windowMs).toISOString();

  // Query recent attempts
  const { data: attempts, error } = await supabase
    .from("rate_limit_attempts")
    .select("created_at", { count: "exact" })
    .eq("user_id", userId)
    .eq("attempt_type", attemptType)
    .gte("created_at", cutoffTime);

  if (error) {
    console.error("Rate limit check error:", error);
    // Fall back to allowing on error (fail open)
    return { allowed: true };
  }

  const attemptCount = attempts?.length ?? 0;

  if (attemptCount >= limit) {
    // Rate limited - calculate when they can retry
    const oldestAttempt = new Date(
      Math.min(...attempts!.map((a) => new Date(a.created_at).getTime()))
    );
    const nextRetryAtMs = oldestAttempt.getTime() + windowMs;
    const nextRetryAt = new Date(nextRetryAtMs).toISOString();
    const retryAfter = Math.ceil((nextRetryAtMs - Date.now()) / 1000);

    return {
      allowed: false,
      retryAfter: Math.max(1, retryAfter),
      nextRetryAt,
      attemptsRemaining: 0,
    };
  }

  // Insert new attempt record
  const { error: insertError } = await supabase
    .from("rate_limit_attempts")
    .insert([
      {
        user_id: userId,
        attempt_type: attemptType,
      },
    ]);

  if (insertError) {
    console.error("Failed to record attempt:", insertError);
    // Still allow the action but log the error
  }

  // Calculate next retry time (when they'll hit the limit)
  const nextRetryAtMs = Date.now() + (windowMs / limit) * (limit - attemptCount);
  const nextRetryAt = new Date(nextRetryAtMs).toISOString();
  const attemptsRemaining = Math.max(0, limit - attemptCount - 1);

  return {
    allowed: true,
    nextRetryAt,
    attemptsRemaining,
  };
}

export async function checkOtpGenerationRateLimit(
  supabase: SupabaseClient,
  userId: string
): Promise<RateLimitResult> {
  return checkRateLimit(
    supabase,
    userId,
    "otp_gen",
    OTP_GENERATION_LIMIT,
    OTP_GENERATION_WINDOW
  );
}

export async function checkOtpVerificationRateLimit(
  supabase: SupabaseClient,
  userId: string
): Promise<RateLimitResult> {
  return checkRateLimit(
    supabase,
    userId,
    "otp_verify",
    OTP_VERIFICATION_LIMIT,
    OTP_VERIFICATION_WINDOW
  );
}
