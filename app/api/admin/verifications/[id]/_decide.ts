import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/utils/query/auth";
import { isAdmin } from "@/utils/query/admin";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { sendNotificationEmail } from "@/lib/email/send-notification-email";

type Decision = "approved" | "rejected" | "requested_changes";

const META: Record<
  Decision,
  {
    emailType:
      | "verification_approved"
      | "verification_rejected"
      | "verification_changes_requested";
    title: string;
    body: (reason: string | null) => string;
    requireReason: boolean;
  }
> = {
  approved: {
    emailType: "verification_approved",
    title: "You're verified on PeerHelp",
    body: () =>
      "Your student verification has been approved. You can now post listings and request deals.",
    requireReason: false,
  },
  rejected: {
    emailType: "verification_rejected",
    title: "Verification not approved",
    body: (reason) =>
      reason
        ? `Your verification was not approved.\n\nReason: ${reason}\n\nIf you believe this is a mistake, contact support.`
        : "Your verification was not approved. If you believe this is a mistake, contact support.",
    requireReason: true,
  },
  requested_changes: {
    emailType: "verification_changes_requested",
    title: "More info needed for your verification",
    body: (reason) =>
      reason
        ? `An admin has requested changes to your verification before it can be approved.\n\n${reason}\n\nVisit your verification page to upload an updated document.`
        : "An admin has requested changes to your verification. Visit your verification page to upload an updated document.",
    requireReason: true,
  },
};

export async function decide(
  request: Request,
  verificationId: string,
  decision: Decision,
) {
  const supabase = await createClient();
  const { user } = await getCurrentUser(supabase);
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  if (!(await isAdmin(supabase))) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const meta = META[decision];

  const body = await request.json().catch(() => ({}));
  const reason: string | null =
    typeof body?.reason === "string" && body.reason.trim().length > 0
      ? body.reason.trim()
      : null;

  if (meta.requireReason && !reason) {
    return NextResponse.json({ message: "reason is required" }, { status: 400 });
  }
  if (reason && reason.length > 2000) {
    return NextResponse.json({ message: "reason must be 2000 characters or fewer" }, { status: 400 });
  }

  // Rate limit: 60 admin decisions per hour per actor
  const rl = await checkRateLimit(
    supabase,
    user.id,
    "admin_decision",
    60,
    60 * 60 * 1000,
  );
  if (!rl.allowed) return rateLimitResponse(rl);

  // Document retention is now centralised:
  //   * the RPC sets document_purge_at per-decision
  //   * the cron at /api/admin/cron/purge-documents is the sole deleter
  // We deliberately do NOT remove storage objects synchronously here, so
  // admins/users have an audit and appeal window before the document is gone.

  // Build the in-app notification body once and pass to both the RPC and the
  // email so users see identical copy across channels.
  const notifTitle = meta.title;
  const notifBody = meta.body(reason);

  const { data: rpcData, error: rpcError } = await supabase.rpc(
    "admin_decide_verification",
    {
      p_verification_id: verificationId,
      p_decision: decision,
      p_reason: reason ?? undefined,
      p_notif_title: notifTitle,
      p_notif_body: notifBody,
    },
  );

  if (rpcError) {
    console.error("admin_decide_verification error:", rpcError);
    return NextResponse.json(
      { message: rpcError.message || "Decision failed" },
      { status: 500 },
    );
  }

  const result = rpcData as {
    success: boolean;
    decision?: string;
    user_id?: string;
    code?: string;
    message?: string;
  } | null;

  if (!result || !result.success) {
    return NextResponse.json(
      { message: result?.message ?? "Decision failed", code: result?.code },
      { status: 400 },
    );
  }

  // Send email (best-effort).
  if (result.user_id) {
    const admin = createAdminClient();
    try {
      const { data: targetUser } = await admin.auth.admin.getUserById(
        result.user_id,
      );
      const targetEmail = targetUser?.user?.email;
      if (targetEmail) {
        await sendNotificationEmail({
          to: targetEmail,
          type: meta.emailType,
          title: notifTitle,
          body: notifBody,
        });
      }
    } catch (err) {
      console.error("verification email send failed:", err);
    }
  }

  return NextResponse.json({
    success: true,
    decision: result.decision,
    userId: result.user_id,
  });
}
