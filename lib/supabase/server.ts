import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "./database.types";

export type Profile = {
  id: string;
  full_name: string | null;
  college_name: string | null;
  college_email: string | null;
  college_domain: string | null;
  verification_status: "pending" | "verified" | "rejected";
  created_at: string;
  updated_at: string;
};

/**
 * Especially important if using Fluid compute: Don't put this client in a
 * global variable. Always create a new client within each function when using
 * it.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have proxy refreshing
            // user sessions.
          }
        },
      },
    },
  );
}

export async function getCurrentUserProfile() {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { profile: null, error: userError ?? new Error("User not found") };
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single<Profile>();

  return { profile, error };
}

export async function getCurrentUserVerificationStatus() {
  const { profile, error } = await getCurrentUserProfile();

  if (error || !profile) {
    return { status: null, profile: null, error };
  }

  return {
    status: profile.verification_status,
    profile,
    error: null,
  };
}
