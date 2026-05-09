"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageSquare, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { UserThreadRow } from "@/utils/query/messages";

interface ThreadItem extends UserThreadRow {
  counterpart_name: string | null;
}

interface MessagesShellProps {
  initialThreads: ThreadItem[];
  currentUserId: string;
  children: React.ReactNode;
}

const dateFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
});

export function MessagesShell({
  initialThreads,
  currentUserId,
  children,
}: MessagesShellProps) {
  const [threads, setThreads] = useState<ThreadItem[]>(initialThreads);
  const [search, setSearch] = useState("");
  const pathname = usePathname();
  const supabase = useMemo(() => createClient(), []);
  const channelRef = useRef<ReturnType<
    ReturnType<typeof createClient>["channel"]
  > | null>(null);
  // Keep a stable name map so realtime updates can preserve display names.
  const nameMapRef = useRef<Map<string, string | null>>(
    new Map(initialThreads.map((t) => [t.thread_id, t.counterpart_name])),
  );

  // Extract active threadId from pathname /dashboard/messages/<id>
  const activeThreadId = useMemo(() => {
    const m = pathname.match(/\/dashboard\/messages\/([^/]+)/);
    return m?.[1] ?? null;
  }, [pathname]);

  const isThreadActive = Boolean(activeThreadId);

  // Refresh list on window focus.
  const refresh = useCallback(() => {
    void fetch("/api/messages/threads")
      .then((r) => r.json())
      .then((j: { threads?: UserThreadRow[] }) => {
        if (!Array.isArray(j?.threads)) return;
        setThreads(
          j.threads.map((t) => ({
            ...t,
            counterpart_name: nameMapRef.current.get(t.thread_id) ?? null,
          })),
        );
      });
  }, []);

  useEffect(() => {
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, [refresh]);

  // Realtime: bump sidebar row when the current user receives a message.
  useEffect(() => {
    if (!currentUserId) return;
    const channel = supabase.channel("sidebar-realtime", {
      config: { broadcast: { self: false } },
    });
    channelRef.current = channel;

    channel
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `recipient_id=eq.${currentUserId}`,
        },
        (payload) => {
          const msg = payload.new as {
            thread_id: string;
            body: string;
            created_at: string;
            sender_id: string;
          };
          setThreads((prev) => {
            const existing = prev.find((t) => t.thread_id === msg.thread_id);
            if (!existing) return prev;
            const isActive = msg.thread_id === activeThreadId;
            const updated: ThreadItem = {
              ...existing,
              last_message_at: msg.created_at,
              last_message_body: msg.body,
              last_message_sender: msg.sender_id,
              unread_count: isActive ? 0 : existing.unread_count + 1,
            };
            return [
              updated,
              ...prev.filter((t) => t.thread_id !== msg.thread_id),
            ];
          });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [supabase, currentUserId, activeThreadId]);

  // When navigating to a thread, clear its unread badge locally.
  useEffect(() => {
    if (!activeThreadId) return;
    setThreads((prev) =>
      prev.map((t) =>
        t.thread_id === activeThreadId ? { ...t, unread_count: 0 } : t,
      ),
    );
  }, [activeThreadId]);

  const filtered = useMemo(() => {
    if (!search.trim()) return threads;
    const q = search.toLowerCase();
    return threads.filter((t) =>
      (t.counterpart_name ?? "").toLowerCase().includes(q),
    );
  }, [threads, search]);

  return (
    <div className="flex overflow-hidden rounded-2xl border border-overlay/10 h-[calc(100svh-12rem)] md:h-[calc(100svh-13rem)]">
      {/* ─── Sidebar ─────────────────────────────────────────── */}
      <div
        className={`flex flex-col border-r border-overlay/10 bg-overlay/[0.02] flex-shrink-0 w-full md:w-72 lg:w-80 ${
          isThreadActive ? "hidden md:flex" : "flex"
        }`}
      >
        {/* Sidebar header */}
        <div className="px-4 py-3 border-b border-overlay/10 bg-overlay/[0.03] shrink-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-shade-50 mb-2">
            Conversations
          </p>
          <div className="relative">
            <Search
              size={12}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-shade-50 pointer-events-none"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search…"
              className="w-full rounded-lg border border-overlay/10 bg-overlay/[0.04] pl-7 pr-3 py-1.5 text-xs text-foreground placeholder:text-shade-50 focus:border-neon-green/40 focus:outline-none transition-colors"
            />
          </div>
        </div>

        {/* Thread list */}
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 px-4 text-center">
              <MessageSquare
                className="mb-2 h-8 w-8 text-shade-50/30"
                strokeWidth={1.25}
              />
              <p className="text-sm font-medium text-foreground">
                {search ? "No results" : "No conversations yet"}
              </p>
              <p className="mt-1 text-xs text-shade-50 max-w-[180px]">
                {search
                  ? "Try a different name."
                  : "Open a deal or tutor request to start chatting."}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-overlay/[0.07]">
              {filtered.map((t) => {
                const isActive = t.thread_id === activeThreadId;
                const isMine = t.last_message_sender === currentUserId;
                const preview = t.last_message_body
                  ? `${isMine ? "You: " : ""}${t.last_message_body}`
                  : "Start the conversation";
                return (
                  <li key={t.thread_id}>
                    <Link
                      href={`/dashboard/messages/${t.thread_id}`}
                      className={`flex items-start gap-3 px-3 py-3 transition-colors relative ${
                        isActive
                          ? "bg-neon-green/[0.07]"
                          : "hover:bg-overlay/[0.04]"
                      }`}
                    >
                      {/* Active indicator bar */}
                      {isActive && (
                        <span className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full bg-neon-green" />
                      )}

                      {/* Avatar */}
                      <div
                        className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold shrink-0 mt-0.5 ${
                          isActive
                            ? "bg-neon-green/20 text-neon-green"
                            : "bg-neon-green/10 text-neon-green"
                        }`}
                      >
                        {(t.counterpart_name ?? "?").slice(0, 1).toUpperCase()}
                      </div>

                      {/* Text content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between gap-1">
                          <p
                            className={`text-sm truncate ${
                              isActive || t.unread_count > 0
                                ? "font-semibold text-foreground"
                                : "font-medium text-foreground"
                            }`}
                          >
                            {t.counterpart_name ?? "Unknown"}
                          </p>
                          {t.last_message_at && (
                            <span className="text-[10px] text-shade-50 tabular-nums shrink-0">
                              {dateFormatter.format(
                                new Date(t.last_message_at),
                              )}
                            </span>
                          )}
                        </div>
                        <p
                          className={`text-xs truncate mt-0.5 ${
                            t.unread_count > 0 && !isActive
                              ? "text-foreground font-medium"
                              : "text-shade-50"
                          }`}
                        >
                          {preview}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[9px] uppercase tracking-wider text-shade-50/50">
                            {t.context_type === "deal" ? "Deal" : "Tutor"}
                          </span>
                          {t.is_blocked && (
                            <span className="text-[9px] uppercase tracking-wider text-red-400">
                              · Blocked
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Unread badge */}
                      {t.unread_count > 0 && !isActive && (
                        <span className="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-neon-green/20 text-neon-green text-[10px] font-semibold px-1 shrink-0 mt-1">
                          {t.unread_count > 99 ? "99+" : t.unread_count}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* ─── Right pane ──────────────────────────────────────── */}
      <div
        className={`flex-1 flex flex-col overflow-hidden ${
          isThreadActive ? "flex" : "hidden md:flex"
        }`}
      >
        {children}
      </div>
    </div>
  );
}
