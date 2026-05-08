import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/utils/query/auth";
import { getVerificationStatus, getUserEmail } from "@/utils/query/profiles";
import { getListingById } from "@/utils/query/listings";
import { getPendingDeal, createDeal } from "@/utils/query/deals";
import { notifyUser } from "@/lib/notifications/notify";
import { checkRateLimit } from "@/lib/rate-limit";

const DEAL_CREATE_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const DEAL_CREATE_MAX = 10;

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
      "deal_create",
      DEAL_CREATE_MAX,
      DEAL_CREATE_WINDOW_MS,
    );
    if (!rate.allowed) {
      return NextResponse.json(
        {
          message: "You're creating deal requests too quickly. Please wait and try again.",
          retryAfter: rate.retryAfter,
          nextRetryAt: rate.nextRetryAt,
        },
        { status: 429, headers: { "Retry-After": String(rate.retryAfter ?? 60) } },
      );
    }

    // Check if user is verified
    const { data: profile } = await getVerificationStatus(supabase, user.id);

    if (profile?.verification_status !== "verified") {
      return NextResponse.json(
        { message: "You must be verified to request deals" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { listing_id, proposed_days, proposed_start_date } = body;

    if (!listing_id) {
      return NextResponse.json(
        { message: "Missing listing_id" },
        { status: 400 }
      );
    }

    // Get listing
    const { data: listing } = await getListingById(supabase, listing_id);

    if (!listing) {
      return NextResponse.json(
        { message: "Listing not found" },
        { status: 404 }
      );
    }

    if (listing.status !== "active") {
      return NextResponse.json(
        { message: "This listing is no longer active" },
        { status: 400 }
      );
    }

    if (listing.user_id === user.id) {
      return NextResponse.json(
        { message: "You cannot request to buy your own listing" },
        { status: 400 }
      );
    }

    // Rental listings require proposed_days; proposed_start_date is optional but if present must be a valid future date.
    const isRental = listing.transaction_type === "rental";
    let validatedStartDate: string | null = null;
    if (isRental) {
      const days = parseInt(proposed_days, 10);
      if (isNaN(days) || days < 1 || days > 365) {
        return NextResponse.json(
          { message: "proposed_days must be a number between 1 and 365 for rental listings" },
          { status: 400 }
        );
      }
      if (proposed_start_date != null) {
        if (typeof proposed_start_date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(proposed_start_date)) {
          return NextResponse.json(
            { message: "proposed_start_date must be a YYYY-MM-DD date" },
            { status: 400 }
          );
        }
        const startMs = Date.parse(proposed_start_date + "T00:00:00");
        if (isNaN(startMs)) {
          return NextResponse.json({ message: "Invalid proposed_start_date" }, { status: 400 });
        }
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        if (startMs < todayStart.getTime()) {
          return NextResponse.json(
            { message: "proposed_start_date cannot be in the past" },
            { status: 400 }
          );
        }
        validatedStartDate = proposed_start_date;
      }
    }

    // Check if buyer already has a pending deal for this listing
    const { data: existingDeal } = await getPendingDeal(supabase, listing_id, user.id);

    if (existingDeal) {
      return NextResponse.json(
        { message: "You already have a pending request for this listing" },
        { status: 400 }
      );
    }

    // Create deal
    const { data: deal, error: dealError } = await createDeal(supabase, {
      listing_id,
      buyer_id: user.id,
      seller_id: listing.user_id,
      status: "pending",
      proposed_days: isRental ? parseInt(proposed_days, 10) : null,
      proposed_start_date: isRental ? validatedStartDate : null,
    });

    if (dealError) {
      console.error("Deal creation error:", dealError);
      return NextResponse.json(
        { message: "Failed to create deal request" },
        { status: 500 }
      );
    }

    // Notify the seller of the new deal request (non-blocking)
    try {
      const sellerEmail = await getUserEmail(supabase, listing.user_id);
      if (sellerEmail) {
        await notifyUser(supabase, {
          recipientId: listing.user_id,
          recipientEmail: sellerEmail,
          type: "deal_requested",
          title: "New deal request",
          body: isRental
            ? `Someone wants to rent your listing "${listing.title}" for ${parseInt(proposed_days, 10)} day(s). Review the request and accept or decline.`
            : `Someone wants to buy your listing "${listing.title}". Review the request and accept or decline.`,
          dealId: deal?.id,
          listingId: listing_id,
        });
      }
    } catch (notifErr) {
      console.error("Notification dispatch error (non-fatal):", notifErr);
    }

    return NextResponse.json({ deal }, { status: 201 });
  } catch (error) {
    console.error("Error creating deal:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
