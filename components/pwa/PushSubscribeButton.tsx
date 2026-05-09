"use client";

import { useEffect, useState, useTransition } from "react";
import { Bell, BellOff, Loader2 } from "lucide-react";
import {
  isPushSupported,
  subscribeUserToPush,
  unsubscribeUserFromPush,
  getCurrentPushSubscription,
} from "@/lib/push/client";

export function PushSubscribeButton() {
  const [supported, setSupported] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!isPushSupported()) return;
    setSupported(true);
    setPermission(Notification.permission);
    getCurrentPushSubscription().then((sub) => setSubscribed(!!sub));
  }, []);

  if (!supported) return null;

  const handleToggle = () => {
    startTransition(async () => {
      try {
        if (subscribed) {
          await unsubscribeUserFromPush();
          setSubscribed(false);
          setPermission(Notification.permission);
        } else {
          await subscribeUserToPush();
          setSubscribed(true);
          setPermission("granted");
        }
      } catch (err) {
        setPermission(Notification.permission);
        console.error("[PushSubscribeButton]", err);
      }
    });
  };

  const isBlocked = permission === "denied";

  return (
    <div className="flex items-center justify-between px-6 py-4">
      <div className="flex items-center gap-4">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-overlay/5">
          {subscribed ? (
            <Bell size={14} className="text-neon-green" />
          ) : (
            <BellOff size={14} className="text-shade-50" />
          )}
        </div>
        <div className="min-w-0">
          <p className="text-sm text-foreground">
            {subscribed ? "Push notifications on" : "Push notifications off"}
          </p>
          {isBlocked ? (
            <p className="text-[11px] text-amber-400/80 mt-0.5">
              Blocked in browser — enable in site settings to subscribe
            </p>
          ) : (
            <p className="text-[11px] text-shade-50 mt-0.5">
              {subscribed
                ? "You'll receive push alerts on this device"
                : "Get alerts for deals, messages & more"}
            </p>
          )}
        </div>
      </div>

      <button
        onClick={handleToggle}
        disabled={isPending || isBlocked}
        className="ml-4 inline-flex items-center gap-1.5 rounded-lg border border-overlay/10 bg-overlay/5 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-overlay/20 hover:bg-overlay/10 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? (
          <Loader2 size={11} className="animate-spin" />
        ) : subscribed ? (
          <BellOff size={11} />
        ) : (
          <Bell size={11} />
        )}
        {isPending ? "Updating…" : subscribed ? "Unsubscribe" : "Subscribe"}
      </button>
    </div>
  );
}
