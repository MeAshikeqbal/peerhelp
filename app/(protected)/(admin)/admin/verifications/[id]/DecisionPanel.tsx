"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type Decision = "approve" | "reject" | "request-changes";

export function DecisionPanel({
  verificationId,
  status,
  hasDocument,
}: {
  verificationId: string;
  status: "pending" | "verified" | "rejected";
  hasDocument: boolean;
}) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState<Decision | null>(null);

  async function submit(decision: Decision) {
    setError(null);
    setActive(decision);
    const requireReason = decision !== "approve";
    if (requireReason && reason.trim().length === 0) {
      setError("Please add a reason.");
      setActive(null);
      return;
    }
    try {
      const res = await fetch(
        `/api/admin/verifications/${verificationId}/${decision}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason: reason.trim() || null }),
        },
      );
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.message ?? "Action failed");
      }
      startTransition(() => {
        router.refresh();
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setActive(null);
    }
  }

  const disabled = status !== "pending" || pending;
  // Approving or rejecting without an uploaded document doesn't make sense.
  // Request-changes stays available so reviewers can prompt the student.
  const decisionDisabled = disabled || !hasDocument;

  return (
    <div className="space-y-4 rounded-2xl border border-overlay/15 bg-overlay/5 p-5">
      <div>
        <h2 className="text-base font-medium">Decision</h2>
        <p className="text-xs text-shade-50">
          Reason is required for reject and request-changes; optional for
          approval.
        </p>
      </div>

      {!hasDocument && status === "pending" && (
        <p className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-200">
          No document uploaded. Approve and Reject are disabled until the
          student uploads an ID.
        </p>
      )}

      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Reason / note to the student"
        rows={3}
        disabled={disabled}
        className="w-full resize-y rounded-lg border border-overlay/15 bg-void/60 p-3 text-sm text-foreground placeholder:text-shade-50 focus:border-neon-green/50 focus:outline-none"
      />

      {error && (
        <p className="text-sm text-red-400" role="alert">
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => submit("approve")}
          disabled={decisionDisabled}
          className="inline-flex h-10 items-center rounded-full bg-neon-green px-5 text-sm font-medium text-background transition hover:opacity-90 disabled:opacity-50"
        >
          {active === "approve" ? "Approving…" : "Approve"}
        </button>
        <button
          type="button"
          onClick={() => submit("request-changes")}
          disabled={disabled}
          className="inline-flex h-10 items-center rounded-full border border-amber-500/40 bg-amber-500/10 px-5 text-sm font-medium text-amber-200 transition hover:bg-amber-500/15 disabled:opacity-50"
        >
          {active === "request-changes" ? "Sending…" : "Request changes"}
        </button>
        <button
          type="button"
          onClick={() => submit("reject")}
          disabled={decisionDisabled}
          className="inline-flex h-10 items-center rounded-full border border-red-500/40 bg-red-500/10 px-5 text-sm font-medium text-red-300 transition hover:bg-red-500/15 disabled:opacity-50"
        >
          {active === "reject" ? "Rejecting…" : "Reject"}
        </button>
      </div>

      {status !== "pending" && (
        <p className="text-xs text-shade-50">
          This verification is already {status === "verified" ? "approved" : status}.
        </p>
      )}
    </div>
  );
}
