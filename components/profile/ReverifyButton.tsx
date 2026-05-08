"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw, ChevronRight } from "lucide-react";

export function ReverifyButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  async function trigger() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/profile/reverify", { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.message ?? "Failed to start re-verification");
        setLoading(false);
        return;
      }
      router.push("/student-verification");
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setConfirming((v) => !v)}
        className="group flex w-full items-center justify-between px-6 py-4 hover:bg-overlay/[0.03] transition-colors text-left"
        disabled={loading}
      >
        <div className="flex items-center gap-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-overlay/5">
            <RotateCcw size={14} className="text-shade-50" />
          </div>
          <div>
            <p className="text-sm text-foreground">Change email / re-verify</p>
            <p className="text-[11px] text-shade-50">Use a different college email</p>
          </div>
        </div>
        <ChevronRight size={15} className="text-shade-50 group-hover:text-foreground transition-colors" />
      </button>

      {confirming && (
        <div className="px-6 py-4 border-t border-overlay/[0.05] bg-overlay/[0.02] space-y-3">
          <p className="text-xs text-shade-50 leading-relaxed">
            This will reset your verification status. You&apos;ll need to verify a college email again before
            making deals or creating listings. Continue?
          </p>
          {error && <p className="text-xs text-red-400">{error}</p>}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={trigger}
              disabled={loading}
              className="inline-flex h-8 items-center rounded-md border border-red-600/30 bg-red-900/20 px-3 text-xs font-medium text-red-300 hover:bg-red-900/30 disabled:opacity-50"
            >
              {loading ? "Resetting..." : "Yes, reset and re-verify"}
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              disabled={loading}
              className="inline-flex h-8 items-center rounded-md border border-overlay/10 bg-overlay/[0.03] px-3 text-xs text-shade-50 hover:bg-overlay/[0.06] disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
