import type { DB } from "./_db";
import type { TablesInsert } from "@/lib/supabase/database.types";

export type RatingInsert = TablesInsert<"ratings">;

/** All rating scores for a seller (used to compute avg + count). */
export async function getSellerRatings(
  supabase: DB,
  sellerUserId: string,
) {
  return supabase
    .from("ratings")
    .select("score")
    .eq("rated_user_id", sellerUserId);
}

/** Deal ids that the current user has already rated (prevents double-rating). */
export async function getRatedDealIds(
  supabase: DB,
  raterId: string,
  dealIds: string[],
) {
  return supabase
    .from("ratings")
    .select("deal_id")
    .eq("rater_id", raterId)
    .in("deal_id", dealIds);
}

/** Insert a new rating. */
export async function createRating(
  supabase: DB,
  data: RatingInsert,
) {
  return supabase.from("ratings").insert(data);
}

/** Ratings with rater name and comment for a seller's public profile. */
export async function getSellerRatingsWithComments(
  supabase: DB,
  sellerUserId: string,
) {
  return supabase
    .from("ratings")
    .select("id, score, comment, created_at, rater_id")
    .eq("rated_user_id", sellerUserId)
    .order("created_at", { ascending: false })
    .limit(20);
}
