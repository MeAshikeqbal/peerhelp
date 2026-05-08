import { Skeleton } from "@/components/ui/skeleton";

interface ListingsSkeletonProps {
  /** Show the title block at the top */
  showTitle?: boolean;
  /** Number of card skeletons to render */
  count?: number;
}

export function ListingsSkeleton({ showTitle = true, count = 8 }: ListingsSkeletonProps) {
  return (
    <div className="animate-in fade-in duration-500">
      {showTitle && (
        <div className="mb-6">
          <Skeleton className="mb-3 h-10 w-48 rounded-lg sm:h-12" />
          <Skeleton className="h-5 w-72 rounded" />
        </div>
      )}

      <div className="flex gap-8">
        {/* Sidebar skeleton */}
        <aside className="hidden lg:block w-56 shrink-0 space-y-4">
          <Skeleton className="h-5 w-20 rounded" />
          <Skeleton className="h-9 w-full rounded-md" />
          <div className="space-y-2 pt-2">
            <Skeleton className="h-4 w-16 rounded" />
            <Skeleton className="h-8 w-full rounded-md" />
            <Skeleton className="h-8 w-full rounded-md" />
            <Skeleton className="h-8 w-full rounded-md" />
          </div>
          <div className="space-y-2 pt-2">
            <Skeleton className="h-4 w-20 rounded" />
            <Skeleton className="h-8 w-full rounded-md" />
            <Skeleton className="h-8 w-full rounded-md" />
            <Skeleton className="h-8 w-full rounded-md" />
          </div>
          <Skeleton className="h-9 w-full rounded-md" />
        </aside>

        {/* Cards skeleton */}
        <div className="flex-1 min-w-0">
          <div className="mb-6 flex justify-end">
            <Skeleton className="h-9 w-32 rounded-md" />
          </div>
          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: count }).map((_, i) => (
              <div
                key={i}
                className="flex min-h-[170px] flex-col rounded-2xl border border-overlay/[0.07] bg-overlay/[0.02] p-5"
              >
                <div className="mb-4 flex items-start justify-between gap-2">
                  <Skeleton className="h-5 w-14 rounded-full" />
                  <Skeleton className="h-4 w-10 rounded" />
                </div>
                <Skeleton className="mb-2 h-5 w-3/4 rounded" />
                <Skeleton className="mb-4 h-5 w-1/2 rounded" />
                <div className="mt-auto flex items-center justify-between border-t border-overlay/[0.06] pt-3">
                  <Skeleton className="h-8 w-16 rounded" />
                  <Skeleton className="h-4 w-24 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
