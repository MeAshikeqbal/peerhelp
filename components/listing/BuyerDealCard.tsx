import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DealActions } from "@/components/deals/DealActions";
import { RequestDealButton } from "@/components/listing/RequestDealButton";
import { Clock, CheckCircle2, XCircle, CheckCheck, ArrowRight, CalendarDays } from "lucide-react";

interface DealRow {
  id: string;
  status: string;
  buyer_id: string;
  created_at: string;
  proposed_days?: number | null;
  rental_start_date?: string | null;
  rental_end_date?: string | null;
  return_confirmed_at?: string | null;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; badgeClass: string; icon: React.ElementType; description: string }
> = {
  pending: {
    label: "Pending review",
    badgeClass: "bg-yellow-900/20 text-yellow-400 border-yellow-600/20",
    icon: Clock,
    description: "Waiting for the seller to respond.",
  },
  accepted: {
    label: "Accepted",
    badgeClass: "bg-neon-green/10 text-neon-green border-neon-green/20",
    icon: CheckCircle2,
    description: "The seller accepted your request. Reach out to arrange pickup.",
  },
  completed: {
    label: "Completed",
    badgeClass: "bg-green-900/20 text-green-400 border-green-600/20",
    icon: CheckCheck,
    description: "This deal has been completed.",
  },
  cancelled: {
    label: "Cancelled",
    badgeClass: "bg-zinc-800 text-zinc-400 border-zinc-700",
    icon: XCircle,
    description: "This deal was cancelled.",
  },
};

interface BuyerDealCardProps {
  existingDeal: DealRow | null;
  listingId: string;
  listingStatus: string;
  transactionType?: string;
  rentalPriceType?: string | null;
  price?: number;
  securityDeposit?: number | null;
}

export function BuyerDealCard({
  existingDeal,
  listingId,
  listingStatus,
  transactionType,
  rentalPriceType,
  price,
  securityDeposit,
}: BuyerDealCardProps) {
  if (!existingDeal) {
    return (
      <RequestDealButton
        listingId={listingId}
        listingStatus={listingStatus}
        transactionType={transactionType}
        rentalPriceType={rentalPriceType}
        price={price}
        securityDeposit={securityDeposit}
      />
    );
  }

  const config = STATUS_CONFIG[existingDeal.status] ?? {
    label: existingDeal.status,
    badgeClass: "bg-secondary text-muted-foreground border-border",
    icon: Clock,
    description: "",
  };
  const Icon = config.icon;

  const isRental = !!existingDeal.proposed_days;
  const isOverdue =
    isRental &&
    existingDeal.status === "accepted" &&
    existingDeal.rental_end_date &&
    new Date(existingDeal.rental_end_date) < new Date();

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

  return (
    <div className="space-y-3">
      {/* Status banner */}
      <div className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${config.badgeClass}`}>
        <Icon size={16} className="shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-semibold leading-none">{config.label}</p>
          <p className="mt-1 text-xs opacity-80 leading-snug">{config.description}</p>
        </div>
      </div>

      {/* Rental date info */}
      {isRental && existingDeal.rental_start_date && existingDeal.rental_end_date && (
        <div
          className={`flex items-start gap-2 rounded-xl border px-4 py-3 text-xs ${
            isOverdue
              ? "bg-red-900/20 border-red-600/20 text-red-400"
              : "bg-overlay/[0.03] border-border text-muted-foreground"
          }`}
        >
          <CalendarDays size={13} className="mt-0.5 shrink-0" />
          <div className="space-y-0.5">
            <p>
              Rental period: {fmtDate(existingDeal.rental_start_date)} →{" "}
              <span className={isOverdue ? "text-red-400 font-semibold" : "text-foreground font-medium"}>
                {fmtDate(existingDeal.rental_end_date)}
              </span>
            </p>
            {isOverdue && <p className="font-semibold">Return overdue — please contact the owner.</p>}
          </div>
        </div>
      )}

      {/* Pending rental: show proposed days */}
      {isRental && existingDeal.status === "pending" && (
        <p className="text-xs text-muted-foreground">
          Requested for{" "}
          <span className="text-foreground font-medium">{existingDeal.proposed_days} day(s)</span>.
        </p>
      )}

      {/* Pending: cancel action */}
      {existingDeal.status === "pending" && (
        <DealActions dealId={existingDeal.id} dealStatus={existingDeal.status} role="buyer" />
      )}

      {/* View in Deals link */}
      <Link href="/dashboard/deals">
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-xs text-muted-foreground hover:text-foreground justify-between px-3"
        >
          View in Deals
          <ArrowRight size={13} />
        </Button>
      </Link>
    </div>
  );
}

