import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/utils/query/auth";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";

const BUCKET = "verification-documents";
const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);
// {uuid}/{uuid}.{ext}
const SAFE_PATH =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|jpeg|png|webp|pdf)$/i;

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { user, error: userError } = await getCurrentUser(supabase);
    if (userError || !user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const path: string = typeof body?.path === "string" ? body.path : "";
    const verificationId: string =
      typeof body?.verificationId === "string" ? body.verificationId : "";

    if (!path || !verificationId) {
      return NextResponse.json(
        { message: "path and verificationId required" },
        { status: 400 },
      );
    }

    // Path ownership: must live under {userId}/... AND match the strict shape
    // produced by /upload-url ({uuid}/{uuid}.{ext}).
    const ownerPrefix = `${user.id}/`;
    if (!path.startsWith(ownerPrefix) || !SAFE_PATH.test(path)) {
      return NextResponse.json({ message: "Forbidden path" }, { status: 403 });
    }

    // Rate limit: 10 successful confirms per hour per user.
    const rl = await checkRateLimit(
      supabase,
      user.id,
      "verification_upload",
      10,
      60 * 60 * 1000,
    );
    if (!rl.allowed) return rateLimitResponse(rl);

    // Check the verification row belongs to user and is the right state.
    const { data: verification, error: vError } = await supabase
      .from("college_verifications")
      .select("id, user_id, verification_method, status")
      .eq("id", verificationId)
      .maybeSingle();

    if (vError || !verification) {
      return NextResponse.json({ message: "Verification not found" }, { status: 404 });
    }
    if (verification.user_id !== user.id) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    if (
      verification.verification_method !== "manual_review" ||
      verification.status !== "pending"
    ) {
      return NextResponse.json(
        { message: "Verification is not awaiting a document" },
        { status: 400 },
      );
    }

    const admin = createAdminClient();

    // Validate the uploaded object: size, mime.
    const folder = path.substring(0, path.lastIndexOf("/")) || user.id;
    const filename = path.substring(path.lastIndexOf("/") + 1);

    const { data: list, error: listError } = await admin.storage
      .from(BUCKET)
      .list(folder, { search: filename, limit: 1 });

    if (listError || !list || list.length === 0) {
      return NextResponse.json({ message: "Uploaded file not found" }, { status: 400 });
    }

    const obj = list[0];
    const meta = obj.metadata as { size?: number; mimetype?: string } | null;
    const size = meta?.size ?? 0;
    const mime = (meta?.mimetype ?? "").toLowerCase();

    const valid = size > 0 && size <= MAX_BYTES && ALLOWED_MIME.has(mime);
    if (!valid) {
      // Reject: delete the object.
      await admin.storage.from(BUCKET).remove([path]);
      return NextResponse.json(
        { message: "File failed validation (size or type)." },
        { status: 400 },
      );
    }

    // If a previous document existed for this verification, delete it.
    const { data: existing } = await supabase
      .from("college_verifications")
      .select("id_document_path")
      .eq("id", verificationId)
      .single();

    if (existing?.id_document_path && existing.id_document_path !== path) {
      await admin.storage.from(BUCKET).remove([existing.id_document_path]);
    }

    // Update the verification row.
    const { error: updateError } = await supabase
      .from("college_verifications")
      .update({ id_document_path: path })
      .eq("id", verificationId)
      .eq("user_id", user.id);

    if (updateError) {
      console.error("confirm: update verification failed", updateError);
      return NextResponse.json({ message: "Failed to record upload" }, { status: 500 });
    }

    // Audit log
    await supabase.rpc("log_verification_document_upload", {
      p_verification_id: verificationId,
    });

    // If the user was previously rejected, flip their profile flag back to
    // pending now that a fresh document has been validated. This is the only
    // place that resets the profile — keeping it here ensures abandoned
    // /upload-url calls never silently clear a rejection.
    const { data: profile } = await admin
      .from("profiles")
      .select("verification_status")
      .eq("id", user.id)
      .maybeSingle();
    if (profile?.verification_status === "rejected") {
      await admin
        .from("profiles")
        .update({ verification_status: "pending" })
        .eq("id", user.id);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("confirm: unexpected error", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
