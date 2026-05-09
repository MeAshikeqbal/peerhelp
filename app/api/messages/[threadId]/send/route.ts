import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/utils/query/auth";
import {
  getThreadById,
  sendMessage as rpcSendMessage,
} from "@/utils/query/messages";
import { getProfileById, getUserEmail } from "@/utils/query/profiles";
import { checkRateLimit } from "@/lib/rate-limit";
import { sendNotificationEmail } from "@/lib/email/send-notification-email";

const MESSAGE_SEND_WINDOW_MS = 60 * 1000; // 1 minute
const MESSAGE_SEND_MAX = 30;
const EMAIL_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes per recipient

export async function POST(
  request: Request,
  { params }: { params: Promise<{ threadId: string }> },
) {
  const { threadId } = await params;
  const supabase = await createClient();
  const { user } = await getCurrentUser(supabase);
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const rate = await checkRateLimit(
    supabase,
    user.id,
    "message_send",
    MESSAGE_SEND_MAX,
    MESSAGE_SEND_WINDOW_MS,
  );
  if (!rate.allowed) {
    return NextResponse.json(
      {
        message: "You're sending messages too quickly. Please slow down.",
        retryAfter: rate.retryAfter,
      },
      { status: 429, headers: { "Retry-After": String(rate.retryAfter ?? 60) } },
    );
  }

  let payload: { body?: string };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
  }
  const body = (payload.body ?? "").trim();
  if (!body) {
    return NextResponse.json({ message: "Message cannot be empty" }, { status: 400 });
  }
  if (body.length > 2000) {
    return NextResponse.json({ message: "Message too long" }, { status: 400 });
  }

  // Send via RPC (handles participation, block, length, recipient_id, last_message_at).
  const { data: msg, error } = await rpcSendMessage(supabase, threadId, body);
  if (error || !msg) {
    const m = error?.message ?? "Failed to send";
    const status =
      m.includes("not_a_participant") || m.includes("blocked") ? 403
      : m.includes("body") || m.includes("empty") ? 400
      : m.includes("not_found") ? 404
      : 500;
    return NextResponse.json({ message: m }, { status });
  }

  const { data: thread } = await getThreadById(supabase, threadId);
  const recipientId =
    thread && thread.participant_a === user.id
      ? thread.participant_b
      : thread?.participant_a;

  // Fire-and-forget recipient notification + email (with per-recipient cooldown).
  if (recipientId) {
    void deliverNotification(supabase, {
      recipientId,
      threadId,
      senderId: user.id,
      preview: body,
    });
  }

  return NextResponse.json({ message: msg });
}

async function deliverNotification(
  supabase: Awaited<ReturnType<typeof createClient>>,
  args: {
    recipientId: string;
    threadId: string;
    senderId: string;
    preview: string;
  },
) {
  const { recipientId, threadId, senderId, preview } = args;
  try {
    const { data: senderProfile } = await getProfileById(supabase, senderId);
    const senderName = senderProfile?.full_name ?? "Someone";

    const title = `New message from ${senderName}`;
    const bodyText =
      preview.length > 140 ? preview.slice(0, 140) + "…" : preview;

    // Always insert in-app notification.
    await supabase.rpc("create_notification", {
      p_user_id: recipientId,
      p_type: "message_received",
      p_title: title,
      p_body: bodyText,
    });

    // Email cooldown: skip email if recipient got a message_received notif < 5 min ago.
    const cutoff = new Date(Date.now() - EMAIL_COOLDOWN_MS).toISOString();
    const { count } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", recipientId)
      .eq("type", "message_received")
      .gte("created_at", cutoff);

    // We just inserted one; if there is more than 1 within window, suppress email.
    if ((count ?? 0) > 1) return;

    // Check prefs.
    const { data: prefs } = await supabase.rpc("get_notification_prefs", {
      p_user_id: recipientId,
    });
    const prefsRow = prefs as { email_message_received?: boolean } | null;
    if (prefsRow && prefsRow.email_message_received === false) return;

    const recipientEmail = await getUserEmail(supabase, recipientId);
    if (!recipientEmail) return;

    await sendNotificationEmail({
      to: recipientEmail,
      type: "message_received",
      title,
      body: bodyText,
      dealId: threadId, // re-used as threadId for ctaHref
    });
  } catch (err) {
    console.error("[messages.send notify]", err);
  }
}
