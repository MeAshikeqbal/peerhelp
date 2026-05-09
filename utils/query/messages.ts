import type { DB } from "./_db";
import type { Tables } from "@/lib/supabase/database.types";

export type MessageThread = Tables<"message_threads">;
export type Message = Tables<"messages">;
export type MessageRead = Tables<"message_reads">;
export type MessageReport = Tables<"message_reports">;

export type MessageContextType = "deal" | "tutor_request";

export interface UserThreadRow {
  thread_id: string;
  context_type: MessageContextType;
  context_id: string;
  counterpart_id: string;
  last_message_at: string | null;
  last_message_body: string | null;
  last_message_sender: string | null;
  unread_count: number;
  is_blocked: boolean;
}

export async function startOrGetThread(
  supabase: DB,
  contextType: MessageContextType,
  contextId: string,
) {
  return supabase.rpc("start_or_get_thread", {
    p_context_type: contextType,
    p_context_id: contextId,
  });
}

export async function sendMessage(supabase: DB, threadId: string, body: string) {
  return supabase.rpc("send_message", {
    p_thread_id: threadId,
    p_body: body,
  });
}

export async function markThreadRead(supabase: DB, threadId: string) {
  return supabase.rpc("mark_thread_read", { p_thread_id: threadId });
}

export async function getUserThreads(supabase: DB) {
  const { data, error } = await supabase.rpc("get_user_threads");
  if (error) {
    console.error("[getUserThreads]", error);
    return [];
  }
  return (data as unknown as UserThreadRow[]) ?? [];
}

export async function getThreadById(supabase: DB, threadId: string) {
  return supabase
    .from("message_threads")
    .select("*")
    .eq("id", threadId)
    .maybeSingle();
}

export async function getThreadMessages(
  supabase: DB,
  threadId: string,
  opts?: { limit?: number; before?: string },
) {
  let q = supabase
    .from("messages")
    .select("*")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: false })
    .limit(opts?.limit ?? 50);
  if (opts?.before) q = q.lt("created_at", opts.before);
  return q;
}

export async function getMyReadCursor(supabase: DB, threadId: string, userId: string) {
  return supabase
    .from("message_reads")
    .select("last_read_at")
    .eq("thread_id", threadId)
    .eq("user_id", userId)
    .maybeSingle();
}

export async function getCounterpartReadCursor(
  supabase: DB,
  threadId: string,
  counterpartId: string,
) {
  return supabase
    .from("message_reads")
    .select("last_read_at")
    .eq("thread_id", threadId)
    .eq("user_id", counterpartId)
    .maybeSingle();
}

export async function reportMessage(
  supabase: DB,
  threadId: string,
  messageId: string | null,
  reason: string,
) {
  return supabase.rpc("report_message", {
    p_thread_id: threadId,
    // RPC accepts null though generated types expect string.
    p_message_id: (messageId ?? null) as unknown as string,
    p_reason: reason,
  });
}

export async function adminGetThreadMessages(supabase: DB, threadId: string) {
  return supabase.rpc("admin_get_thread_messages", { p_thread_id: threadId });
}

/** Total unread count across all threads (for nav badge). */
export async function getUnreadMessagesCount(supabase: DB): Promise<number> {
  const threads = await getUserThreads(supabase);
  return threads.reduce((sum, t) => sum + (t.unread_count ?? 0), 0);
}
