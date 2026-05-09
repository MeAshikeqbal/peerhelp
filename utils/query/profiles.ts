import type { DB } from "./_db";
import type { TablesUpdate, Enums } from "@/lib/supabase/database.types";

export type ProfileUpdate = TablesUpdate<"profiles">;
export type VerificationStatus = Enums<"verification_status">;

/** Full profile row for the current user. */
export async function getProfileById(
  supabase: DB,
  userId: string,
) {
  return supabase
    .from("profiles")
    .select("id, full_name, college_name, college_email, verification_status, avatar_url")
    .eq("id", userId)
    .single();
}

/**
 * Get the current authenticated user's own phone number.
 * Uses a SECURITY DEFINER RPC because SELECT (phone_number) is revoked
 * from the authenticated role to prevent enumeration by other users.
 */
export async function getOwnPhone(supabase: DB) {
  return supabase.rpc("get_own_phone");
}

/** Minimal check — only fetches verification_status. */
export async function getVerificationStatus(
  supabase: DB,
  userId: string,
) {
  return supabase
    .from("profiles")
    .select("verification_status")
    .eq("id", userId)
    .maybeSingle();
}

/** Seller profile for a listing detail page (accepts the listing owner's user id). */
export async function getSellerProfile(
  supabase: DB,
  sellerUserId: string,
) {
  return supabase
    .from("profiles")
    .select("full_name, college_name, avatar_url")
    .eq("id", sellerUserId)
    .single();
}

/** Fetch multiple profiles by id (e.g. for deal counterpart name resolution). */
export async function getProfilesByIds(
  supabase: DB,
  ids: string[],
) {
  return supabase
    .from("profiles")
    .select("id, full_name, avatar_url")
    .in("id", ids);
}

/** Fetch peer user ids who belong to the same college. */
export async function getPeerIdsByCollege(
  supabase: DB,
  collegeName: string,
) {
  return supabase
    .from("profiles")
    .select("id")
    .eq("college_name", collegeName);
}

/** Update profile fields (pass only the columns you want to change). */
export async function updateProfile(
  supabase: DB,
  userId: string,
  patch: ProfileUpdate,
) {
  return supabase
    .from("profiles")
    .update(patch)
    .eq("id", userId);
}

/** Reset verification — clears college_email and sets status back to pending. */
export async function resetVerification(
  supabase: DB,
  userId: string,
) {
  return supabase
    .from("profiles")
    .update({ college_email: null, verification_status: "pending" })
    .eq("id", userId);
}

/**
 * Get the auth email address for any user by ID.
 * Uses a SECURITY DEFINER RPC to access auth.users from an authenticated context.
 */
export async function getUserEmail(
  supabase: DB,
  userId: string,
): Promise<string | null> {
  const { data, error } = await supabase.rpc("get_user_email", { p_user_id: userId });
  if (error) {
    console.error("[getUserEmail]", error);
    return null;
  }
  return data as string | null;
}

/** Public profile view for seller/profile pages — name, college, joined date. */
export async function getPublicProfile(
  supabase: DB,
  userId: string,
) {
  return supabase
    .from("profiles")
    .select("id, full_name, college_name, created_at, avatar_url")
    .eq("id", userId)
    .single();
}
