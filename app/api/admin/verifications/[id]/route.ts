import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/utils/query/auth";
import { isAdmin } from "@/utils/query/admin";

const BUCKET = "verification-documents";
const SIGNED_URL_TTL = 60 * 5; // 5 minutes

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const supabase = await createClient();
  const { user } = await getCurrentUser(supabase);
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  if (!(await isAdmin(supabase))) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const { data: verification, error } = await supabase
    .from("college_verifications")
    .select(
      `id, user_id, college_email, email_domain, status, verification_method,
       id_document_path, reviewed_by, reviewed_at, review_notes, document_purge_at,
       notes, created_at, updated_at,
       profiles ( id, full_name, college_name, college_email, college_domain, verification_status )`,
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("admin verification detail error:", error);
    return NextResponse.json({ message: "Failed to load" }, { status: 500 });
  }
  if (!verification) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  const { data: auditLog } = await supabase
    .from("verification_audit_log")
    .select("id, actor_user_id, action, reason, created_at")
    .eq("verification_id", id)
    .order("created_at", { ascending: false });

  // Generate a short-lived signed URL for the ID document, if present.
  let documentUrl: string | null = null;
  if (verification.id_document_path) {
    const admin = createAdminClient();
    const { data: signed } = await admin.storage
      .from(BUCKET)
      .createSignedUrl(verification.id_document_path, SIGNED_URL_TTL);
    documentUrl = signed?.signedUrl ?? null;
  }

  return NextResponse.json({
    verification,
    auditLog: auditLog ?? [],
    documentUrl,
  });
}
