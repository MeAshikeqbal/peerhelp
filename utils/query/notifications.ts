import type { DB } from "./_db";

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string;
  deal_id: string | null;
  listing_id: string | null;
  read_at: string | null;
  created_at: string;
}

export interface NotificationPreferences {
  user_id: string;
  email_deal_requested: boolean;
  email_deal_accepted: boolean;
  email_deal_declined: boolean;
  email_deal_cancelled: boolean;
  email_deal_completed: boolean;
  email_rating_received: boolean;
  email_tutor_request_received: boolean;
  email_tutor_request_responded: boolean;
  email_message_received: boolean;
  updated_at: string;
}

export async function getUnreadNotifications(
  supabase: DB
): Promise<Notification[]> {
  const { data, error } = await supabase.rpc("get_unread_notifications");
  if (error) {
    console.error("[getUnreadNotifications]", error);
    return [];
  }
  return (data as Notification[]) ?? [];
}

export async function getAllNotifications(
  supabase: DB
): Promise<Notification[]> {
  const { data, error } = await supabase.rpc("get_all_notifications");
  if (error) {
    console.error("[getAllNotifications]", error);
    return [];
  }
  return (data as Notification[]) ?? [];
}

export async function markAllNotificationsRead(
  supabase: DB
): Promise<void> {
  const { error } = await supabase.rpc("mark_notifications_read");
  if (error) console.error("[markAllNotificationsRead]", error);
}

export async function markNotificationRead(
  supabase: DB,
  notificationId: string
): Promise<void> {
  const { error } = await supabase.rpc("mark_notification_read", {
    p_notification_id: notificationId,
  });
  if (error) console.error("[markNotificationRead]", error);
}

export async function getNotificationPrefs(
  supabase: DB,
  userId: string
): Promise<NotificationPreferences | null> {
  const { data, error } = await supabase.rpc("get_notification_prefs", {
    p_user_id: userId,
  });
  if (error) {
    console.error("[getNotificationPrefs]", error);
    return null;
  }
  return data as NotificationPreferences | null;
}

export async function upsertNotificationPrefs(
  supabase: DB,
  prefs: Partial<Omit<NotificationPreferences, "user_id" | "updated_at">>
): Promise<{ error: unknown | null }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: new Error("Not authenticated") };

  const { error } = await supabase
    .from("notification_preferences")
    .upsert({ user_id: user.id, ...prefs, updated_at: new Date().toISOString() });

  if (error) console.error("[upsertNotificationPrefs]", error);
  return { error };
}
