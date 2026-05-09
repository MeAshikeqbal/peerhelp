"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Bell } from "lucide-react";
import Link from "next/link";
import type { Notification } from "@/utils/query/notifications";

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

const TYPE_ICON: Record<string, string> = {
  deal_requested: "📥",
  deal_accepted: "✅",
  deal_declined: "❌",
  deal_cancelled: "🚫",
  deal_completed: "🎉",
  rating_received: "⭐",
};

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [displayLimit, setDisplayLimit] = useState(20);
  const [pendingDismisses, setPendingDismisses] = useState<Record<string, ReturnType<typeof setTimeout>>>({});
  const [lastRemoved, setLastRemoved] = useState<Notification | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const esRef = useRef<EventSource | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Connect to SSE stream
  useEffect(() => {
    const es = new EventSource("/api/notifications/stream");
    esRef.current = es;

    es.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as {
          notifications: Notification[];
        };
        setNotifications(payload.notifications);
      } catch {
        // ignore parse errors
      }
    };

    es.onerror = () => {
      // EventSource auto-reconnects; no action needed
    };

    return () => {
      es.close();
    };
  }, []);

  // Close panel on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Infinite scroll: increase display limit when sentinel visible
  useEffect(() => {
    if (!sentinelRef.current) return;
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setDisplayLimit((v) => Math.min(v + 20, notifications.length));
        }
      });
    }, { root: panelRef.current, rootMargin: '200px' });

    obs.observe(sentinelRef.current);
    return () => obs.disconnect();
  }, [notifications.length]);

  const markAllRead = useCallback(async () => {
    const ok = window.confirm("Mark all notifications as read?");
    if (!ok) return;
    // Optimistically clear UI
    const prev = notifications;
    setNotifications([]);
    try {
      await fetch("/api/notifications", { method: "POST" });
    } catch (err) {
      // rollback on error
      setNotifications(prev);
    }
  }, []);

  // Mark a single notification as read. If `immediate` is false, delay server call
  // to allow an undo window.
  const markOneRead = useCallback(async (id: string, immediate = false) => {
    const toRemove = notifications.find((n) => n.id === id);
    if (!toRemove) return;

    // remove from UI immediately
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    setLastRemoved(toRemove);

    if (immediate) {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      return;
    }

    // schedule server call after undo window
    const timer = setTimeout(async () => {
      try {
        await fetch("/api/notifications", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
        });
      } catch {
        // ignore network errors for now
      }
      setPendingDismisses((prev) => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });
      setLastRemoved(null);
    }, 4000);

    setPendingDismisses((prev) => ({ ...prev, [id]: timer }));
  }, [notifications]);

  const undoLast = useCallback(() => {
    if (!lastRemoved) return;
    const id = lastRemoved.id;
    // cancel pending timer if any
    const t = pendingDismisses[id];
    if (t) clearTimeout(t);
    setPendingDismisses((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
    setNotifications((prev) => [lastRemoved!, ...prev]);
    setLastRemoved(null);
  }, [lastRemoved, pendingDismisses]);

  const unreadCount = notifications.length;

  return (
    <div ref={panelRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
        aria-expanded={open}
        className="relative p-2 rounded-md text-shade-50 hover:text-foreground hover:bg-overlay/5 transition-colors"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-neon-green text-[9px] font-bold text-forest px-0.5">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-96 rounded-xl border border-overlay/[0.08] bg-deep-teal shadow-card-elevated overflow-hidden z-50 transform transition-all origin-top-right animate-notif-enter">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-overlay/[0.06]">
            <div className="flex items-center gap-2">
              <Bell size={16} />
              <span className="text-sm font-medium text-foreground">Notifications</span>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-neon-green hover:text-neon-green/80 transition-colors"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[360px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-shade-50">
                No new notifications
              </div>
            ) : (
              <>
                {notifications.slice(0, displayLimit).map((n) => {
                  const href =
                    n.deal_id
                      ? "/dashboard/deals"
                      : n.listing_id
                      ? `/dashboard/listings/${n.listing_id}`
                      : "/dashboard";

                  return (
                    <div
                      key={n.id}
                      className="group flex items-start gap-3 px-4 py-3 hover:bg-overlay/[0.04] border-b border-overlay/[0.04] last:border-0 transition-colors"
                    >
                      <span className="mt-0.5 text-base shrink-0">
                        {TYPE_ICON[n.type] ?? "🔔"}
                      </span>
                      <div className="flex-1 min-w-0">
                        <Link
                          href={href}
                          onClick={() => markOneRead(n.id, true)}
                          className="block"
                        >
                          <p className="text-sm font-medium text-foreground leading-snug">
                            {n.title}
                          </p>
                          <p className="text-xs text-shade-50 mt-0.5 line-clamp-2">
                            {n.body}
                          </p>
                          <p className="text-[10px] text-shade-70 mt-1">
                            {relativeTime(n.created_at)}
                          </p>
                        </Link>
                      </div>
                      <button
                        onClick={() => markOneRead(n.id)}
                        className="shrink-0 p-1 rounded text-shade-70 hover:text-shade-50 transition-colors opacity-0 group-hover:opacity-100"
                        aria-label="Dismiss"
                      >
                        ×
                      </button>
                    </div>
                  );
                })}

                {/* sentinel for loading more */}
                <div ref={sentinelRef} className="h-2" />
              </>
            )}
          </div>

          {/* Undo toast */}
          {lastRemoved && (
            <div className="px-4 py-3 border-t border-overlay/[0.06] bg-overlay/5 flex items-center justify-between">
              <span className="text-sm text-shade-50">Notification dismissed</span>
              <div className="flex items-center gap-2">
                <button onClick={undoLast} className="text-xs text-neon-green">Undo</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
