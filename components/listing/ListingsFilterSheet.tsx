"use client";

import { useRouter } from "next/navigation";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ListingsFilters } from "@/components/listing/ListingsFilters";

interface FilterValues {
  q?: string;
  type?: string;
  condition?: string;
  hostel?: string;
  department?: string;
  year?: number;
  minPrice?: number;
  maxPrice?: number;
  college?: string;
  transaction_type?: string;
  page: number;
}

export function ListingsFilterSheet({
  filters,
  baseUrl,
  myCollegeName,
}: {
  filters: FilterValues;
  baseUrl?: string;
  myCollegeName?: string;
}) {
  const router = useRouter();
  const effectiveBase = baseUrl ?? "/dashboard/listings";

  const activeCount = [
    filters.type,
    filters.condition,
    filters.hostel,
    filters.department,
    filters.college === "mine" ? filters.college : undefined,
    filters.transaction_type,
    filters.year != null ? String(filters.year) : undefined,
    filters.minPrice != null ? String(filters.minPrice) : undefined,
    filters.maxPrice != null ? String(filters.maxPrice) : undefined,
  ].filter((v) => v != null && v !== "").length;

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`gap-2 transition-all ${
            activeCount > 0
              ? "border-neon-green/40 text-neon-green bg-neon-green/5 hover:bg-neon-green/10"
              : ""
          }`}
        >
          <SlidersHorizontal size={15} />
          Filters
          {activeCount > 0 && (
            <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-neon-green text-void text-[10px] font-bold px-1">
              {activeCount}
            </span>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent side="left" className="flex w-80 flex-col p-0 gap-0">
        {/* Header */}
        <SheetHeader className="flex-row items-center justify-between space-y-0 border-b border-border/60 px-5 py-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <SheetTitle className="text-base font-semibold">Filters</SheetTitle>
            {activeCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-neon-green/15 text-neon-green text-[11px] font-bold px-1.5">
                {activeCount}
              </span>
            )}
          </div>
          {activeCount > 0 && (
            <button
              type="button"
              onClick={() => router.push(effectiveBase)}
              className="text-xs text-muted-foreground hover:text-neon-green transition-colors"
            >
              Clear all
            </button>
          )}
        </SheetHeader>

        {/* Scrollable filter body */}
        <div className="flex-1 overflow-y-auto px-5 py-5">
          <ListingsFilters
            filters={filters}
            hideHeader
            baseUrl={baseUrl}
            myCollegeName={myCollegeName}
          />
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-border/60 px-5 py-4">
          <SheetClose asChild>
            <Button className="w-full" size="sm">
              Done
            </Button>
          </SheetClose>
        </div>
      </SheetContent>
    </Sheet>
  );
}

