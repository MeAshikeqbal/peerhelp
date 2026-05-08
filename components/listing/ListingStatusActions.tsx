"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

interface ListingStatusActionsProps {
  listingId: string;
  currentStatus: string;
}

export function ListingStatusActions({ listingId, currentStatus }: ListingStatusActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<"sold" | "cancelled" | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (currentStatus !== "active") return null;

  async function updateStatus(status: "sold" | "cancelled") {
    setLoading(status);
    setError(null);
    try {
      const res = await fetch(`/api/listings/${listingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? "Failed to update status");
        return;
      }
      router.refresh();
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="rounded-xl border border-border bg-overlay/[0.02] p-4 space-y-3">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60">
        Manage listing
      </p>

      {/* Mark as sold — primary positive action */}
      <Button
        variant="outline"
        className="w-full gap-2 border-neon-green/30 bg-neon-green/[0.06] text-neon-green hover:bg-neon-green/[0.14] hover:border-neon-green/50 transition-colors disabled:opacity-50"
        onClick={() => updateStatus("sold")}
        disabled={!!loading}
      >
        {loading === "sold" ? (
          <>
            <Loader2 size={14} className="animate-spin" />
            Marking as sold…
          </>
        ) : (
          <>
            <CheckCircle2 size={14} />
            Mark as Sold
          </>
        )}
      </Button>

      {/* Divider */}
      <div className="relative flex items-center gap-2">
        <span className="flex-1 border-t border-border/40" />
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground/40">or</span>
        <span className="flex-1 border-t border-border/40" />
      </div>

      {/* Cancel — destructive secondary action */}
      <Button
        variant="ghost"
        className="w-full gap-2 text-red-400/70 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-colors disabled:opacity-50"
        onClick={() => updateStatus("cancelled")}
        disabled={!!loading}
      >
        {loading === "cancelled" ? (
          <>
            <Loader2 size={14} className="animate-spin" />
            Cancelling…
          </>
        ) : (
          <>
            <XCircle size={14} />
            Cancel Listing
          </>
        )}
      </Button>

      {/* Error message */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2">
          <XCircle size={12} className="shrink-0 text-red-400" />
          <p className="text-xs text-red-400">{error}</p>
        </div>
      )}
    </div>
  );
}
