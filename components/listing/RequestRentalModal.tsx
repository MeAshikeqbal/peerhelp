"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addDays, differenceInCalendarDays, format } from "date-fns";
import type { DateRange } from "react-day-picker";
import { CalendarDays, Banknote, ShieldCheck, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface RequestRentalModalProps {
  listingId: string;
  rentalPriceType: string;
  pricePerDay: number;
  securityDeposit: number;
  onClose: () => void;
}

export function RequestRentalModal({
  listingId,
  rentalPriceType,
  pricePerDay,
  securityDeposit,
  onClose,
}: RequestRentalModalProps) {
  const router = useRouter();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [range, setRange] = useState<DateRange | undefined>({
    from: addDays(today, 1),
    to: addDays(today, 8),
  });
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const days =
    range?.from && range?.to
      ? Math.max(1, differenceInCalendarDays(range.to, range.from))
      : null;
  const validRange = days != null && days >= 1 && days <= 365;

  const isPerDay = rentalPriceType === "per_day";
  const rentSubtotal =
    validRange && isPerDay ? days * pricePerDay : isPerDay ? 0 : pricePerDay;
  const upfrontTotal = rentSubtotal + securityDeposit;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validRange || !range?.from) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/deals/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listing_id: listingId,
          proposed_days: days,
          proposed_start_date: format(range.from, "yyyy-MM-dd"),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? "Failed to request rental");
        return;
      }
      onClose();
      router.refresh();
    } catch {
      setError("An error occurred while requesting the rental");
    } finally {
      setIsSubmitting(false);
    }
  }

  const fmt = (d: Date) => format(d, "LLL d, yyyy");

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-overlay/[0.07] bg-void p-6 space-y-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-foreground">
              Request Rental
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Pick the dates you&apos;d like to borrow this book.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1 text-muted-foreground hover:bg-overlay/[0.05] hover:text-foreground transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">
              Rental period
            </label>
            <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-start font-normal h-10"
                >
                  <CalendarDays size={14} className="mr-2 shrink-0" />
                  {range?.from ? (
                    range.to ? (
                      <span className="tabular-nums">
                        {fmt(range.from)} → {fmt(range.to)}
                      </span>
                    ) : (
                      <span className="tabular-nums">{fmt(range.from)}</span>
                    )
                  ) : (
                    <span className="text-muted-foreground">Pick dates</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  defaultMonth={range?.from}
                  selected={range}
                  onSelect={setRange}
                  numberOfMonths={1}
                  disabled={{ before: today }}
                  autoFocus
                />
              </PopoverContent>
            </Popover>
            {validRange && (
              <p className="text-xs text-muted-foreground tabular-nums">
                {days} {days === 1 ? "day" : "days"}
              </p>
            )}
            {!validRange && range?.from && (
              <p className="text-xs text-amber-400">
                Pick an end date to continue.
              </p>
            )}
          </div>

          <div className="rounded-xl border border-overlay/[0.07] bg-forest p-3.5 space-y-2.5 text-xs">
            <div className="flex justify-between text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Banknote size={12} />
                Rental cost
              </span>
              <span className="text-foreground font-medium tabular-nums">
                {isPerDay
                  ? validRange
                    ? `₹${rentSubtotal} (₹${pricePerDay}/day × ${days})`
                    : "Pick dates above"
                  : `₹${pricePerDay} flat`}
              </span>
            </div>

            <div className="flex justify-between items-start gap-3">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <ShieldCheck size={12} className="text-amber-400" />
                Refundable deposit
              </span>
              <span className="text-amber-400 font-semibold tabular-nums">
                ₹{securityDeposit}
              </span>
            </div>
            {securityDeposit > 0 && (
              <p className="text-[11px] text-muted-foreground/70 leading-snug -mt-1.5">
                Held by the owner; returned to you when the book is given back
                in good condition.
              </p>
            )}

            <div className="border-t border-border/50 pt-2.5 flex justify-between font-semibold text-foreground">
              <span>You&apos;ll pay upfront</span>
              <span className="tabular-nums text-base">₹{upfrontTotal}</span>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-900/20 border border-red-600/20 text-red-400 text-xs">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !validRange}
              className="flex-1 bg-neon-green text-void hover:bg-neon-green/90 font-semibold"
            >
              {isSubmitting ? "Sending…" : "Request Rental"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
