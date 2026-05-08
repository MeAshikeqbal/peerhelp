import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const BUCKET = "verification-documents";

/**
 * Cron-driven purge of expired verification ID documents.
 * Removes objects whose `document_purge_at` has elapsed and clears the path.
 *
 * Auth: header `Authorization: Bearer ${CRON_SECRET}`.
 */
export async function POST(request: Request) {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    return NextResponse.json(
      { message: "CRON_SECRET not configured" },
      { status: 500 },
    );
  }
  const auth = request.headers.get("authorization") ?? "";
  if (auth !== `Bearer ${expected}`) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();

  const { data: rows, error } = await admin
    .from("college_verifications")
    .select("id, id_document_path, document_purge_at")
    .lte("document_purge_at", new Date().toISOString())
    .not("id_document_path", "is", null)
    .limit(500);

  if (error) {
    console.error("purge select error:", error);
    return NextResponse.json({ message: "Query failed" }, { status: 500 });
  }

  let purged = 0;
  const failures: string[] = [];

  for (const row of rows ?? []) {
    if (!row.id_document_path) continue;
    const { error: removeError } = await admin.storage
      .from(BUCKET)
      .remove([row.id_document_path]);
    if (removeError) {
      console.error(`purge remove failed for ${row.id}:`, removeError);
      failures.push(row.id);
      continue;
    }

    const { error: updateError } = await admin
      .from("college_verifications")
      .update({ id_document_path: null, document_purge_at: null })
      .eq("id", row.id);
    if (updateError) {
      console.error(`purge update failed for ${row.id}:`, updateError);
      failures.push(row.id);
      continue;
    }

    await admin.from("verification_audit_log").insert({
      verification_id: row.id,
      actor_user_id: null,
      action: "document_purged",
      reason: "Auto-purge after retention window",
    });

    purged += 1;
  }

  return NextResponse.json({ purged, failures });
}

// Allow GET as a health/manual trigger when used by Vercel Cron (which uses GET).
export async function GET(request: Request) {
  return POST(request);
}
