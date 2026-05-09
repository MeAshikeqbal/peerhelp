import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getThreadById,
  getThreadMessages,
  getMyReadCursor,
  getCounterpartReadCursor,
} from "@/utils/query/messages";
import { isBlockedByMe } from "@/utils/query/blocks";
import { MessageThread } from "@/components/messages/MessageThread";

export default async function ThreadPage({
  params,
}: {
  params: Promise<{ threadId: string }>;
}) {
  const { threadId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: thread } = await getThreadById(supabase, threadId);
  if (!thread) notFound();

  const isParticipant =
    thread.participant_a === user.id || thread.participant_b === user.id;
  if (!isParticipant) notFound();

  const counterpartId =
    thread.participant_a === user.id ? thread.participant_b : thread.participant_a;

  const [{ data: msgsDesc }, { data: profile }, { data: myCursor }, { data: theirCursor }, blocked] =
    await Promise.all([
      getThreadMessages(supabase, threadId, { limit: 50 }),
      supabase.from("profiles").select("full_name, avatar_url").eq("id", counterpartId).maybeSingle(),
      getMyReadCursor(supabase, threadId, user.id),
      getCounterpartReadCursor(supabase, threadId, counterpartId),
      isBlockedByMe(supabase, counterpartId),
    ]);

  const messages = (msgsDesc ?? []).slice().reverse();
  const counterpartName = profile?.full_name ?? "Unknown user";
  const counterpartAvatarUrl = profile?.avatar_url ?? null;

  const contextType = thread.context_type as "deal" | "tutor_request";
  const contextHref =
    contextType === "deal" ? "/dashboard/deals" : "/dashboard/tutoring/requests";

  return (
    <MessageThread
      threadId={threadId}
      currentUserId={user.id}
      counterpartId={counterpartId}
      counterpartName={counterpartName}
      counterpartAvatarUrl={counterpartAvatarUrl}
      initialMessages={messages}
      initialMyReadAt={myCursor?.last_read_at ?? null}
      initialTheirReadAt={theirCursor?.last_read_at ?? null}
      isBlockedByMe={blocked}
      contextType={contextType}
      contextId={thread.context_id}
      contextHref={contextHref}
    />
  );
}
