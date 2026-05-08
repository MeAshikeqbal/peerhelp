import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserThreads } from "@/utils/query/messages";
import { MessageThreadList } from "@/components/messages/MessageThreadList";

export default async function MessagesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const threads = await getUserThreads(supabase);

  // Resolve counterpart names.
  const counterpartIds = Array.from(new Set(threads.map((t) => t.counterpart_id)));
  const profiles = counterpartIds.length
    ? await supabase.from("profiles").select("id, full_name").in("id", counterpartIds)
    : { data: [] as { id: string; full_name: string | null }[] };
  const nameMap = new Map((profiles.data ?? []).map((p) => [p.id, p.full_name]));

  const enriched = threads.map((t) => ({
    ...t,
    counterpart_name: nameMap.get(t.counterpart_id) ?? null,
  }));

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-[28px] font-[330]">Messages</h1>
        <p className="text-sm text-shade-50 mt-1">
          Chat with buyers, sellers, and tutors about your active deals and requests.
        </p>
      </div>
      <MessageThreadList initial={enriched} currentUserId={user.id} />
    </div>
  );
}
