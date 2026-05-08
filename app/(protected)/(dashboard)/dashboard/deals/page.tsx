import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Handshake } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import Link from "next/link";
import { Suspense } from "react";
import { DealCard, type DealCardData, type DealListingRow } from "@/components/deals/DealCard";
import { Skeleton } from "@/components/ui/skeleton";
import { getCurrentUser } from "@/utils/query/auth";
import { getVerificationStatus, getProfilesByIds } from "@/utils/query/profiles";
import { getBuyerDeals, getSellerDeals } from "@/utils/query/deals";
import { getListingsByIds } from "@/utils/query/listings";
import { getRatedDealIds, getUserRatingsBatch } from "@/utils/query/ratings";

interface DealRow {
  id: string;
  status: string;
  created_at: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  proposed_days?: number | null;
  proposed_start_date?: string | null;
  rental_start_date?: string | null;
  rental_end_date?: string | null;
  return_confirmed_at?: string | null;
}

type DealWithRole = DealCardData;

function DealsSkeleton() {
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <Skeleton className="h-9 w-36 mb-2" />
        <Skeleton className="h-4 w-72" />
        <div className="flex gap-2 mt-4">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>
      </div>

      {/* Active section skeleton */}
      <div>
        <div className="flex items-center gap-3 mb-3">
          <Skeleton className="h-3 w-14" />
          <Skeleton className="h-px flex-1" />
        </div>
        <div className="space-y-3">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-overlay/[0.02] p-4">
              <div className="flex items-start gap-3">
                <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="flex gap-1.5">
                    <Skeleton className="h-4 w-14 rounded-full" />
                    <Skeleton className="h-4 w-16 rounded-full" />
                  </div>
                  <Skeleton className="h-4 w-56" />
                  <Skeleton className="h-3 w-40" />
                </div>
                <div className="text-right space-y-1.5">
                  <Skeleton className="h-5 w-14" />
                  <Skeleton className="h-3 w-12" />
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-border/50 flex justify-between">
                <Skeleton className="h-7 w-24" />
                <Skeleton className="h-7 w-20" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Past section skeleton */}
      <div>
        <div className="flex items-center gap-3 mb-3">
          <Skeleton className="h-3 w-10" />
          <Skeleton className="h-px flex-1" />
        </div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-overlay/[0.02] p-4">
              <div className="flex items-start gap-3">
                <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="flex gap-1.5">
                    <Skeleton className="h-4 w-14 rounded-full" />
                    <Skeleton className="h-4 w-20 rounded-full" />
                  </div>
                  <Skeleton className="h-4 w-52" />
                  <Skeleton className="h-3 w-36" />
                </div>
                <div className="text-right space-y-1.5">
                  <Skeleton className="h-5 w-14" />
                  <Skeleton className="h-3 w-12" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

async function DealsContent() {
  const supabase = await createClient();
  const { user, error: userError } = await getCurrentUser(supabase);

  if (userError || !user) redirect("/auth/login");

  const { data: profile } = await getVerificationStatus(supabase, user.id);
  if (profile?.verification_status !== "verified") redirect("/student-verification");

  // Step 1: Fetch deals (scalar columns only — no FK joins, all are blocked by RLS)
  const [{ data: buyingDeals }, { data: sellingDeals }] = await Promise.all([
    getBuyerDeals(supabase, user.id),
    getSellerDeals(supabase, user.id),
  ]);

  const typedBuying = (buyingDeals ?? []) as unknown as DealRow[];
  const typedSelling = (sellingDeals ?? []) as unknown as DealRow[];

  // Step 2: Batch fetch listings
  const listingIds = [
    ...new Set([
      ...typedBuying.map((d) => d.listing_id),
      ...typedSelling.map((d) => d.listing_id),
    ].filter(Boolean)),
  ];

  const listingMap: Record<string, DealListingRow> = {};
  if (listingIds.length > 0) {
    const { data: listingRows } = await getListingsByIds(supabase, listingIds);
    for (const l of listingRows ?? []) {
      listingMap[l.id] = l as DealListingRow;
    }
  }

  // Step 3: Batch fetch counterpart names
  const counterpartIds = [
    ...new Set([
      ...typedBuying.map((d) => d.seller_id),
      ...typedSelling.map((d) => d.buyer_id),
    ].filter(Boolean)),
  ];

  const nameMap: Record<string, string> = {};
  if (counterpartIds.length > 0) {
    const { data: profileRows } = await getProfilesByIds(supabase, counterpartIds);
    for (const p of profileRows ?? []) {
      if (p.full_name) nameMap[p.id] = p.full_name;
    }
  }

  // Step 4: Fetch deals the user has already rated
  const allDealIds = [
    ...typedBuying.map((d) => d.id),
    ...typedSelling.map((d) => d.id),
  ].filter(Boolean);

  const ratedDealIds = new Set<string>();
  if (allDealIds.length > 0) {
    const { data: ratingRows } = await getRatedDealIds(supabase, user.id, allDealIds);
    for (const r of ratingRows ?? []) {
      ratedDealIds.add(r.deal_id);
    }
  }

  // Step 5: Batch fetch counterpart ratings (so each card can show their reputation)
  const counterpartRatings: Record<string, { avg: number; count: number }> = {};
  if (counterpartIds.length > 0) {
    const { data: ratingScoreRows } = await getUserRatingsBatch(supabase, counterpartIds);
    const sums: Record<string, { sum: number; count: number }> = {};
    for (const row of ratingScoreRows ?? []) {
      const r = row as { rated_user_id: string; score: number };
      const acc = sums[r.rated_user_id] ?? { sum: 0, count: 0 };
      acc.sum += r.score;
      acc.count += 1;
      sums[r.rated_user_id] = acc;
    }
    for (const [id, { sum, count }] of Object.entries(sums)) {
      counterpartRatings[id] = { avg: sum / count, count };
    }
  }

  const allDeals: DealWithRole[] = [
    ...typedBuying.map((d) => ({
      ...d,
      listings: listingMap[d.listing_id] ?? null,
      role: "buyer" as const,
      counterpartName: nameMap[d.seller_id] ?? "Student",
      counterpartId: d.seller_id,
      counterpartAvgRating: counterpartRatings[d.seller_id]?.avg,
      counterpartRatingCount: counterpartRatings[d.seller_id]?.count ?? 0,
      hasRated: ratedDealIds.has(d.id),
    })),
    ...typedSelling.map((d) => ({
      ...d,
      listings: listingMap[d.listing_id] ?? null,
      role: "seller" as const,
      counterpartName: nameMap[d.buyer_id] ?? "Student",
      counterpartId: d.buyer_id,
      counterpartAvgRating: counterpartRatings[d.buyer_id]?.avg,
      counterpartRatingCount: counterpartRatings[d.buyer_id]?.count ?? 0,
      hasRated: ratedDealIds.has(d.id),
    })),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const activeDeals = allDeals.filter((d) => d.status === "pending" || d.status === "accepted");
  const pastDeals   = allDeals.filter((d) => d.status === "completed" || d.status === "cancelled");

  const pendingCount   = allDeals.filter((d) => d.status === "pending").length;
  const acceptedCount  = allDeals.filter((d) => d.status === "accepted").length;
  const completedCount = allDeals.filter((d) => d.status === "completed").length;

  return (
    <>
      {/* Page header */}
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-foreground mb-2">Your Deals</h1>
        <p className="text-muted-foreground text-sm">Manage all your buying and selling transactions</p>

        {/* Stat pills */}
        {allDeals.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {pendingCount > 0 && (
              <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full border border-amber-500/20 bg-amber-500/[0.07] text-amber-400">
                <span className="font-bold tabular-nums">{pendingCount}</span>
                Pending
              </span>
            )}
            {acceptedCount > 0 && (
              <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full border border-neon-green/20 bg-neon-green/[0.07] text-neon-green">
                <span className="font-bold tabular-nums">{acceptedCount}</span>
                Active
              </span>
            )}
            {completedCount > 0 && (
              <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full border border-sky-500/20 bg-sky-500/[0.07] text-sky-400">
                <span className="font-bold tabular-nums">{completedCount}</span>
                Completed
              </span>
            )}
          </div>
        )}
      </div>

      {allDeals.length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon"><Handshake /></EmptyMedia>
            <EmptyTitle>No deals yet</EmptyTitle>
            <EmptyDescription>Browse listings and request to buy to start a deal.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Link href="/dashboard/listings">
              <Button>Browse Listings</Button>
            </Link>
          </EmptyContent>
        </Empty>
      ) : (
        <div className="space-y-10">
          {/* Active section */}
          {activeDeals.length > 0 && (
            <section>
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground shrink-0">
                  Active
                </h2>
                <div className="flex-1 h-px bg-border/50" />
                <span className="text-xs text-muted-foreground tabular-nums">{activeDeals.length}</span>
              </div>
              <div className="space-y-3">
                {activeDeals.map((deal) => (
                  <DealCard key={deal.id} deal={deal} />
                ))}
              </div>
            </section>
          )}

          {/* Past section */}
          {pastDeals.length > 0 && (
            <section>
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground shrink-0">
                  Past
                </h2>
                <div className="flex-1 h-px bg-border/50" />
                <span className="text-xs text-muted-foreground tabular-nums">{pastDeals.length}</span>
              </div>
              <div className="space-y-3">
                {pastDeals.map((deal) => (
                  <DealCard key={deal.id} deal={deal} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </>
  );
}

export default function DealsPage() {
  return (
    <Suspense fallback={<DealsSkeleton />}>
      <DealsContent />
    </Suspense>
  );
}
