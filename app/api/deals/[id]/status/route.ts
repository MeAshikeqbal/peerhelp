import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/utils/query/auth";
import { getDealById, updateDealStatus, cancelOtherPendingDeals, type DealStatus } from "@/utils/query/deals";
import { updateListing, getListingById } from "@/utils/query/listings";
import { getUserEmail } from "@/utils/query/profiles";
import { notifyUser } from "@/lib/notifications/notify";
import { checkRateLimit } from "@/lib/rate-limit";

const STATUS_UPDATE_WINDOW_MS = 60 * 60 * 1000;
const STATUS_UPDATE_MAX = 30;

// Valid status transitions per role
const VALID_TRANSITIONS: Record<string, Record<string, DealStatus[]>> = {
  seller: {
    pending: ["accepted", "cancelled"],
    accepted: ["completed"],
  },
  buyer: {
    pending: ["cancelled"],
  },
};

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { user, error: userError } = await getCurrentUser(supabase);

    if (userError || !user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const rate = await checkRateLimit(
      supabase,
      user.id,
      "deal_status_update",
      STATUS_UPDATE_MAX,
      STATUS_UPDATE_WINDOW_MS,
    );
    if (!rate.allowed) {
      return NextResponse.json(
        {
          message: "Too many status updates. Please slow down and try again shortly.",
          retryAfter: rate.retryAfter,
          nextRetryAt: rate.nextRetryAt,
        },
        { status: 429, headers: { "Retry-After": String(rate.retryAfter ?? 60) } },
      );
    }

    const body = await request.json();
    const { status: newStatus } = body;

    if (!newStatus || typeof newStatus !== "string") {
      return NextResponse.json({ message: "Missing status" }, { status: 400 });
    }

    const { data: deal } = await getDealById(supabase, id);

    if (!deal) {
      return NextResponse.json({ message: "Deal not found" }, { status: 404 });
    }

    const previousStatus = deal.status;

    let role: "seller" | "buyer" | null = null;
    if (deal.seller_id === user.id) role = "seller";
    else if (deal.buyer_id === user.id) role = "buyer";

    if (!role) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const allowed = VALID_TRANSITIONS[role]?.[deal.status] ?? [];
    if (!allowed.includes(newStatus as DealStatus)) {
      return NextResponse.json(
        { message: "This action is not allowed for the current deal state" },
        { status: 400 }
      );
    }

    const { error: updateError } = await updateDealStatus(supabase, id, newStatus as DealStatus);

    if (updateError) {
      console.error("Deal update error:", updateError);
      return NextResponse.json(
        { message: "Failed to update deal" },
        { status: 500 }
      );
    }

    // For rental deals, set rental dates when accepted and return_confirmed_at when completed
    const listing = deal.listing_id ? (await getListingById(supabase, deal.listing_id)).data : null;
    const isRental = listing?.transaction_type === "rental";

    if (isRental && newStatus === "accepted" && deal.proposed_days) {
      // Use buyer's proposed start date if provided and still valid; otherwise default to today.
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      let start = todayStart;
      if (deal.proposed_start_date) {
        const proposedMs = Date.parse(deal.proposed_start_date + "T00:00:00");
        if (!isNaN(proposedMs) && proposedMs >= todayStart.getTime()) {
          start = new Date(proposedMs);
        }
      }
      const end = new Date(start);
      end.setDate(end.getDate() + deal.proposed_days);
      const toDateStr = (d: Date) => d.toISOString().split("T")[0];
      const { error: rentalDatesError } = await supabase
        .from("deals")
        .update({
          rental_start_date: toDateStr(start),
          rental_end_date: toDateStr(end),
        })
        .eq("id", id);
      if (rentalDatesError) {
        console.error("Failed to set rental dates:", rentalDatesError);
      }
    }

    if (isRental && newStatus === "completed") {
      const { error: returnErr } = await supabase
        .from("deals")
        .update({ return_confirmed_at: new Date().toISOString() })
        .eq("id", id);
      if (returnErr) {
        console.error("Failed to set return_confirmed_at:", returnErr);
      }
    }

    // Sync listing.status with the deal lifecycle
    let nextListingStatus: "active" | "reserved" | "sold" | "archived" | null = null;
    if (newStatus === "completed") nextListingStatus = isRental ? "archived" : "sold";
    else if (newStatus === "accepted") nextListingStatus = "reserved";
    else if (newStatus === "cancelled" && previousStatus === "accepted") {
      nextListingStatus = "active";
    }

    if (nextListingStatus && deal.listing_id) {
      const { error: listingUpdateError } = await updateListing(supabase, deal.listing_id, { status: nextListingStatus });

      if (listingUpdateError) {
        // Deal is already updated; log but do not fail the request
        console.error(
          "Listing status sync failed:",
          listingUpdateError,
          { dealId: id, listingId: deal.listing_id, nextListingStatus }
        );
      }
    }

    // When a deal is accepted, cancel all other pending deals for the same
    // listing so buyers aren't left waiting indefinitely.
    if (newStatus === "accepted" && deal.listing_id) {
      const { error: cancelError } = await cancelOtherPendingDeals(supabase, deal.listing_id, id);
      if (cancelError) {
        console.error("Failed to cancel sibling pending deals:", cancelError, { dealId: id, listingId: deal.listing_id });
      }
    }

    // Fire notifications (non-blocking — errors are logged but don't fail the response)
    try {
      const recipientId =
        role === "seller" ? deal.buyer_id : deal.seller_id;

      const [recipientEmail, listingData] = await Promise.all([
        getUserEmail(supabase, recipientId),
        deal.listing_id ? getListingById(supabase, deal.listing_id) : null,
      ]);
      const listingTitle = listingData?.data?.title ?? "a listing";

      if (recipientEmail) {
        const notifMap: Record<
          string,
          { type: Parameters<typeof notifyUser>[1]["type"]; title: string; body: string }
        > = {
          accepted: {
            type: "deal_accepted",
            title: "Your deal request was accepted",
            body: isRental
              ? `Your rental request for "${listingTitle}" has been accepted. Get in touch with the owner to arrange pick-up.`
              : `Your request for "${listingTitle}" has been accepted. Get in touch with the seller to arrange the handover.`,
          },
          declined: {
            type: "deal_declined",
            title: "Your deal request was declined",
            body: `Unfortunately, your request for "${listingTitle}" was declined. Check the marketplace for other listings.`,
          },
          cancelled: {
            type: "deal_cancelled",
            title: "A deal was cancelled",
            body: `The deal for "${listingTitle}" has been cancelled.`,
          },
          completed: {
            type: "deal_completed",
            title: "Deal completed",
            body: `Your deal for "${listingTitle}" is marked as complete. Don't forget to leave a rating!`,
          },
          // Notify seller when buyer requests a deal
          pending_for_seller: {
            type: "deal_requested",
            title: "New deal request",
            body: `Someone wants to buy your listing "${listingTitle}". Review the request and accept or decline.`,
          },
        };

        // Map status → notification key
        let notifKey = newStatus;
        // When a buyer changes status to pending (new request), notify seller
        if (newStatus === "pending" && role === "buyer") {
          notifKey = "pending_for_seller";
        }

        const notif = notifMap[notifKey];
        if (notif) {
          await notifyUser(supabase, {
            recipientId,
            recipientEmail,
            type: notif.type,
            title: notif.title,
            body: notif.body,
            dealId: id,
            listingId: deal.listing_id ?? undefined,
          });
        }
      }
    } catch (notifErr) {
      console.error("Notification dispatch error (non-fatal):", notifErr);
    }

    return NextResponse.json({ message: "Deal updated" });
  } catch (error) {
    console.error("Error updating deal status:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
