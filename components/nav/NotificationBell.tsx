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
  const panelRef = useRef<HTMLDivElement>(null);
  const esRef = useRef<EventSource | null>(null);

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

  const markAllRead = useCallback(async () => {
    await fetch("/api/notifications", { method: "POST" });
    setNotifications([]);
  }, []);

  const markOneRead = useCallback(async (id: string) => {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const unreadCount = notifications.length;

  return (
    <div ref={panelRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
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
        <div className="absolute right-0 mt-2 w-80 rounded-xl border border-overlay/[0.08] bg-deep-teal shadow-card-elevated overflow-hidden z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-overlay/[0.06]">
            <span className="text-sm font-medium text-foreground">Notifications</span>
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
              notifications.map((n) => {
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
                        onClick={() => markOneRead(n.id)}
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
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
