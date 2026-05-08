"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare } from "lucide-react";

interface MessageButtonProps {
  contextType: "deal" | "tutor_request";
  contextId: string;
  variant?: "default" | "compact" | "ghost";
  className?: string;
  children?: React.ReactNode;
}

export function MessageButton({
  contextType,
  contextId,
  variant = "default",
  className = "",
  children,
}: MessageButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function open() {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch("/api/messages/threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ context_type: contextType, context_id: contextId }),
      });
      const j = await r.json();
      if (!r.ok || !j?.thread?.id) {
        setError(
          r.status === 403
            ? "You can't message this user."
            : (j?.message ?? "Failed to start conversation"),
        );
        return;
      }
      router.push(`/dashboard/messages/${j.thread.id}`);
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  const baseCls =
    variant === "compact"
      ? "inline-flex items-center gap-1 rounded-md border border-overlay/15 px-2 py-1 text-xs font-medium text-shade-30 hover:text-foreground hover:bg-overlay/5"
      : variant === "ghost"
        ? "inline-flex items-center gap-1.5 text-sm text-shade-30 hover:text-neon-green transition-colors"
        : "inline-flex items-center gap-1.5 rounded-md border border-neon-green/30 bg-neon-green/10 px-3 py-1.5 text-xs font-medium text-neon-green hover:bg-neon-green/15 transition-colors";

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={open}
        disabled={loading}
        className={`${baseCls} disabled:opacity-50`}
      >
        <MessageSquare size={variant === "compact" ? 12 : 14} />
        {children ?? "Message"}
      </button>
      {error && (
        <p
          role="alert"
          className="absolute left-0 top-full mt-1 whitespace-nowrap text-[10px] text-red-400"
        >
          {error}
        </p>
      )}
    </div>
  );
}
