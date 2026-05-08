import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/utils/query/auth";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";

const BUCKET = "verification-documents";
const ALLOWED_EXT = new Set(["jpg", "jpeg", "png", "webp", "pdf"]);

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { user, error: userError } = await getCurrentUser(supabase);
    if (userError || !user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Rate limit: 10 signed-URL requests per hour per user.
    const rl = await checkRateLimit(
      supabase,
      user.id,
      "verification_upload",
      10,
      60 * 60 * 1000,
    );
    if (!rl.allowed) return rateLimitResponse(rl);

    const body = await request.json().catch(() => ({}));
    const filename: string = typeof body?.filename === "string" ? body.filename : "";
    const ext = filename.split(".").pop()?.toLowerCase() ?? "";
    if (!ALLOWED_EXT.has(ext)) {
      return NextResponse.json(
        { message: "File type not allowed. Use JPG, PNG, WEBP, or PDF." },
        { status: 400 },
      );
    }

    // Look for a pending manual_review row first.
    const { data: pendingRow, error: vError } = await supabase
      .from("college_verifications")
      .select("id, status, verification_method")
      .eq("user_id", user.id)
      .eq("verification_method", "manual_review")
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (vError) {
      console.error("upload-url: verification lookup failed", vError);
      return NextResponse.json({ message: "Lookup failed" }, { status: 500 });
    }

    let verification = pendingRow;

    // If no pending row, allow rejected users to restart by creating a fresh
    // manual_review row cloned from their most recent rejected submission.
    if (!verification) {
      const { data: lastRejected } = await supabase
        .from("college_verifications")
        .select("college_email, email_domain")
        .eq("user_id", user.id)
        .eq("verification_method", "manual_review")
        .eq("status", "rejected")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!lastRejected) {
        return NextResponse.json(
          { message: "No pending manual review found" },
          { status: 404 },
        );
      }

      const { data: created, error: insertError } = await supabase
        .from("college_verifications")
        .insert({
          user_id: user.id,
          college_email: lastRejected.college_email,
          email_domain: lastRejected.email_domain,
          method: "manual_review",
          verification_method: "manual_review",
          status: "pending",
        })
        .select("id, status, verification_method")
        .single();

      if (insertError) {
        // 23505 = unique violation from the partial index that prevents more
        // than one pending manual_review row per user. Race-safe recovery: a
        // concurrent /upload-url call won, so re-fetch the pending row.
        if ((insertError as { code?: string }).code === "23505") {
          const { data: existing } = await supabase
            .from("college_verifications")
            .select("id, status, verification_method")
            .eq("user_id", user.id)
            .eq("verification_method", "manual_review")
            .eq("status", "pending")
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();
          if (existing) {
            verification = existing;
          } else {
            console.error("upload-url: 23505 but no pending row found");
            return NextResponse.json(
              { message: "Could not start a new review" },
              { status: 500 },
            );
          }
        } else {
          console.error("upload-url: failed to create fresh row", insertError);
          return NextResponse.json(
            { message: "Could not start a new review" },
            { status: 500 },
          );
        }
      } else if (!created) {
        return NextResponse.json(
          { message: "Could not start a new review" },
          { status: 500 },
        );
      } else {
        verification = created;
      }

      // Profile flag stays 'rejected' until /confirm validates the new upload.
    }

    const objectPath = `${user.id}/${crypto.randomUUID()}.${ext}`;

    const admin = createAdminClient();
    const { data: signed, error: signError } = await admin.storage
      .from(BUCKET)
      .createSignedUploadUrl(objectPath);

    if (signError || !signed) {
      console.error("upload-url: createSignedUploadUrl failed", signError);
      return NextResponse.json({ message: "Could not create upload URL" }, { status: 500 });
    }

    return NextResponse.json({
      verificationId: verification.id,
      bucket: BUCKET,
      path: objectPath,
      token: signed.token,
      signedUrl: signed.signedUrl,
    });
  } catch (err) {
    console.error("upload-url: unexpected error", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
