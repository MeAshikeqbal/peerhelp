import type { DB } from "./_db";
import type { TablesInsert } from "@/lib/supabase/database.types";

export type VerificationInsert = TablesInsert<"college_verifications">;

/**
 * Marks all pending verification records for a user as rejected with a
 * "superseded" note. Call before inserting a new verification record.
 * (The verification_status enum has no dedicated 'superseded' value.)
 */
export async function supersedeVerifications(
  supabase: DB,
  userId: string,
  method?: "otp" | "manual_review",
) {
  let query = supabase
    .from("college_verifications")
    .update({ status: "rejected", notes: "Superseded by new request" })
    .eq("user_id", userId)
    .eq("status", "pending");

  if (method) {
    query = query.eq("verification_method", method);
  }

  return query;
}

/** Insert a new college verification record. */
export async function createVerificationRecord(
  supabase: DB,
  data: VerificationInsert,
) {
  return supabase.from("college_verifications").insert(data).select("id").single();
}
