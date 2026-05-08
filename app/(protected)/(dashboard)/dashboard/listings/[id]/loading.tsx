import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";

export default function ListingDetailLoading() {
  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Back nav */}
      <div className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
        <ArrowLeft size={15} />
        Back to Listings
      </div>

      {/* Product hero */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* Image panel */}
        <Skeleton className="aspect-square w-full rounded-2xl" />

        {/* Right column */}
        <div className="flex flex-col gap-5">
          {/* Badges */}
          <div className="flex gap-2">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-14 rounded-full" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/3" />
          </div>

          {/* Price */}
          <Skeleton className="h-10 w-32" />

          <div className="border-t border-border" />

          {/* Details grid */}
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-1">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-5 w-24" />
              </div>
            ))}
          </div>

          <div className="border-t border-border" />

          {/* Seller card */}
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-1.5 flex-1">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-36" />
            </div>
          </div>

          {/* CTA button area */}
          <Skeleton className="h-10 w-full rounded-md" />
        </div>
      </div>

      {/* Description card */}
      <div className="rounded-xl border border-border p-5 space-y-3">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    </div>
  );
}
