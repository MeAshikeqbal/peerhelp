"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, MoreVertical, Flag, Ban, RotateCw } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/supabase/database.types";
import { ReportDialog } from "@/components/messages/ReportDialog";

type MessageRow = Tables<"messages">;

interface MessageThreadProps {
  threadId: string;
  currentUserId: string;
  counterpartId: string;
  counterpartName: string;
  initialMessages: MessageRow[];
  initialMyReadAt: string | null;
  initialTheirReadAt: string | null;
  isBlockedByMe: boolean;
  contextType: "deal" | "tutor_request";
  contextHref?: string | null;
}

const TYPING_TIMEOUT_MS = 3500;

export function MessageThread(props: MessageThreadProps) {
  const {
    threadId,
    currentUserId,
    counterpartId,
    counterpartName,
    initialMessages,
    initialMyReadAt,
    initialTheirReadAt,
    isBlockedByMe: initialBlocked,
    contextType,
    contextHref,
  } = props;

  const router = useRouter();
  const [messages, setMessages] = useState<MessageRow[]>(
    [...initialMessages].sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    ),
  );
  const [theirReadAt, setTheirReadAt] = useState<string | null>(initialTheirReadAt);
  const [counterpartTyping, setCounterpartTyping] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [blocked, setBlocked] = useState(initialBlocked);

  const listRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTypingSentRef = useRef<number>(0);
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>["channel"]> | null>(null);
  // Track last_read_at locally for "their" cursor in case Realtime payload lags.
  void initialMyReadAt;

  const supabase = useMemo(() => createClient(), []);

  // Auto-scroll to bottom on new messages.
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages.length]);

  // Mark thread as read on mount + whenever new incoming messages land.
  const markRead = useCallback(async () => {
    try {
      await fetch(`/api/messages/${threadId}/read`, { method: "POST" });
    } catch {
      // ignore
    }
  }, [threadId]);

  useEffect(() => {
    void markRead();
  }, [markRead, messages.length]);

  // Realtime subscription.
  useEffect(() => {
    const channel = supabase.channel(`thread:${threadId}`, {
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
          filter: `thread_id=eq.${threadId}`,
        },
        (payload) => {
          const msg = payload.new as MessageRow;
          setMessages((prev) => {
            if (prev.some((m) => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
          if (msg.sender_id === counterpartId) {
            setCounterpartTyping(false);
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "message_reads",
          filter: `thread_id=eq.${threadId}`,
        },
        (payload) => {
          const row = payload.new as { user_id?: string; last_read_at?: string };
          if (row?.user_id === counterpartId && row.last_read_at) {
            setTheirReadAt(row.last_read_at);
          }
        },
      )
      .on("broadcast", { event: "typing" }, (payload) => {
        const data = payload.payload as { user_id?: string };
        if (data?.user_id === counterpartId) {
          setCounterpartTyping(true);
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(
            () => setCounterpartTyping(false),
            TYPING_TIMEOUT_MS,
          );
        }
      })
      .subscribe();

    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      void supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [supabase, threadId, counterpartId]);

  function broadcastTyping() {
    const now = Date.now();
    if (now - lastTypingSentRef.current < 1500) return;
    lastTypingSentRef.current = now;
    channelRef.current?.send({
      type: "broadcast",
      event: "typing",
      payload: { user_id: currentUserId },
    });
  }

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    setError(null);
    try {
      const r = await fetch(`/api/messages/${threadId}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      const j = await r.json();
      if (!r.ok) {
        setError(j?.message ?? "Failed to send");
        return;
      }
      setDraft("");
      // Optimistic add (in case realtime is slow).
      if (j?.message?.id) {
        setMessages((prev) =>
          prev.some((m) => m.id === j.message.id) ? prev : [...prev, j.message],
        );
      }
    } catch {
      setError("Network error");
    } finally {
      setSending(false);
    }
  }

  async function blockCounterpart() {
    if (!confirm(`Block ${counterpartName}? They won't be able to message you.`)) return;
    const r = await fetch(`/api/users/${counterpartId}/block`, { method: "POST" });
    if (r.ok) {
      setBlocked(true);
      setMenuOpen(false);
    }
  }

  async function unblockCounterpart() {
    const r = await fetch(`/api/users/${counterpartId}/block`, { method: "DELETE" });
    if (r.ok) {
      setBlocked(false);
      setMenuOpen(false);
    }
  }

  // Determine "Read" indicator: latest of MY messages whose created_at <= theirReadAt.
  const lastReadByThem = useMemo(() => {
    if (!theirReadAt) return null;
    const ts = new Date(theirReadAt).getTime();
    let id: string | null = null;
    for (const m of messages) {
      if (m.sender_id === currentUserId && new Date(m.created_at).getTime() <= ts) {
        id = m.id;
      }
    }
    return id;
  }, [messages, theirReadAt, currentUserId]);

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] rounded-2xl border border-overlay/10 bg-overlay/[0.02] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 border-b border-overlay/10 px-4 py-3 bg-overlay/[0.03]">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/dashboard/messages"
            className="p-1.5 rounded-md text-shade-50 hover:text-foreground hover:bg-overlay/5 md:hidden"
            aria-label="Back"
          >
            <ArrowLeft size={16} />
          </Link>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-neon-green/10 text-neon-green text-sm font-semibold">
            {counterpartName.slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{counterpartName}</p>
            <p className="text-[10px] uppercase tracking-wider text-shade-50">
              {contextType === "deal" ? "Deal conversation" : "Tutor request"}
              {contextHref && (
                <>
                  {" · "}
                  <Link href={contextHref} className="text-neon-green hover:underline">
                    View context
                  </Link>
                </>
              )}
            </p>
          </div>
        </div>
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="p-1.5 rounded-md text-shade-50 hover:text-foreground hover:bg-overlay/5"
            aria-label="More"
          >
            <MoreVertical size={16} />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 w-44 rounded-lg border border-overlay/10 bg-deep-teal py-1 shadow-lg z-10">
              <button
                onClick={() => {
                  setReportOpen(true);
                  setMenuOpen(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-xs text-shade-30 hover:text-foreground hover:bg-overlay/5"
              >
                <Flag size={12} />
                Report user
              </button>
              {blocked ? (
                <button
                  onClick={unblockCounterpart}
                  className="flex w-full items-center gap-2 px-3 py-2 text-xs text-shade-30 hover:text-foreground hover:bg-overlay/5"
                >
                  <RotateCw size={12} />
                  Unblock
                </button>
              ) : (
                <button
                  onClick={blockCounterpart}
                  className="flex w-full items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10"
                >
                  <Ban size={12} />
                  Block
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
        {messages.length === 0 && (
          <p className="text-center text-xs text-shade-50 py-8">
            No messages yet. Say hello.
          </p>
        )}
        {messages.map((m, i) => {
          const mine = m.sender_id === currentUserId;
          const prev = messages[i - 1];
          const showTime =
            !prev ||
            new Date(m.created_at).getTime() -
              new Date(prev.created_at).getTime() >
              5 * 60 * 1000;
          const isLastReadByThem = mine && m.id === lastReadByThem;
          return (
            <div key={m.id}>
              {showTime && (
                <p className="text-center text-[10px] text-shade-50/70 my-2">
                  {new Date(m.created_at).toLocaleString("en-IN", {
                    day: "numeric",
                    month: "short",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </p>
              )}
              <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap break-words ${
                    mine
                      ? "bg-neon-green/15 text-foreground border border-neon-green/20"
                      : "bg-overlay/[0.06] text-foreground border border-overlay/10"
                  }`}
                >
                  {m.body}
                </div>
              </div>
              {isLastReadByThem && (
                <p className="text-right text-[10px] text-shade-50 mt-0.5 mr-1">
                  Read
                </p>
              )}
            </div>
          );
        })}
        {counterpartTyping && (
          <div className="flex justify-start">
            <div className="rounded-2xl bg-overlay/[0.06] border border-overlay/10 px-3 py-2 text-xs text-shade-50">
              <span className="inline-flex gap-0.5">
                <span className="animate-bounce">.</span>
                <span className="animate-bounce [animation-delay:120ms]">.</span>
                <span className="animate-bounce [animation-delay:240ms]">.</span>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Composer */}
      <form
        onSubmit={send}
        className="border-t border-overlay/10 bg-overlay/[0.03] px-3 py-3"
      >
        {error && (
          <p role="alert" className="mb-2 text-xs text-red-400">
            {error}
          </p>
        )}
        {blocked ? (
          <p className="text-center text-xs text-shade-50 py-2">
            You blocked this user.{" "}
            <button
              type="button"
              onClick={unblockCounterpart}
              className="text-neon-green hover:underline"
            >
              Unblock
            </button>
          </p>
        ) : (
          <div className="flex items-end gap-2">
            <textarea
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value);
                broadcastTyping();
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void send(e as unknown as React.FormEvent);
                }
              }}
              placeholder="Write a message…"
              rows={1}
              maxLength={2000}
              className="flex-1 resize-none rounded-lg border border-overlay/15 bg-overlay/[0.04] px-3 py-2 text-sm text-foreground placeholder:text-shade-50 focus:border-neon-green/40 focus:outline-none max-h-32"
            />
            <button
              type="submit"
              disabled={sending || draft.trim().length === 0}
              className="rounded-lg bg-neon-green/15 border border-neon-green/30 px-4 py-2 text-xs font-medium text-neon-green hover:bg-neon-green/20 disabled:opacity-50"
            >
              Send
            </button>
          </div>
        )}
      </form>

      {reportOpen && (
        <ReportDialog
          threadId={threadId}
          onClose={() => setReportOpen(false)}
          onSubmitted={() => {
            setReportOpen(false);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
