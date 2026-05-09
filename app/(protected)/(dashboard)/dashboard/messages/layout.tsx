import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserThreads } from "@/utils/query/messages";
import { MessagesShell } from "@/components/messages/MessagesShell";

export default async function MessagesLayout({
  children,
}: {
  children: ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const threads = await getUserThreads(supabase);

  const ids = Array.from(new Set(threads.map((t) => t.counterpart_id)));
  const { data: profiles } = ids.length
    ? await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", ids)
    : { data: [] as { id: string; full_name: string | null }[] };

  const nameMap = new Map(
    (profiles ?? []).map((p) => [p.id, p.full_name]),
  );
  const enriched = threads.map((t) => ({
    ...t,
    counterpart_name: nameMap.get(t.counterpart_id) ?? null,
  }));

  return (
    <div className="flex flex-col gap-4">
      {/* Page header */}
      <div>
        <h1 className="font-display text-xl md:text-3xl font-bold text-foreground mb-1">
          Messages
        </h1>
        <p className="hidden md:block text-sm text-shade-50">
          Chat with buyers, sellers, and tutors about your active deals and
          requests.
        </p>
      </div>

      <MessagesShell initialThreads={enriched} currentUserId={user.id}>
        {children}
      </MessagesShell>
    </div>
  );
}
