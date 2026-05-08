import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

/** Typed Supabase client used by all query helpers. */
export type DB = SupabaseClient<Database>;
