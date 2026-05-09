import webPush from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";
import type { NotificationType } from "@/lib/notifications/notify";

let initialized = false;

function ensureInit() {
  if (initialized) return;

  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;

  if (!publicKey || !privateKey || !subject) {
    throw new Error(
      "Missing VAPID environment variables. Set VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, and VAPID_SUBJECT."
    );
  }

  webPush.setVapidDetails(subject, publicKey, privateKey);
  initialized = true;
}

const TYPE_URL: Record<NotificationType, string> = {
  deal_requested: "/dashboard/deals",
  deal_accepted: "/dashboard/deals",
  deal_declined: "/dashboard/deals",
  deal_cancelled: "/dashboard/deals",
  deal_completed: "/dashboard/deals",
  rating_received: "/dashboard/deals",
  verification_approved: "/student-verification",
  verification_rejected: "/student-verification",
  verification_changes_requested: "/student-verification",
  tutor_request_received: "/dashboard/tutors",
  tutor_request_responded: "/dashboard/tutors",
  message_received: "/dashboard/messages",
};

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  icon?: string;
  type?: NotificationType;
}

export async function sendPushToUser(
  userId: string,
  payload: PushPayload
): Promise<void> {
  try {
    ensureInit();
  } catch (err) {
    console.warn("Web Push not configured — skipping push sends.", err ?? "");
    return;
  }

  const admin = createAdminClient();
  const { data: subs, error } = await admin
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .eq("user_id", userId);

  if (error) {
    console.error("sendPushToUser: failed query push_subscriptions", error);
    return;
  }
  if (!subs || subs.length === 0) return;

  const targetUrl =
    payload.url ?? (payload.type ? TYPE_URL[payload.type] : "/dashboard");

  const notifPayload = JSON.stringify({
    title: payload.title,
    body: payload.body,
    url: targetUrl,
    icon: payload.icon ?? "/api/pwa/icon-192",
  });

  const sends = subs.map(async (sub) => {
    try {
      await webPush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        notifPayload
      );
    } catch (err) {
      // Prune expired/invalid subscriptions (410 Gone, 404 Not Found)
      const status = (err as { statusCode?: number }).statusCode;
      console.warn("sendPushToUser: push send error", { endpoint: sub.endpoint, status, err });
      if (status === 410 || status === 404) {
        try {
          await admin
            .from("push_subscriptions")
            .delete()
            .eq("endpoint", sub.endpoint);
          console.info("sendPushToUser: removed stale push subscription", sub.endpoint);
        } catch (delErr) {
          console.error("sendPushToUser: failed to delete stale subscription", delErr);
        }
      }
    }
  });

  await Promise.allSettled(sends);
}
