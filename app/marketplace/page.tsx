import Link from "next/link";
import { Suspense } from "react";
import type { Metadata } from "next";
import { PackageSearch } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { PublicNav } from "@/components/nav/PublicNav";
import { ListingsSearchBar } from "@/components/listing/ListingsSearchBar";
import { ListingsFilters } from "@/components/listing/ListingsFilters";
import { ListingsFilterSheet } from "@/components/listing/ListingsFilterSheet";
import { ListingCard, type ListingCardData } from "@/components/listing/ListingCard";
import { ListingsSkeleton } from "@/components/listing/ListingsSkeleton";
import { getCurrentUser } from "@/utils/query/auth";
import { getProfileById, getPeerIdsByCollege } from "@/utils/query/profiles";
import { getActiveListings } from "@/utils/query/listings";

const BASE = "/marketplace";

export const metadata: Metadata = {
  title: "Marketplace | PeerHelp",
  description: "Browse and buy books and study materials from students at your college.",
};

interface SearchParamsRaw {
  q?: string;
  type?: string;
  condition?: string;
  year?: string;
  minPrice?: string;
  maxPrice?: string;
  college?: string;
  transaction_type?: string;
  page?: string;
}

interface MarketplacePageProps {
  searchParams: Promise<SearchParamsRaw>;
}

async function MarketplaceContent({ searchParams }: { searchParams: Promise<SearchParamsRaw> }) {
  const sp = await searchParams;

  const pageSize = 12;

  const supabase = await createClient();

  const { user } = await getCurrentUser(supabase);

  let myCollegeName: string | undefined;
  if (user) {
    const { data: myProfile } = await getProfileById(supabase, user.id);
    myCollegeName = myProfile?.college_name ?? undefined;
  }

  const filters = {
    q: sp.q,
    type: sp.type,
    condition: sp.condition,
    year: sp.year ? parseInt(sp.year) : undefined,
    minPrice: sp.minPrice ? parseInt(sp.minPrice) : undefined,
    maxPrice: sp.maxPrice ? parseInt(sp.maxPrice) : undefined,
    college: sp.college ?? (user && myCollegeName ? "mine" : undefined),
    transaction_type: sp.transaction_type,
    page: parseInt(sp.page || "1"),
  };

  let peerIds: string[] | undefined;
  if (filters.college === "mine" && myCollegeName) {
    const { data: peers } = await getPeerIdsByCollege(supabase, myCollegeName);
    peerIds = (peers ?? []).map((p) => p.id);
  }

  const { data: listingsData, count } = await getActiveListings(supabase, {
    ...filters,
    peerIds,
    pageSize: 12,
  });

  const listings = (listingsData ?? []) as ListingCardData[];
  const totalPages = Math.ceil((count || 0) / pageSize);

  function pageUrl(p: number) {
    const params = new URLSearchParams();
    if (filters.q) params.set("q", filters.q);
    if (filters.type) params.set("type", filters.type);
    if (filters.condition) params.set("condition", filters.condition);
    if (filters.year) params.set("year", filters.year!.toString());
    if (filters.minPrice !== undefined) params.set("minPrice", filters.minPrice.toString());
    if (filters.maxPrice !== undefined) params.set("maxPrice", filters.maxPrice.toString());
    if (filters.college) params.set("college", filters.college);
    if (filters.transaction_type) params.set("transaction_type", filters.transaction_type);
    params.set("page", p.toString());
    return `${BASE}?${params.toString()}`;
  }

  return (
    <>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-foreground mb-2">Marketplace</h1>
        <p className="text-muted-foreground">
          Books, notes, and study materials from verified students.
          {count !== null && count > 0 && (
            <span className="ml-2 text-neon-green/80 font-medium">
              ({count.toLocaleString()} listing{count !== 1 ? "s" : ""})
            </span>
          )}
        </p>
      </div>

      <ListingsSearchBar filters={filters} baseUrl={BASE} />

      <div className="flex gap-8">
        <aside className="hidden lg:block w-56 shrink-0">
          <div className="sticky top-6">
            <ListingsFilters filters={filters} baseUrl={BASE} myCollegeName={myCollegeName} />
          </div>
        </aside>

        <div className="flex-1 min-w-0">
          <div className="flex items-center mb-6 gap-4 lg:hidden">
            <ListingsFilterSheet filters={filters} baseUrl={BASE} myCollegeName={myCollegeName} />
          </div>

          {listings.length === 0 ? (
            <Empty className="border py-24">
              <EmptyHeader>
                <EmptyMedia variant="icon"><PackageSearch /></EmptyMedia>
                <EmptyTitle>No listings found</EmptyTitle>
                <EmptyDescription>Try adjusting your filters or search term.</EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Link href={BASE} className="text-sm text-neon-green hover:underline underline-offset-2">
                  Clear all filters
                </Link>
              </EmptyContent>
            </Empty>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
                {listings.map((listing, index) => (
                  <ListingCard
                    key={listing.id}
                    listing={listing}
                    href={`${BASE}/${listing.id}`}
                    priority={index < 4}
                  />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mb-8">
                  {filters.page > 1 && (
                    <Link href={pageUrl(filters.page - 1)}>
                      <Button variant="outline">Previous</Button>
                    </Link>
                  )}
                  {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map((p) => (
                    <Link key={p} href={pageUrl(p)}>
                      <Button variant={p === filters.page ? "default" : "outline"}>{p}</Button>
                    </Link>
                  ))}
                  {filters.page < totalPages && (
                    <Link href={pageUrl(filters.page + 1)}>
                      <Button variant="outline">Next</Button>
                    </Link>
                  )}
                </div>
              )}
            </>
          )}

          <div className="relative overflow-hidden rounded-[32px] border border-border bg-[linear-gradient(145deg,rgba(54,244,164,0.08),rgba(255,255,255,0.02))] px-8 py-12 text-center md:py-16 mt-4">
            <div className="pointer-events-none absolute -top-12 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-neon-green/10 blur-[80px]" />
            <p className="relative text-[11px] font-medium uppercase tracking-[0.22em] text-neon-green mb-4">For Students</p>
            <h2 className="relative font-display text-3xl font-[330] tracking-tight text-foreground mb-4 sm:text-4xl">Want to buy or sell?</h2>
            <p className="relative text-muted-foreground mb-6 max-w-md mx-auto text-sm leading-7">
              Sign up with your college email to make deals, message sellers, and list your own books and materials.
            </p>
            <div className="relative flex justify-center gap-3 flex-wrap">
              <Button asChild size="lg"><Link href="/auth/sign-up">Get started free</Link></Button>
              <Button asChild size="lg" variant="outline"><Link href="/auth/login">Login</Link></Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default function MarketplacePage({ searchParams }: MarketplacePageProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <PublicNav />
      <main className="relative mx-auto max-w-[1200px] px-6 py-10 md:px-10 lg:px-16">
        <Suspense fallback={<ListingsSkeleton />}>
          <MarketplaceContent searchParams={searchParams} />
        </Suspense>
      </main>
    </div>
  );
}
