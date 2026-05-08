import type { DB } from "./_db";

/** Returns the currently authenticated user, or null. */
export async function getCurrentUser(supabase: DB) {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  return { user: error ? null : user, error };
}
