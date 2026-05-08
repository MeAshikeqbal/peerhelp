import type { DB } from "./_db";

/**
 * Returns whether the current authenticated user is an admin.
 * Calls the SECURITY DEFINER `is_admin()` SQL function.
 */
export async function isAdmin(supabase: DB): Promise<boolean> {
  const { data, error } = await supabase.rpc("is_admin");
  if (error) {
    console.error("[isAdmin] RPC error:", error);
    return false;
  }
  return data === true;
}

/** Like isAdmin, but checks for super-admin role. */
export async function isSuperAdmin(supabase: DB): Promise<boolean> {
  const { data, error } = await supabase.rpc("is_super_admin");
  if (error) {
    console.error("[isSuperAdmin] RPC error:", error);
    return false;
  }
  return data === true;
}
