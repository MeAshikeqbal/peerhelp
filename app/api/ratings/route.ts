import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/utils/query/auth";
import { getVerificationStatus, getUserEmail } from "@/utils/query/profiles";
import { getDealById } from "@/utils/query/deals";
import { createRating } from "@/utils/query/ratings";
import { notifyUser } from "@/lib/notifications/notify";
import { checkRateLimit } from "@/lib/rate-limit";

const RATING_WINDOW_MS = 60 * 60 * 1000;
const RATING_MAX = 5;

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { user, error: userError } = await getCurrentUser(supabase);

    if (userError || !user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const rate = await checkRateLimit(
      supabase,
      user.id,
      "rating_create",
      RATING_MAX,
      RATING_WINDOW_MS,
    );
    if (!rate.allowed) {
      return NextResponse.json(
        {
          message: "Too many ratings. Please wait and try again.",
          retryAfter: rate.retryAfter,
          nextRetryAt: rate.nextRetryAt,
        },
        { status: 429, headers: { "Retry-After": String(rate.retryAfter ?? 60) } },
      );
    }

    const { data: profile } = await getVerificationStatus(supabase, user.id);

    if (profile?.verification_status !== "verified") {
      return NextResponse.json({ message: "You must be verified to leave ratings" }, { status: 403 });
    }

    const body = await request.json();
    const { deal_id, score, comment } = body;

    if (!deal_id || typeof score !== "number" || score < 1 || score > 5) {
      return NextResponse.json({ message: "Invalid rating data" }, { status: 400 });
    }

    // Sanitize comment
    const sanitizedComment = typeof comment === "string"
      ? comment.trim().slice(0, 500) || null
      : null;

    // Fetch the deal and verify status + involvement
    const { data: deal } = await getDealById(supabase, deal_id);

    if (!deal) {
      return NextResponse.json({ message: "Deal not found" }, { status: 404 });
    }

    if (deal.status !== "completed") {
      return NextResponse.json({ message: "Can only rate completed deals" }, { status: 400 });
    }

    const isBuyer = deal.buyer_id === user.id;
    const isSeller = deal.seller_id === user.id;

    if (!isBuyer && !isSeller) {
      return NextResponse.json({ message: "Not part of this deal" }, { status: 403 });
    }

    const rated_user_id = isBuyer ? deal.seller_id : deal.buyer_id;

    const { data: rating, error: insertError } = await createRating(supabase, {
      deal_id,
      rater_id: user.id,
      rated_user_id,
      score,
      comment: sanitizedComment,
    });

    if (insertError) {
      if (insertError.code === "23505") {
        return NextResponse.json({ message: "You have already rated this deal" }, { status: 409 });
      }
      console.error("Rating insert error:", insertError);
      return NextResponse.json({ message: "Failed to save rating" }, { status: 500 });
    }

    // Notify the rated user (non-blocking)
    try {
      const ratedEmail = await getUserEmail(supabase, rated_user_id);
      if (ratedEmail) {
        await notifyUser(supabase, {
          recipientId: rated_user_id,
          recipientEmail: ratedEmail,
          type: "rating_received",
          title: "You received a new rating",
          body: `You got a ${score}-star rating${sanitizedComment ? `: "${sanitizedComment}"` : "."}`,
          dealId: deal_id,
        });
      }
    } catch (notifErr) {
      console.error("Rating notification error (non-fatal):", notifErr);
    }

    return NextResponse.json({ rating }, { status: 201 });
  } catch (err) {
    console.error("POST /api/ratings error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
