import type { DB } from "./_db";
import type { Tables } from "@/lib/supabase/database.types";

export type BlockedUser = Tables<"blocked_users">;

export async function blockUser(supabase: DB, userId: string, reason?: string) {
  return supabase.rpc("block_user", {
    p_user_id: userId,
    p_reason: reason ?? undefined,
  });
}

export async function unblockUser(supabase: DB, userId: string) {
  return supabase.rpc("unblock_user", { p_user_id: userId });
}

export async function getMyBlockedUsers(supabase: DB) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase
    .from("blocked_users")
    .select("blocked_id, reason, created_at")
    .eq("blocker_id", user.id)
    .order("created_at", { ascending: false });
  if (error) {
    console.error("[getMyBlockedUsers]", error);
    return [];
  }
  return data ?? [];
}

export async function isBlockedByMe(
  supabase: DB,
  otherUserId: string,
): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { data } = await supabase
    .from("blocked_users")
    .select("blocked_id")
    .eq("blocker_id", user.id)
    .eq("blocked_id", otherUserId)
    .maybeSingle();
  return !!data;
}
