"use client";

import { useOptimistic, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface DealActionsProps {
  dealId: string;
  dealStatus: string;
  role: "buyer" | "seller";
}

export function DealActions({ dealId, dealStatus, role }: DealActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [optimisticStatus, applyOptimisticStatus] = useOptimistic(
    dealStatus,
    (_current, next: string) => next
  );

  async function updateStatus(newStatus: string) {
    setLoading(newStatus);
    setError(null);
    startTransition(() => {
      applyOptimisticStatus(newStatus);
    });
    try {
      const res = await fetch(`/api/deals/${dealId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.message ?? "Failed to update deal");
        // useOptimistic auto-reverts when the action throws or on next render with server data
        router.refresh();
        return;
      }
      router.refresh();
    } catch {
      setError("An error occurred");
      router.refresh();
    } finally {
      setLoading(null);
    }
  }

  const busy = !!loading || isPending;

  return (
    <div className={`flex items-center gap-2 ${busy ? "pointer-events-none opacity-60" : ""}`}>
      {error && <span className="text-red-400 text-xs">{error}</span>}

      {optimisticStatus === "pending" && role === "seller" && (
        <>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => updateStatus("accepted")}
            disabled={busy}
            className="text-neon-green hover:text-neon-green/80 hover:bg-neon-green/10 border border-neon-green/20 h-7 px-3 text-xs"
          >
            {loading === "accepted" ? "..." : "Accept"}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => updateStatus("cancelled")}
            disabled={busy}
            className="text-red-400 hover:text-red-300 hover:bg-red-900/20 border border-red-600/20 h-7 px-3 text-xs"
          >
            {loading === "cancelled" ? "..." : "Decline"}
          </Button>
        </>
      )}

      {optimisticStatus === "pending" && role === "buyer" && (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => updateStatus("cancelled")}
          disabled={busy}
          className="text-muted-foreground hover:text-red-400 hover:bg-red-900/20 h-7 px-3 text-xs"
        >
          {loading === "cancelled" ? "..." : "Cancel"}
        </Button>
      )}

      {optimisticStatus === "accepted" && role === "seller" && (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => updateStatus("completed")}
          disabled={busy}
          className="text-green-400 hover:text-green-300 hover:bg-green-900/20 border border-green-600/20 h-7 px-3 text-xs"
        >
          {loading === "completed" ? "..." : "Mark Complete"}
        </Button>
      )}
    </div>
  );
}
