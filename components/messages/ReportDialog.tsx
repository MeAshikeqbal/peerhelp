"use client";

import { useState } from "react";

interface ReportDialogProps {
  threadId: string;
  messageId?: string | null;
  onClose: () => void;
  onSubmitted?: () => void;
}

export function ReportDialog({ threadId, messageId, onClose, onSubmitted }: ReportDialogProps) {
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = reason.trim();
    if (!trimmed) {
      setError("Please describe what's wrong.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const r = await fetch(`/api/messages/${threadId}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message_id: messageId ?? null, reason: trimmed }),
      });
      const j = await r.json();
      if (!r.ok) {
        setError(j?.message ?? "Failed to submit");
        return;
      }
      onSubmitted?.();
    } catch {
      setError("Network error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        className="w-full max-w-md rounded-2xl border border-overlay/10 bg-deep-teal p-5 space-y-4"
      >
        <div>
          <h2 className="text-base font-medium">Report user</h2>
          <p className="text-xs text-shade-50 mt-1">
            Tell us what happened. Admins will review the conversation.
          </p>
        </div>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="What's wrong?"
          maxLength={1000}
          rows={5}
          className="w-full rounded-lg border border-overlay/15 bg-overlay/[0.04] px-3 py-2 text-sm focus:border-neon-green/40 focus:outline-none resize-none"
        />
        {error && <p className="text-xs text-red-400">{error}</p>}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-overlay/15 px-3 py-1.5 text-xs text-shade-30 hover:text-foreground"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-red-500/15 border border-red-500/30 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/20 disabled:opacity-50"
          >
            {submitting ? "Submitting…" : "Submit report"}
          </button>
        </div>
      </form>
    </div>
  );
}
