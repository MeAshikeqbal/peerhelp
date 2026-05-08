"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Phone, Copy, Check, Loader2, MessageCircle } from "lucide-react";

interface ContactRevealProps {
  dealId: string;
  /** The role of the *counterpart* whose contact is being revealed. */
  counterpartRole?: "buyer" | "seller";
  counterpartName?: string;
}

type RevealState = "idle" | "loading" | "revealed" | "no-phone";

export function ContactReveal({
  dealId,
  counterpartRole,
  counterpartName,
}: ContactRevealProps) {
  const [state, setState] = useState<RevealState>("idle");
  const [phone, setPhone] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const ctaLabel =
    counterpartRole === "seller"
      ? "Contact seller"
      : counterpartRole === "buyer"
      ? "Contact buyer"
      : "View contact";

  async function reveal() {
    setState("loading");
    const supabase = createClient();
    const { data, error } = await supabase.rpc("get_deal_contact_phone", {
      p_deal_id: dealId,
    });
    if (error || data === null || data === undefined) {
      setState("no-phone");
      return;
    }
    setPhone(data as string);
    setState("revealed");
  }

  async function copyPhone() {
    if (!phone) return;
    await navigator.clipboard.writeText(phone);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (state === "idle") {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={reveal}
        className="h-9 gap-2 border-neon-green/30 bg-neon-green/[0.06] px-3 text-xs font-medium text-neon-green hover:bg-neon-green/15 hover:text-neon-green sm:h-8"
      >
        <Phone size={13} />
        <span>{ctaLabel}</span>
      </Button>
    );
  }

  if (state === "loading") {
    return (
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground h-9 sm:h-8">
        <Loader2 size={12} className="animate-spin" />
        Loading…
      </div>
    );
  }

  if (state === "no-phone") {
    return (
      <p className="text-xs italic text-muted-foreground">
        {counterpartName ? `${counterpartName} hasn't shared a number` : "Contact info not provided"}
      </p>
    );
  }

  // revealed — mobile: tappable tel/sms; desktop: copyable chip
  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Phone chip — tappable on mobile */}
      <a
        href={`tel:${phone}`}
        className="group flex items-center gap-2 rounded-lg border border-neon-green/25 bg-neon-green/[0.07] px-2.5 py-1.5 transition-colors hover:bg-neon-green/[0.12] active:scale-[0.98]"
      >
        <Phone size={12} className="shrink-0 text-neon-green" />
        <span className="text-sm font-medium tabular-nums text-foreground tracking-tight">
          {phone}
        </span>
      </a>

      {/* SMS — primary mobile action */}
      <a
        href={`sms:${phone}`}
        title="Send SMS"
        className="flex h-8 w-8 items-center justify-center rounded-md border border-overlay/[0.08] bg-overlay/[0.03] text-muted-foreground transition-colors hover:border-neon-green/30 hover:text-neon-green sm:hidden"
        aria-label="Send SMS"
      >
        <MessageCircle size={13} />
      </a>

      {/* Copy — primary desktop action */}
      <button
        onClick={copyPhone}
        title={copied ? "Copied!" : "Copy number"}
        aria-label={copied ? "Copied" : "Copy number"}
        className="flex h-8 w-8 items-center justify-center rounded-md border border-overlay/[0.08] bg-overlay/[0.03] text-muted-foreground transition-colors hover:border-neon-green/30 hover:text-foreground"
      >
        {copied ? (
          <Check size={13} className="text-neon-green" />
        ) : (
          <Copy size={13} />
        )}
      </button>
    </div>
  );
}

