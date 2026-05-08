
"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { BookOpen, CalendarDays, AlertTriangle, ChevronRight, Wallet, Coins } from "lucide-react";
import { DealActions } from "@/components/deals/DealActions";
import { RatingForm } from "@/components/deals/RatingForm";
import { ContactReveal } from "@/components/deals/ContactReveal";

export interface DealListingRow {
  id: string;
  title: string;
  price: number;
  condition: string;
  transaction_type?: string;
  rental_price_type?: string | null;
  security_deposit?: number | null;
  image_url?: string | null;
}

export interface DealCardData {
  id: string;
  status: string;
  created_at: string;
  listing_id: string;
  listings: DealListingRow | null;
  role: "buyer" | "seller";
  counterpartName: string;
  counterpartId?: string;
  hasRated?: boolean;
  proposed_days?: number | null;
  proposed_start_date?: string | null;
  rental_start_date?: string | null;
  rental_end_date?: string | null;
  return_confirmed_at?: string | null;
}

const STATUS_CFG: Record<string, { label: string; cls: string; dot: string }> = {
  pending:   { label: "Pending",   cls: "bg-amber-500/10 text-amber-400 border-amber-500/20",       dot: "bg-amber-400" },
  accepted:  { label: "Accepted",  cls: "bg-neon-green/10 text-neon-green border-neon-green/20",    dot: "bg-neon-green" },
  completed: { label: "Completed", cls: "bg-sky-500/10 text-sky-400 border-sky-500/20",             dot: "bg-sky-400" },
  cancelled: { label: "Cancelled", cls: "bg-zinc-600/15 text-zinc-500 border-zinc-600/20",          dot: "bg-zinc-500" },
};

const ROLE_CLS = {
  buyer:  "bg-blue-500/10 text-blue-400 border-blue-500/20",
  seller: "bg-violet-500/10 text-violet-400 border-violet-500/20",
};

export function DealCard({ deal }: { deal: DealCardData }) {
  const [rated, setRated] = useState(deal.hasRated ?? false);
  const s = STATUS_CFG[deal.status];
  const hasContact = deal.status === "accepted" || deal.status === "completed";
  const hasFooter  = deal.status !== "cancelled";

  const isRental = deal.listings?.transaction_type === "rental";
  const isOverdue =
    isRental &&
    deal.status === "accepted" &&
    !!deal.rental_end_date &&
    new Date(deal.rental_end_date) < new Date();

  // Days until return is due (negative = overdue). Uses calendar-day diff.
  const daysUntilDue = (() => {
    if (!isRental || deal.status !== "accepted" || !deal.rental_end_date) return null;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const end = new Date(deal.rental_end_date);
    end.setHours(0, 0, 0, 0);
    return Math.round((end.getTime() - now.getTime()) / 86400000);
  })();

  // Counterpart role = whoever is on the *other* side of this deal.
  const counterpartRole: "buyer" | "seller" =
    deal.role === "buyer" ? "seller" : "buyer";

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

  const roleLabel =
    deal.role === "buyer"
      ? isRental ? "Renting" : "Buying"
      : isRental ? "Lending" : "Selling";

  return (
    <div
      className={`group relative rounded-2xl border bg-overlay/[0.02] p-4 sm:p-5 transition-all hover:bg-overlay/[0.04] ${
        isOverdue
          ? "border-red-500/25 hover:border-red-500/40"
          : "border-overlay/[0.07] hover:border-accent/30"
      }`}
    >
      {/* Status accent stripe (left edge) */}
      <span
        className={`absolute left-0 top-4 bottom-4 w-1 rounded-r-full ${
          s?.dot ?? "bg-zinc-500"
        } opacity-70`}
        aria-hidden
      />

      {/* ── Main row ── */}
      <div className="flex items-start gap-3 sm:gap-4 pl-2">
        {/* Image / Icon */}
        <Link
          href={deal.listings?.id ? `/dashboard/listings/${deal.listings.id}` : "#"}
          aria-label={deal.listings?.title ?? "Listing"}
          className="relative h-14 w-14 sm:h-16 sm:w-16 shrink-0 overflow-hidden rounded-xl border border-overlay/[0.08] bg-overlay/[0.04] flex items-center justify-center transition-colors group-hover:border-accent/30"
        >
          {deal.listings?.image_url ? (
            <Image
              src={deal.listings.image_url}
              alt={deal.listings.title}
              fill
              sizes="64px"
              className="object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            <BookOpen
              size={20}
              className="text-muted-foreground/70 transition-colors group-hover:text-accent"
            />
          )}
        </Link>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Badge row */}
          <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
            <span className={`inline-flex items-center text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${ROLE_CLS[deal.role]}`}>
              {roleLabel}
            </span>
            <span className={`inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${s?.cls ?? "bg-secondary text-muted-foreground border-border"}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${s?.dot ?? "bg-zinc-500"}`} aria-hidden />
              {s?.label ?? deal.status}
            </span>
            {isRental && (
              <span className="inline-flex items-center text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border bg-indigo-500/10 text-indigo-400 border-indigo-500/20">
                Rental
              </span>
            )}
            {isOverdue && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border bg-red-500/10 text-red-400 border-red-500/25">
                <AlertTriangle size={10} />
                Overdue
              </span>
            )}
          </div>

          {/* Title */}
          {deal.listings?.id ? (
            <Link
              href={`/dashboard/listings/${deal.listings.id}`}
              className="inline-flex items-center gap-1 text-[15px] font-semibold leading-snug text-foreground hover:text-accent transition-colors line-clamp-1"
            >
              <span className="line-clamp-1">{deal.listings.title}</span>
              <ChevronRight size={14} className="shrink-0 opacity-0 -ml-0.5 transition-all group-hover:opacity-60 group-hover:ml-0" />
            </Link>
          ) : (
            <p className="text-[15px] font-semibold leading-snug text-foreground line-clamp-1">
              {deal.listings?.title ?? "Untitled Listing"}
            </p>
          )}

          {/* Counterpart + date */}
          <p className="text-xs text-muted-foreground mt-1">
            {deal.role === "buyer" ? "From" : "To"}{" "}
            {deal.counterpartId ? (
              <Link
                href={`/dashboard/profile/${deal.counterpartId}`}
                className="text-foreground/80 hover:text-neon-green transition-colors font-medium"
              >
                {deal.counterpartName}
              </Link>
            ) : (
              <span className="text-foreground/80 font-medium">{deal.counterpartName}</span>
            )}
            <span className="mx-1.5 opacity-30">·</span>
            <span className="tabular-nums">
              {new Date(deal.created_at).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </span>
          </p>
        </div>

        {/* Price */}
        {deal.listings?.price != null && (
          <div className="text-right shrink-0 pl-1 sm:pl-2">
            <p className="font-display text-lg sm:text-xl font-bold text-accent leading-none tabular-nums">
              ₹{deal.listings.price}
              {isRental && deal.listings.rental_price_type === "per_day" && (
                <span className="text-[11px] font-normal text-muted-foreground/80 ml-0.5">/d</span>
              )}
            </p>
            {deal.listings.condition && (
              <p className="text-[11px] text-muted-foreground capitalize mt-1.5">
                {deal.listings.condition}
              </p>
            )}
          </div>
        )}
      </div>

      {/* ── Amount summary ── */}
      {deal.listings?.price != null && deal.status !== "cancelled" && (() => {
        const days =
          isRental
            ? (deal.rental_start_date && deal.rental_end_date
                ? Math.max(
                    1,
                    Math.ceil(
                      (new Date(deal.rental_end_date).getTime() -
                        new Date(deal.rental_start_date).getTime()) /
                        (1000 * 60 * 60 * 24),
                    ),
                  )
                : deal.proposed_days ?? null)
            : null;
        const rentSubtotal =
          isRental && days != null ? deal.listings.price * days : null;
        const deposit = isRental ? deal.listings.security_deposit ?? 0 : 0;
        const total =
          isRental
            ? (rentSubtotal ?? 0) + deposit
            : deal.listings.price;
        const isSeller = deal.role === "seller";
        const verb = isSeller ? "You'll collect" : "You'll pay";
        const Icon = isSeller ? Wallet : Coins;
        const tone = isSeller
          ? "border-neon-green/20 bg-neon-green/[0.05] text-neon-green"
          : "border-accent/20 bg-accent/[0.05] text-accent";

        return (
          <div className={`mt-3 flex items-center justify-between gap-3 rounded-lg border px-3 py-2 ml-2 ${tone}`}>
            <div className="flex items-center gap-2 min-w-0">
              <Icon size={14} className="shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wider opacity-80">
                  {verb}
                </p>
                {isRental && rentSubtotal != null && (
                  <p className="text-[11px] text-muted-foreground tabular-nums mt-0.5">
                    ₹{deal.listings.price} × {days}{days === 1 ? " day" : " days"}
                    {deposit > 0 && (
                      <>
                        {" "}<span className="opacity-60">+</span> ₹{deposit} deposit
                      </>
                    )}
                  </p>
                )}
                {isRental && rentSubtotal == null && deposit > 0 && (
                  <p className="text-[11px] text-muted-foreground tabular-nums mt-0.5">
                    + ₹{deposit} refundable deposit
                  </p>
                )}
              </div>
            </div>
            <p className="font-display text-lg sm:text-xl font-bold leading-none tabular-nums shrink-0">
              ₹{total}
            </p>
          </div>
        );
      })()}

      {/* ── Footer ── */}
      {hasFooter && (
        <div className="mt-4 pt-4 border-t border-overlay/[0.06] space-y-3 pl-2">
          {/* Rental dates */}
          {isRental && deal.rental_start_date && deal.rental_end_date && (
            <div
              className={`flex items-center gap-2.5 text-xs rounded-lg px-3 py-2 border ${
                isOverdue
                  ? "bg-red-500/[0.08] border-red-500/25 text-red-300"
                  : daysUntilDue != null && daysUntilDue <= 2
                  ? "bg-amber-500/[0.08] border-amber-500/25 text-amber-300"
                  : "bg-overlay/[0.03] border-overlay/[0.08] text-muted-foreground"
              }`}
            >
              <CalendarDays size={13} className="shrink-0" />
              <span className="flex-1">
                <span className="tabular-nums">{fmtDate(deal.rental_start_date)}</span>
                <span className="mx-1.5 opacity-50">→</span>
                <span
                  className={`tabular-nums font-medium ${
                    isOverdue
                      ? "text-red-300"
                      : daysUntilDue != null && daysUntilDue <= 2
                      ? "text-amber-200"
                      : "text-foreground"
                  }`}
                >
                  {fmtDate(deal.rental_end_date)}
                </span>
              </span>
              {daysUntilDue != null && (
                <span className="text-[10px] font-bold uppercase tracking-wider whitespace-nowrap">
                  {daysUntilDue < 0
                    ? `Overdue ${Math.abs(daysUntilDue)}d`
                    : daysUntilDue === 0
                    ? "Due today"
                    : daysUntilDue === 1
                    ? "Due tomorrow"
                    : `Due in ${daysUntilDue}d`}
                </span>
              )}
            </div>
          )}

          {isRental && deal.status === "pending" && deal.proposed_days && (
            <p className="text-xs text-muted-foreground">
              Proposed:{" "}
              <span className="text-foreground font-medium tabular-nums">
                {deal.proposed_days} {deal.proposed_days === 1 ? "day" : "days"}
              </span>
              {deal.proposed_start_date && (
                <>
                  <span className="mx-1.5 opacity-30">·</span>
                  starting{" "}
                  <span className="text-foreground font-medium tabular-nums">
                    {fmtDate(deal.proposed_start_date)}
                  </span>
                </>
              )}
            </p>
          )}

          {/* Contact + actions — stack on mobile */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {hasContact ? (
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-1.5">
                  {counterpartRole === "seller" ? "Seller" : "Buyer"} contact
                </p>
                <ContactReveal
                  dealId={deal.id}
                  counterpartRole={counterpartRole}
                  counterpartName={deal.counterpartName}
                />
              </div>
            ) : (
              <span className="hidden sm:block" />
            )}
            <div className="flex justify-end shrink-0">
              <DealActions dealId={deal.id} dealStatus={deal.status} role={deal.role} />
            </div>
          </div>

          {/* Rating */}
          {deal.status === "completed" && !rated && (
            <RatingForm
              dealId={deal.id}
              counterpartName={deal.counterpartName}
              onSuccess={() => setRated(true)}
            />
          )}
          {deal.status === "completed" && rated && (
            <div className="flex items-center justify-center gap-1.5 py-2 rounded-lg border border-neon-green/15 bg-neon-green/[0.04]">
              <span className="text-xs text-neon-green/90">
                ✓ You&apos;ve rated this deal
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

