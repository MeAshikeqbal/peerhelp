"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { RequestRentalModal } from "@/components/listing/RequestRentalModal";

interface RequestDealButtonProps {
  listingId: string;
  listingStatus: string;
  transactionType?: string;
  rentalPriceType?: string | null;
  price?: number;
  securityDeposit?: number | null;
}

interface DealApiResponse {
  message?: string;
}

export function RequestDealButton({
  listingId,
  listingStatus,
  transactionType = "sale",
  rentalPriceType,
  price = 0,
  securityDeposit,
}: RequestDealButtonProps) {
  const router = useRouter();
  const [isRequesting, setIsRequesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRentalModal, setShowRentalModal] = useState(false);

  const isRental = transactionType === "rental";
  const isInactive = listingStatus !== "active";

  async function handleRequestDeal() {
    setIsRequesting(true);
    setError(null);

    try {
      const res = await fetch("/api/deals/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listing_id: listingId }),
      });

      const data: DealApiResponse = await res.json();

      if (!res.ok) {
        setError(data.message ?? "Failed to request deal");
        return;
      }

      router.refresh();
    } catch {
      setError("An error occurred while requesting the deal");
    } finally {
      setIsRequesting(false);
    }
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="p-3 rounded-lg bg-red-900/20 border border-red-600/20 text-red-400 text-xs">
          {error}
        </div>
      )}
      <Button
        onClick={isRental ? () => setShowRentalModal(true) : handleRequestDeal}
        disabled={isRequesting || isInactive}
        className="w-full bg-neon-green text-void hover:bg-neon-green/90 font-semibold h-11"
      >
        {isRequesting
          ? "Sending request…"
          : isInactive
          ? "No longer available"
          : isRental
          ? "Request to Rent"
          : "Request to Buy"}
      </Button>
      {!isInactive && (
        <p className="text-xs text-muted-foreground text-center">
          {isRental
            ? "The owner will review and confirm the rental period."
            : "The seller will review and accept or decline your request."}
        </p>
      )}

      {showRentalModal && (
        <RequestRentalModal
          listingId={listingId}
          rentalPriceType={rentalPriceType ?? "flat"}
          pricePerDay={price}
          securityDeposit={securityDeposit ?? 0}
          onClose={() => setShowRentalModal(false)}
        />
      )}
    </div>
  );
}

