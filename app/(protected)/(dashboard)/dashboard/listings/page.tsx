import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { PackageSearch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { ListingsFilters } from "@/components/listing/ListingsFilters";
import { ListingsSearchBar } from "@/components/listing/ListingsSearchBar";
import { ListingsFilterSheet } from "@/components/listing/ListingsFilterSheet";
import { ListingCard, type ListingCardData } from "@/components/listing/ListingCard";
import { ListingsSkeleton } from "@/components/listing/ListingsSkeleton";
import { getCurrentUser } from "@/utils/query/auth";
import { getProfileById, getPeerIdsByCollege } from "@/utils/query/profiles";
import { getActiveListings } from "@/utils/query/listings";

interface ListingsPageProps {
  searchParams: Promise<{
    q?: string;
    type?: string;
    condition?: string;
    hostel?: string;
    department?: string;
    year?: string;
    minPrice?: string;
    maxPrice?: string;
    college?: string;
    transaction_type?: string;
    page?: string;
  }>;
}

async function ListingsContent({ searchParams }: ListingsPageProps) {
  const supabase = await createClient();
  const { user, error: userError } = await getCurrentUser(supabase);

  if (userError || !user) {
    redirect("/auth/login");
  }

  const { data: profile } = await getProfileById(supabase, user.id);

  if (profile?.verification_status !== "verified") {
    redirect("/student-verification");
  }

  const sp = await searchParams;

  const collegeName = profile?.college_name;

  const filters = {
    q: sp.q,
    type: sp.type,
    condition: sp.condition,
    hostel: sp.hostel,
    department: sp.department,
    year: sp.year ? parseInt(sp.year) : undefined,
    minPrice: sp.minPrice ? parseInt(sp.minPrice) : undefined,
    maxPrice: sp.maxPrice ? parseInt(sp.maxPrice) : undefined,
    college: sp.college ?? (collegeName ? "mine" : undefined),
    transaction_type: sp.transaction_type,
    page: parseInt(sp.page || "1"),
  };

  // Resolve college filter to peer ids
  let peerIds: string[] | undefined;
  if (filters.college === "mine" && collegeName) {
    const { data: peers } = await getPeerIdsByCollege(supabase, collegeName);
    peerIds = (peers ?? []).map((p) => p.id);
  }

  const { data: listingsData, count } = await getActiveListings(supabase, {
    ...filters,
    peerIds,
    pageSize: 12,
  });

  if (!listingsData) {
    return <div>Error loading listings</div>;
  }

  const listings: ListingCardData[] = listingsData as ListingCardData[];

  const pageSize = 12;
  const totalPages = Math.ceil((count || 0) / pageSize);

  function pageUrl(p: number) {
    const params = new URLSearchParams();
    if (filters.q) params.set("q", filters.q);
    if (filters.type) params.set("type", filters.type);
    if (filters.condition) params.set("condition", filters.condition);
    if (filters.hostel) params.set("hostel", filters.hostel);
    if (filters.department) params.set("department", filters.department);
    if (filters.year) params.set("year", filters.year.toString());
    if (filters.minPrice !== undefined) params.set("minPrice", filters.minPrice.toString());
    if (filters.maxPrice !== undefined) params.set("maxPrice", filters.maxPrice.toString());
    if (filters.college) params.set("college", filters.college);
    params.set("page", p.toString());
    return `/dashboard/listings?${params.toString()}`;
  }

  return (
    <>
      <ListingsSearchBar filters={filters} />
      <div className="flex gap-8">
      {/* Left sidebar — filters */}
      <aside className="hidden lg:block w-56 shrink-0">
        <div className="sticky top-6">
          <ListingsFilters filters={filters} myCollegeName={collegeName ?? undefined} />
        </div>
      </aside>

      {/* Right — listings */}
      <div className="flex-1 min-w-0">
        {/* Mobile: filter sheet + create button row */}
        <div className="flex items-center justify-between mb-6 gap-4 lg:hidden">
          <ListingsFilterSheet filters={filters} myCollegeName={collegeName ?? undefined} />
          <Link href="/dashboard/listings/create" className="ml-auto shrink-0">
            <Button>+ Create Listing</Button>
          </Link>
        </div>

        {/* Desktop: create button */}
        <div className="hidden lg:flex justify-end mb-6">
          <Link href="/dashboard/listings/create">
            <Button>+ Create Listing</Button>
          </Link>
        </div>

        {listings.length === 0 ? (
          <Empty className="border">
            <EmptyHeader>
              <EmptyMedia variant="icon"><PackageSearch /></EmptyMedia>
              <EmptyTitle>No listings found</EmptyTitle>
              <EmptyDescription>Try adjusting your filters or search term.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
              {listings.map((listing, index) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  href={`/dashboard/listings/${listing.id}`}
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

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <Link key={p} href={pageUrl(p)}>
                    <Button variant={p === filters.page ? "default" : "outline"}>
                      {p}
                    </Button>
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
      </div>
      </div>
    </>
  );
}

export default function ListingsFeedPage({ searchParams }: ListingsPageProps) {
  return (
    <>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-foreground mb-2">Marketplace</h1>
        <p className="text-muted-foreground">Browse books and study materials from your college</p>
      </div>

      <Suspense fallback={<ListingsSkeleton showTitle={false} />}>
        <ListingsContent searchParams={searchParams} />
      </Suspense>
    </>
  );
}
