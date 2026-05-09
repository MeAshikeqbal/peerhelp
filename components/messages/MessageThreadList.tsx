"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { MessageSquare } from "lucide-react";
import type { UserThreadRow } from "@/utils/query/messages";
import { UserAvatar } from "@/components/ui/user-avatar";

interface ThreadListItemDisplay extends UserThreadRow {
  counterpart_name: string | null;
}

interface MessageThreadListProps {
  initial: ThreadListItemDisplay[];
  currentUserId: string;
}

export function MessageThreadList({ initial, currentUserId }: MessageThreadListProps) {
  const [threads, setThreads] = useState(initial);

  // Refresh on focus so unread counts stay accurate.
  useEffect(() => {
    function refresh() {
      void fetch("/api/messages/threads")
        .then((r) => r.json())
        .then((j) => {
          if (!Array.isArray(j?.threads)) return;
          // Server-side returns without name; preserve names from current state.
          const nameMap = new Map(threads.map((t) => [t.thread_id, t.counterpart_name]));
          setThreads(
            j.threads.map((t: UserThreadRow) => ({
              ...t,
              counterpart_name: nameMap.get(t.thread_id) ?? null,
            })),
          );
        });
    }
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, [threads]);

  if (threads.length === 0) {
    return (
      <div className="rounded-2xl border border-overlay/10 bg-overlay/[0.02] py-16 text-center">
        <MessageSquare className="mx-auto mb-3 h-8 w-8 text-shade-50/40" strokeWidth={1.25} />
        <p className="text-base font-medium text-foreground">No conversations yet</p>
        <p className="mt-1 text-sm text-shade-50">
          Open a deal or tutor request to start chatting.
        </p>
      </div>
    );
  }

  return (
    <ul className="overflow-hidden rounded-2xl border border-overlay/10 divide-y divide-overlay/10">
      {threads.map((t) => {
        const isMine = t.last_message_sender === currentUserId;
        const preview = t.last_message_body
          ? `${isMine ? "You: " : ""}${t.last_message_body}`
          : "Tap to start the conversation";
        return (
          <li key={t.thread_id}>
            <Link
              href={`/dashboard/messages/${t.thread_id}`}
              className="flex items-center gap-3 px-4 py-3 hover:bg-overlay/5 transition-colors"
            >
              <UserAvatar
                size="md"
                name={t.counterpart_name}
                className="shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-sm font-medium text-foreground truncate">
                    {t.counterpart_name ?? "Unknown user"}
                  </p>
                  {t.last_message_at && (
                    <span className="text-[10px] text-shade-50 tabular-nums shrink-0">
                      {new Date(t.last_message_at).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                      })}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <p
                    className={`text-xs truncate flex-1 ${
                      t.unread_count > 0 ? "text-foreground font-medium" : "text-shade-50"
                    }`}
                  >
                    {preview}
                  </p>
                  {t.unread_count > 0 && (
                    <span className="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-neon-green/20 text-neon-green text-[10px] font-semibold px-1.5 shrink-0">
                      {t.unread_count > 99 ? "99+" : t.unread_count}
                    </span>
                  )}
                  {t.is_blocked && (
                    <span className="text-[9px] uppercase tracking-wider text-red-400 shrink-0">
                      Blocked
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-[10px] uppercase tracking-wider text-shade-50/70">
                  {t.context_type === "deal" ? "Deal" : "Tutor request"}
                </p>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
