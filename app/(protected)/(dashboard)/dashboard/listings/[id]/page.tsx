import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Pencil, LockKeyhole } from "lucide-react";
import { ListingImagePanel } from "@/components/listing/ListingImagePanel";
import { ListingBadges } from "@/components/listing/ListingBadges";
import { ListingDetailsGrid } from "@/components/listing/ListingDetailsGrid";
import { SellerCard } from "@/components/listing/SellerCard";
import { BuyerDealCard } from "@/components/listing/BuyerDealCard";
import { SellerDealRequests } from "@/components/listing/SellerDealRequests";
import { ListingStatusActions } from "@/components/listing/ListingStatusActions";
import { getCurrentUser } from "@/utils/query/auth";
import { getListingById } from "@/utils/query/listings";
import { getSellerProfile, getProfilesByIds } from "@/utils/query/profiles";
import { getUserRatings } from "@/utils/query/ratings";
import { getBuyerDealForListing, getDealsByListing, hasBlockingDeal } from "@/utils/query/deals";

interface ListingRow {
  id: string;
  user_id: string;
  title: string;
  isbn: string | null;
  condition: string;
  price: number;
  hostel: string | null;
  department: string | null;
  year_of_study: number | null;
  description: string | null;
  status: string;
  created_at: string;
  image_url: string | null;
  listing_type: string;
  material_type: string | null;
  transaction_type: string;
  rental_price_type: string | null;
  security_deposit: number | null;
}

interface DealRow {
  id: string;
  status: string;
  buyer_id: string;
  created_at: string;
  proposed_days?: number | null;
  proposed_start_date?: string | null;
  rental_start_date?: string | null;
  rental_end_date?: string | null;
  return_confirmed_at?: string | null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await getListingById(supabase, id);
  if (!data) return { title: "Listing" };
  const listing = data as { title: string; price: number };
  return {
    title: `${listing.title} — ₹${listing.price} | PeerHelp`,
    description: `Buy "${listing.title}" from a fellow student on PeerHelp.`,
  };
}

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { user } = await getCurrentUser(supabase);
  if (!user) redirect("/auth/login");

  const { data: listingData } = await getListingById(supabase, id);

  if (!listingData) notFound();

  const listing = listingData as ListingRow;
  const isSeller = user.id === listing.user_id;

  const [{ data: sellerData }, { data: ratingAgg }] = await Promise.all([
    getSellerProfile(supabase, listing.user_id),
    getUserRatings(supabase, listing.user_id),
  ]);
  const ratingCount = ratingAgg?.length ?? 0;
  const avgRating = ratingCount > 0
    ? (ratingAgg!.reduce((sum, r) => sum + (r as { score: number }).score, 0) / ratingCount)
    : undefined;

  // Buyer: check if they already have a deal for this listing
  let existingDeal: DealRow | null = null;
  if (!isSeller) {
    const { data } = await getBuyerDealForListing(supabase, id, user.id);
    existingDeal = data as DealRow | null;
  }

  // Seller: fetch all deal requests for this listing
  let sellerDeals: (DealRow & { buyerName: string })[] = [];
  let isLocked = false;
  if (isSeller) {
    const statusLocked = listing.status === "sold" || listing.status === "reserved";
    const dealLocked = await hasBlockingDeal(supabase, id);
    isLocked = statusLocked || dealLocked;

    const { data: dealRows } = await getDealsByListing(supabase, id);

    if (dealRows && dealRows.length > 0) {
      const buyerIds = [...new Set(dealRows.map((d) => d.buyer_id))];
      const { data: buyerProfiles } = await getProfilesByIds(supabase, buyerIds);
      const nameMap: Record<string, string> = {};
      for (const p of buyerProfiles ?? []) {
        if (p.full_name) nameMap[p.id] = p.full_name;
      }
      sellerDeals = (dealRows as DealRow[]).map((d) => ({
        ...d,
        buyerName: nameMap[d.buyer_id] ?? "Student",
      }));
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Back nav */}
      <Link
        href="/dashboard/listings"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft size={15} />
        Back to Listings
      </Link>

      {/* Reserved banner — shown to buyers only */}
      {!isSeller && listing.status === "reserved" && (
        <div className="flex items-center gap-3 rounded-xl border border-yellow-400/20 bg-yellow-400/5 px-4 py-3">
          <LockKeyhole size={15} className="shrink-0 text-yellow-400" />
          <p className="text-sm text-yellow-300">
            This listing has been reserved for another buyer. It may become available again if the deal falls through.
          </p>
        </div>
      )}

      {/* ── Product hero ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        <ListingImagePanel
          imageUrl={listing.image_url}
          title={listing.title}
          listingType={listing.listing_type}
          priority
        />

        <div className="flex flex-col gap-5">
          <ListingBadges
            condition={listing.condition}
            status={listing.status}
            listingType={listing.listing_type}
            materialType={listing.material_type}
            transactionType={listing.transaction_type}
          />

          <div>
            <h1 className="font-display text-2xl md:text-3xl text-foreground leading-snug">
              {listing.title}
            </h1>
            {listing.isbn && (
              <p className="mt-1 text-sm text-muted-foreground">ISBN: {listing.isbn}</p>
            )}
          </div>

          <div className="flex items-baseline gap-1">
            <span className="font-display text-4xl font-bold text-accent">₹{listing.price}</span>
            <span className="text-sm text-muted-foreground ml-1">
              {listing.transaction_type === "rental"
                ? (listing.rental_price_type === "per_day" ? "per day" : "flat rental")
                : "fixed price"}
            </span>
          </div>

          <div className="border-t border-border" />

          <ListingDetailsGrid
            department={listing.department}
            yearOfStudy={listing.year_of_study}
            hostel={listing.hostel}
            createdAt={listing.created_at}
            transactionType={listing.transaction_type}
            rentalPriceType={listing.rental_price_type}
            securityDeposit={listing.security_deposit}
          />

          <div className="border-t border-border" />

          <SellerCard
            sellerId={listing.user_id}
            sellerName={sellerData?.full_name ?? "Student"}
            isSeller={isSeller}
            avgRating={avgRating}
            ratingCount={ratingCount}
            collegeName={sellerData?.college_name ?? undefined}
          />

          {!isSeller && (
            <BuyerDealCard
              existingDeal={existingDeal}
              listingId={listing.id}
              listingStatus={listing.status}
              transactionType={listing.transaction_type}
              rentalPriceType={listing.rental_price_type}
              price={listing.price}
              securityDeposit={listing.security_deposit}
            />
          )}

          {isSeller && (
            <div className="space-y-2">
              <Link href={`/dashboard/listings/${listing.id}/edit`}>
                <Button variant="outline" className="w-full gap-2">
                  {isLocked ? <LockKeyhole size={14} /> : <Pencil size={14} />}
                  {isLocked ? "Edit pickup info" : "Edit listing"}
                </Button>
              </Link>
              <ListingStatusActions listingId={listing.id} currentStatus={listing.status} />
            </div>
          )}
        </div>
      </div>

      {/* ── Description ──────────────────────────────────────── */}
      {listing.description && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">About this listing</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm leading-relaxed">{listing.description}</p>
          </CardContent>
        </Card>
      )}

      {/* ── Seller: deal requests ─────────────────────────────── */}
      {isSeller && <SellerDealRequests sellerDeals={sellerDeals} />}
    </div>
  );
}

