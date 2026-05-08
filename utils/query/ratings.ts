import type { DB } from "./_db";
import type { TablesInsert } from "@/lib/supabase/database.types";

export type RatingInsert = TablesInsert<"ratings">;

/** All rating scores for a user (used to compute avg + count). */
export async function getUserRatings(
  supabase: DB,
  userId: string,
) {
  return supabase
    .from("ratings")
    .select("score")
    .eq("rated_user_id", userId);
}

/** Batch-fetch rating scores for multiple users in one query. */
export async function getUserRatingsBatch(
  supabase: DB,
  userIds: string[],
) {
  if (userIds.length === 0) {
    return { data: [] as { rated_user_id: string; score: number }[], error: null };
  }
  return supabase
    .from("ratings")
    .select("rated_user_id, score")
    .in("rated_user_id", userIds);
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

/** Ratings with rater name and comment for a user's public profile. */
export async function getUserRatingsWithComments(
  supabase: DB,
  userId: string,
) {
  return supabase
    .from("ratings")
    .select("id, score, comment, created_at, rater_id")
    .eq("rated_user_id", userId)
    .order("created_at", { ascending: false })
    .limit(20);
}
