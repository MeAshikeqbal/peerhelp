import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/utils/query/auth";
import { isAdmin } from "@/utils/query/admin";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { user } = await getCurrentUser(supabase);
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  if (!(await isAdmin(supabase))) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") ?? "pending";
  const method = searchParams.get("method") ?? "manual_review";

  let query = supabase
    .from("college_verifications")
    .select(
      `id, user_id, college_email, email_domain, status, verification_method,
       id_document_path, reviewed_by, reviewed_at, review_notes, document_purge_at,
       notes, created_at, updated_at,
       profiles ( id, full_name, college_name, college_email, college_domain, verification_status )`,
    )
    .eq("verification_method", method)
    .order("created_at", { ascending: false })
    .limit(100);

  if (status !== "all") {
    query = query.eq("status", status as "pending" | "verified" | "rejected");
  }

  const { data, error } = await query;
  if (error) {
    console.error("admin verifications list error:", error);
    return NextResponse.json({ message: "Failed to load" }, { status: 500 });
  }

  return NextResponse.json({ verifications: data ?? [] });
}
