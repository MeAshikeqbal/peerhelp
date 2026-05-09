import type { DB } from "./_db";
import type { TablesInsert, Enums } from "@/lib/supabase/database.types";

export type DealStatus = Enums<"deal_status">;
export type DealInsert = TablesInsert<"deals">;

/** Fetch a single deal by id. */
export async function getDealById(
  supabase: DB,
  id: string,
) {
  return supabase
    .from("deals")
    .select("id, status, buyer_id, seller_id, listing_id, proposed_days, proposed_start_date, rental_start_date, rental_end_date, return_confirmed_at")
    .eq("id", id)
    .single();
}

/** All deals where the user is the buyer. */
export async function getBuyerDeals(
  supabase: DB,
  userId: string,
) {
  return supabase
    .from("deals")
    .select("id, status, created_at, listing_id, buyer_id, seller_id, proposed_days, proposed_start_date, rental_start_date, rental_end_date, return_confirmed_at")
    .eq("buyer_id", userId)
    .order("created_at", { ascending: false });
}

/** All deals where the user is the seller. */
export async function getSellerDeals(
  supabase: DB,
  userId: string,
) {
  return supabase
    .from("deals")
    .select("id, status, created_at, listing_id, buyer_id, seller_id, proposed_days, proposed_start_date, rental_start_date, rental_end_date, return_confirmed_at")
    .eq("seller_id", userId)
    .order("created_at", { ascending: false });
}

/** Deals for a specific listing (seller view). */
export async function getDealsByListing(
  supabase: DB,
  listingId: string,
) {
  return supabase
    .from("deals")
    .select("id, status, buyer_id, created_at, proposed_days")
    .eq("listing_id", listingId);
}

/** The buyer's deal for a specific listing (to check if already requested). */
export async function getBuyerDealForListing(
  supabase: DB,
  listingId: string,
  buyerId: string,
) {
  return supabase
    .from("deals")
    .select("id, status, buyer_id, created_at, proposed_days, proposed_start_date, rental_start_date, rental_end_date, return_confirmed_at")
    .eq("listing_id", listingId)
    .eq("buyer_id", buyerId)
    .maybeSingle();
}

/** Count all deals the user is party to (buyer or seller). */
export async function countUserDeals(
  supabase: DB,
  userId: string,
) {
  return supabase
    .from("deals")
    .select("*", { count: "exact", head: true })
    .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`);
}

/**
 * True if the listing has any deal in `pending`, `accepted`, or `completed`
 * state — i.e. a buyer has submitted a request and the listing should be
 * partially locked against edits that would change what the buyer sees.
 */
export async function hasBlockingDeal(
  supabase: DB,
  listingId: string,
): Promise<boolean> {
  const { count, error } = await supabase
    .from("deals")
    .select("id", { count: "exact", head: true })
    .eq("listing_id", listingId)
    .in("status", ["pending", "accepted", "completed"]);
  if (error) {
    console.error("hasBlockingDeal error:", error);
    return false;
  }
  return (count ?? 0) > 0;
}

/** Check if a pending deal already exists for this buyer + listing. */
export async function getPendingDeal(
  supabase: DB,
  listingId: string,
  buyerId: string,
) {
  return supabase
    .from("deals")
    .select("id")
    .eq("listing_id", listingId)
    .eq("buyer_id", buyerId)
    .eq("status", "pending")
    .maybeSingle();
}

/** Insert a new deal. */
export async function createDeal(
  supabase: DB,
  data: DealInsert,
) {
  return supabase.from("deals").insert(data).select().single();
}

/** Update a deal's status. */
export async function updateDealStatus(
  supabase: DB,
  id: string,
  status: DealStatus,
) {
  return supabase.from("deals").update({ status }).eq("id", id);
}

/**
 * When a seller accepts one deal, bulk-cancel every other pending deal
 * for the same listing so buyers aren't left hanging indefinitely.
 */
export async function cancelOtherPendingDeals(
  supabase: DB,
  listingId: string,
  acceptedDealId: string,
) {
  return supabase
    .from("deals")
    .update({ status: "cancelled" })
    .eq("listing_id", listingId)
    .eq("status", "pending")
    .neq("id", acceptedDealId);
}

/**
 * Get the deal counterpart's phone number via a security-definer RPC.
 * Returns null if the caller is not a party to the deal or the deal
 * status is not 'accepted' or 'completed'.
 */
export async function getDealContactPhone(
  supabase: DB,
  dealId: string,
) {
  return supabase.rpc("get_deal_contact_phone", { p_deal_id: dealId });
}
