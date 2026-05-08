"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Dialog } from "radix-ui";
import { X, ExternalLink, Tag, BookOpen, Calendar, Layers } from "lucide-react";

interface DealContext {
  type: "deal";
  deal: {
    id: string;
    status: string;
    created_at: string;
    listing_id: string;
    listings: {
      title: string | null;
      price: number | null;
      condition: string | null;
      image_url: string | null;
      transaction_type: string | null;
    } | null;
  };
}

interface TutorContext {
  type: "tutor_request";
  request: {
    id: string;
    subject: string;
    mode: string;
    proposed_when: string | null;
    status: string;
    message: string | null;
  };
}

type ContextPayload = DealContext | TutorContext;

interface ContextPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contextType: "deal" | "tutor_request";
  contextId: string;
  contextHref?: string | null;
}

const statusColour: Record<string, string> = {
  pending: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
  accepted: "text-neon-green bg-neon-green/10 border-neon-green/20",
  completed: "text-neon-green bg-neon-green/10 border-neon-green/20",
  rejected: "text-red-400 bg-red-400/10 border-red-400/20",
  cancelled: "text-shade-50 bg-overlay/[0.04] border-overlay/10",
  reserved: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
  sold: "text-neon-green bg-neon-green/10 border-neon-green/20",
};

const whenFormatter = new Intl.DateTimeFormat("en-IN", {
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: true,
});

const priceFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export function ContextPreviewDialog({
  open,
  onOpenChange,
  contextType,
  contextId,
  contextHref,
}: ContextPreviewDialogProps) {
  const [payload, setPayload] = useState<ContextPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Lazy-fetch once when dialog opens for the first time.
  useEffect(() => {
    if (!open || payload) return;
    setLoading(true);
    setError(null);
    fetch(`/api/messages/context/${contextType}/${contextId}`)
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load context");
        return r.json() as Promise<ContextPayload>;
      })
      .then((data) => setPayload(data))
      .catch(() => setError("Could not load details."))
      .finally(() => setLoading(false));
  }, [open, payload, contextType, contextId]);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        {/* Overlay */}
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/60 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />

        {/* Content */}
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[min(420px,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-overlay/10 bg-deep-teal shadow-2xl focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-overlay/10 px-5 py-4">
            <div>
              <Dialog.Title className="text-sm font-semibold text-foreground">
                {contextType === "deal" ? "Deal details" : "Tutor request details"}
              </Dialog.Title>
              <Dialog.Description className="text-xs text-shade-50 mt-0.5">
                {contextType === "deal"
                  ? "The listing this conversation is about."
                  : "The tutor session request linked to this chat."}
              </Dialog.Description>
            </div>
            <Dialog.Close className="p-1.5 rounded-md text-shade-50 hover:text-foreground hover:bg-overlay/5 transition-colors">
              <X size={15} />
            </Dialog.Close>
          </div>

          {/* Body */}
          <div className="px-5 py-4 min-h-[140px]">
            {loading && (
              <div className="flex items-center justify-center py-8">
                <span className="h-5 w-5 rounded-full border-2 border-neon-green/30 border-t-neon-green animate-spin" />
              </div>
            )}

            {error && (
              <p className="text-center text-sm text-red-400 py-8">{error}</p>
            )}

            {payload?.type === "deal" && (
              <DealPreview deal={payload.deal} />
            )}

            {payload?.type === "tutor_request" && (
              <TutorPreview request={payload.request} />
            )}
          </div>

          {/* Footer CTA */}
          {contextHref && (
            <div className="border-t border-overlay/10 px-5 py-3">
              <Link
                href={contextHref}
                onClick={() => onOpenChange(false)}
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-overlay/15 bg-overlay/[0.04] py-2 text-xs font-medium text-shade-30 hover:text-foreground hover:border-overlay/30 transition-colors"
              >
                <ExternalLink size={12} />
                {contextType === "deal" ? "Open deal" : "Open request"}
              </Link>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/* ── Deal card ─────────────────────────────────────────────── */
function DealPreview({ deal }: { deal: DealContext["deal"] }) {
  const l = deal.listings;
  const cls =
    statusColour[deal.status] ??
    "text-shade-50 bg-overlay/[0.04] border-overlay/10";

  return (
    <div className="space-y-4">
      {/* Image + title */}
      {l?.image_url ? (
        <div className="relative h-36 w-full overflow-hidden rounded-xl border border-overlay/10">
          <Image
            src={l.image_url}
            alt={l.title ?? "Listing"}
            fill
            className="object-cover"
            sizes="420px"
          />
        </div>
      ) : (
        <div className="flex h-20 w-full items-center justify-center rounded-xl border border-overlay/10 bg-overlay/[0.04]">
          <BookOpen size={28} className="text-shade-50/30" strokeWidth={1} />
        </div>
      )}

      <div>
        <p className="text-sm font-semibold text-foreground line-clamp-2">
          {l?.title ?? "Listing"}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {l?.price != null && (
            <span className="text-sm font-bold text-neon-green">
              {priceFormatter.format(l.price)}
            </span>
          )}
          {l?.transaction_type && (
            <InfoChip icon={<Tag size={10} />}>
              {l.transaction_type}
            </InfoChip>
          )}
          {l?.condition && (
            <InfoChip icon={<Layers size={10} />}>{l.condition}</InfoChip>
          )}
          <span
            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${cls}`}
          >
            {deal.status}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ── Tutor request card ────────────────────────────────────── */
function TutorPreview({ request }: { request: TutorContext["request"] }) {
  const cls =
    statusColour[request.status] ??
    "text-shade-50 bg-overlay/[0.04] border-overlay/10";

  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-foreground">{request.subject}</p>

      <div className="flex flex-wrap items-center gap-2">
        <InfoChip icon={<BookOpen size={10} />}>{request.mode}</InfoChip>
        {request.proposed_when && (
          <InfoChip icon={<Calendar size={10} />}>
            {whenFormatter.format(new Date(request.proposed_when))}
          </InfoChip>
        )}
        <span
          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${cls}`}
        >
          {request.status}
        </span>
      </div>

      {request.message && (
        <p className="text-xs text-shade-50 border border-overlay/10 rounded-lg px-3 py-2 bg-overlay/[0.03] line-clamp-3">
          &ldquo;{request.message}&rdquo;
        </p>
      )}
    </div>
  );
}

/* ── Small info chip ───────────────────────────────────────── */
function InfoChip({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-overlay/10 bg-overlay/[0.04] px-2 py-0.5 text-[10px] text-shade-50 capitalize">
      {icon}
      {children}
    </span>
  );
}
