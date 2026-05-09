import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Durable rate limiting backed by the `rate_limit_attempts` table.
 *
 * Used for: OTP flows + write-side API endpoints (listings, deals, ratings).
 * Survives serverless cold starts (unlike in-memory counters).
 */

export type RateLimitType =
  | "otp_gen"
  | "otp_verify"
  | "deal_create"
  | "deal_status_update"
  | "listing_create"
  | "rating_create"
  | "admin_decision"
  | "verification_upload"
  | "tutor_create"
  | "tutor_request"
  | "message_send"
  | "user_report";

export interface RateLimitResult {
  allowed: boolean;
  retryAfter?: number; // seconds
  nextRetryAt?: string; // ISO timestamp
  attemptsRemaining?: number;
}

export async function checkRateLimit(
  supabase: SupabaseClient,
  userId: string,
  attemptType: RateLimitType,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult> {
  const cutoffTime = new Date(Date.now() - windowMs).toISOString();

  const { data: attempts, error } = await supabase
    .from("rate_limit_attempts")
    .select("created_at")
    .eq("user_id", userId)
    .eq("attempt_type", attemptType)
    .gte("created_at", cutoffTime);

  if (error) {
    // Fail open — never block users on infra errors
    console.error("[rate-limit] check error:", error);
    return { allowed: true };
  }

  const attemptCount = attempts?.length ?? 0;

  if (attemptCount >= limit) {
    const oldestAttempt = new Date(
      Math.min(...attempts!.map((a) => new Date(a.created_at).getTime())),
    );
    const nextRetryAtMs = oldestAttempt.getTime() + windowMs;
    const retryAfter = Math.ceil((nextRetryAtMs - Date.now()) / 1000);

    return {
      allowed: false,
      retryAfter: Math.max(1, retryAfter),
      nextRetryAt: new Date(nextRetryAtMs).toISOString(),
      attemptsRemaining: 0,
    };
  }

  const { error: insertError } = await supabase
    .from("rate_limit_attempts")
    .insert([{ user_id: userId, attempt_type: attemptType }]);

  if (insertError) {
    console.error("[rate-limit] insert error:", insertError);
  }

  return {
    allowed: true,
    attemptsRemaining: Math.max(0, limit - attemptCount - 1),
  };
}

/** Standard 429 JSON response shape for rate-limited API routes. */
export function rateLimitResponse(result: RateLimitResult) {
  return Response.json(
    {
      error: "Too many requests. Please try again later.",
      retryAfter: result.retryAfter,
      nextRetryAt: result.nextRetryAt,
    },
    {
      status: 429,
      headers: result.retryAfter
        ? { "Retry-After": String(result.retryAfter) }
        : undefined,
    },
  );
}
