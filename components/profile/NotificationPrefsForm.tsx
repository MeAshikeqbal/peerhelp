"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { upsertNotificationPrefs, type NotificationPreferences } from "@/utils/query/notifications";

type PrefKey = keyof Omit<NotificationPreferences, "user_id" | "updated_at">;

const PREFS: { key: PrefKey; label: string; description: string }[] = [
  {
    key: "email_deal_requested",
    label: "Deal requested",
    description: "When a buyer requests to buy your listing",
  },
  {
    key: "email_deal_accepted",
    label: "Deal accepted",
    description: "When a seller accepts your deal request",
  },
  {
    key: "email_deal_declined",
    label: "Deal declined",
    description: "When a seller declines your deal request",
  },
  {
    key: "email_deal_cancelled",
    label: "Deal cancelled",
    description: "When a deal you're involved in is cancelled",
  },
  {
    key: "email_deal_completed",
    label: "Deal completed",
    description: "When a deal is marked as complete",
  },
  {
    key: "email_rating_received",
    label: "Rating received",
    description: "When someone leaves you a rating",
  },
  {
    key: "email_tutor_request_received",
    label: "Tutor request received",
    description: "When a learner requests a tutoring session from you",
  },
  {
    key: "email_tutor_request_responded",
    label: "Tutor request response",
    description: "When your tutor request is accepted, declined, or completed",
  },
];

interface NotificationPrefsFormProps {
  initialPrefs: Partial<NotificationPreferences> | null;
}

export function NotificationPrefsForm({ initialPrefs }: NotificationPrefsFormProps) {
  const [prefs, setPrefs] = useState<Record<PrefKey, boolean>>({
    email_deal_requested: initialPrefs?.email_deal_requested ?? true,
    email_deal_accepted: initialPrefs?.email_deal_accepted ?? true,
    email_deal_declined: initialPrefs?.email_deal_declined ?? true,
    email_deal_cancelled: initialPrefs?.email_deal_cancelled ?? true,
    email_deal_completed: initialPrefs?.email_deal_completed ?? true,
    email_rating_received: initialPrefs?.email_rating_received ?? true,
    email_tutor_request_received:
      initialPrefs?.email_tutor_request_received ?? true,
    email_tutor_request_responded:
      initialPrefs?.email_tutor_request_responded ?? true,
  });
  const [saving, setSaving] = useState<PrefKey | null>(null);

  async function toggle(key: PrefKey) {
    const previous = prefs[key];
    const next = !previous;
    setPrefs((prev) => ({ ...prev, [key]: next }));
    setSaving(key);
    try {
      const supabase = createClient();
      const { error } = await upsertNotificationPrefs(supabase, { [key]: next });
      if (error) throw error;
    } catch (err) {
      console.error("Failed to save notification preference:", err);
      setPrefs((prev) => ({ ...prev, [key]: previous }));
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="divide-y divide-white/[0.05]">
      {PREFS.map(({ key, label, description }) => (
        <div key={key} className="flex items-center justify-between gap-4 px-6 py-4">
          <div className="min-w-0">
            <p className="text-sm text-foreground">{label}</p>
            <p className="text-xs text-shade-50 mt-0.5">{description}</p>
          </div>
          <button
            role="switch"
            aria-checked={prefs[key]}
            aria-label={`Toggle email for ${label}`}
            disabled={saving === key}
            onClick={() => toggle(key)}
            className={[
              "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-green/50",
              prefs[key]
                ? "bg-neon-green/80"
                : "bg-overlay/20 border border-overlay/30",
              saving === key ? "opacity-50 cursor-wait" : "cursor-pointer",
            ].join(" ")}
          >
            <span
              className={[
                "inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform",
                prefs[key] ? "translate-x-4" : "translate-x-1",
              ].join(" ")}
            />
          </button>
        </div>
      ))}
    </div>
  );
}
