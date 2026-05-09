import type { SupabaseClient } from "@supabase/supabase-js";
import {
  sendNotificationEmail,
  type NotificationEmailType,
} from "@/lib/email/send-notification-email";
import { sendPushToUser } from "@/lib/push/server";

export type NotificationType = NotificationEmailType;

export interface NotifyParams {
  recipientId: string;
  recipientEmail: string;
  type: NotificationType;
  title: string;
  body: string;
  dealId?: string;
  listingId?: string;
}

/**
 * Creates an in-app notification for the recipient via SECURITY DEFINER RPC,
 * then sends an email if the recipient's notification preferences allow it.
 *
 * Must be called with a server-side Supabase client that has the actor's session.
 */
export async function notifyUser(
  supabase: SupabaseClient,
  params: NotifyParams
): Promise<void> {
  const { recipientId, recipientEmail, type, title, body, dealId, listingId } =
    params;

  // 1. Insert in-app notification (cross-user write via SECURITY DEFINER RPC)
  const { error: notifError } = await supabase.rpc("create_notification", {
    p_user_id: recipientId,
    p_type: type,
    p_title: title,
    p_body: body,
    p_deal_id: dealId ?? null,
    p_listing_id: listingId ?? null,
  });

  if (notifError) {
    console.error("[notifyUser] create_notification RPC error:", notifError);
  }

  // 2. Check email preferences before sending
  const { data: prefs } = await supabase.rpc("get_notification_prefs", {
    p_user_id: recipientId,
  });

  // If no prefs row exists, default to sending (opt-out model)
  const prefKey = `email_${type}` as keyof typeof prefs;
  const shouldEmail = prefs == null || prefs[prefKey] !== false;

  if (shouldEmail) {
    await sendNotificationEmail({
      to: recipientEmail,
      type,
      title,
      body,
      dealId,
    });
  }

  // 3. Fire-and-forget push notification (non-blocking)
  sendPushToUser(recipientId, { title, body, type }).catch(() => {
    // Push is best-effort — errors are handled inside sendPushToUser
  });
}
