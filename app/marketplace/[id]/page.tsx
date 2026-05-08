import Image from "next/image";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PublicNav } from "@/components/nav/PublicNav";
import {
  ArrowLeft, BookOpen, GraduationCap,
  Hash, MapPin, ShieldCheck, Star, User, CalendarDays,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getCurrentUser } from "@/utils/query/auth";
import { getListingById } from "@/utils/query/listings";
import { getSellerProfile } from "@/utils/query/profiles";
import { getUserRatings } from "@/utils/query/ratings";

interface ListingRow {
  id: string;
  user_id: string;
  title: string;
  isbn: string | null;
  condition: string;
  price: number;
  hostel: string;
  department: string;
  year_of_study: number;
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

interface SellerProfile {
  full_name: string | null;
  college_name: string | null;
}

const CONDITION_COLORS: Record<string, string> = {
  new: "bg-neon-green/10 text-neon-green border-neon-green/20",
  good: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  used: "bg-orange-500/10 text-orange-500 border-orange-500/20",
};

export default async function PublicListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top,_rgba(54,244,164,0.07),_transparent_40%)]" />

      <PublicNav />

      <Suspense fallback={<ListingPageSkeleton />}>
        <ListingContent params={params} />
      </Suspense>
    </div>
  );
}

async function ListingContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { user } = await getCurrentUser(supabase);
  const isLoggedIn = !!user;

  const { data: listingData } = await getListingById(supabase, id);

  // Public marketplace: only show active listings
  if (!listingData || (listingData as { status: string }).status !== "active") notFound();

  const listing = listingData as ListingRow;

  const [{ data: sellerData }, { data: ratingAgg }] = await Promise.all([
    getSellerProfile(supabase, listing.user_id),
    getUserRatings(supabase, listing.user_id),
  ]);

  const seller = sellerData as SellerProfile | null;

  const ratingCount = ratingAgg?.length ?? 0;
  const avgRating = ratingCount > 0
    ? (ratingAgg!.reduce((sum, r) => sum + (r as { score: number }).score, 0) / ratingCount)
    : null;

  const postedAt = new Date(listing.created_at).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (

    <main className="relative mx-auto max-w-[1280px] px-6 py-10 md:px-10 lg:px-16">
      {/* Back */}
      <Link
        href="/marketplace"
        className="inline-flex items-center gap-1.5 text-sm text-shade-50 hover:text-foreground transition-colors mb-8"
      >
        <ArrowLeft size={14} />
        Back to marketplace
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Main details */}
        <div className="lg:col-span-2 space-y-5">
          {/* Image hero */}
          {listing.image_url && (
            <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl border border-overlay/[0.07]">
              <Image
                src={listing.image_url}
                alt={listing.title}
                fill
                sizes="(max-width: 1024px) 100vw, 66vw"
                priority
                className="object-cover"
              />
            </div>
          )}

          {/* Title card */}
          <div className="rounded-2xl border border-overlay/[0.07] bg-forest p-6">
            <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center text-[10px] font-medium uppercase tracking-widest px-2.5 py-1 rounded-full border ${
                    CONDITION_COLORS[listing.condition] ?? "bg-overlay/5 text-shade-50 border-overlay/10"
                  }`}
                >
                  {listing.condition}
                </span>
                {listing.listing_type === "other" && listing.material_type && (
                  <span className="inline-flex items-center text-[10px] font-medium uppercase tracking-widest px-2.5 py-1 rounded-full border bg-purple-500/10 text-purple-500 border-purple-500/20">
                    {({ notes: "Notes", handouts: "Handouts", pyq: "Past Papers", other: "Material" } as Record<string, string>)[listing.material_type] ?? listing.material_type}
                  </span>
                )}
                {listing.transaction_type === "rental" && (
                  <span className="inline-flex items-center text-[10px] font-medium uppercase tracking-widest px-2.5 py-1 rounded-full border bg-indigo-500/10 text-indigo-400 border-indigo-500/20">
                    Rental
                  </span>
                )}
              </div>
              <div className="text-right">
                <span className="font-display text-3xl font-bold text-neon-green">
                  ₹{listing.price}
                </span>
                {listing.transaction_type === "rental" && (
                  <p className="text-xs text-shade-50 mt-0.5">
                    {listing.rental_price_type === "per_day" ? "per day" : "flat"}
                  </p>
                )}
              </div>
            </div>

            <h1 className="font-display text-2xl font-[330] leading-snug text-foreground mb-2">
              {listing.title}
            </h1>

            {listing.isbn && (
              <p className="flex items-center gap-1.5 text-sm text-shade-50 mt-1">
                <Hash size={12} />
                ISBN {listing.isbn}
              </p>
            )}
          </div>

          {/* Meta grid */}
          <div className="rounded-2xl border border-overlay/[0.07] bg-forest overflow-hidden">
            <div className="px-6 pt-5 pb-2">
              <h2 className="text-xs font-medium text-shade-50 uppercase tracking-widest">Details</h2>
            </div>
            <div className="divide-y divide-border">
              {[  
                { icon: MapPin, label: "Hostel", value: listing.hostel },
                { icon: GraduationCap, label: "Department", value: listing.department },
                { icon: BookOpen, label: "Year of study", value: `Year ${listing.year_of_study}` },
                { icon: CalendarDays, label: "Listed on", value: postedAt },
                ...(listing.transaction_type === "rental" ? [
                  { icon: CalendarDays, label: "Pricing type", value: listing.rental_price_type === "per_day" ? "Per day" : "Flat rate" },
                  { icon: CalendarDays, label: "Security deposit", value: `₹${listing.security_deposit} (refundable)` },
                ] : []),
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center gap-4 px-6 py-4">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-overlay/5">
                    <Icon size={14} className="text-shade-50" />
                  </div>
                  <div>
                    <p className="text-[11px] text-shade-50 mb-0.5">{label}</p>
                    <p className="text-sm text-foreground">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Description */}
          {listing.description && (
            <div className="rounded-2xl border border-overlay/[0.07] bg-forest p-6">
              <h2 className="text-xs font-medium text-shade-50 uppercase tracking-widest mb-3">Description</h2>
              <p className="text-sm text-shade-50 leading-7 whitespace-pre-line">{listing.description}</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Seller */}
          <div className="rounded-2xl border border-overlay/[0.07] bg-forest p-5">
            <h2 className="text-xs font-medium text-shade-50 uppercase tracking-widest mb-4">Seller</h2>
            <div className="flex items-start gap-3 mb-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neon-green/10 border border-neon-green/20 mt-0.5">
                <User size={16} className="text-neon-green" />
              </div>
              <div className="space-y-1 min-w-0">
                <p className="text-sm font-medium text-foreground leading-tight">{seller?.full_name ?? "Student"}</p>
                <div className="flex items-center gap-1 text-[11px] text-neon-green">
                  <Badge className="gap-1 border-neon-green/30 bg-neon-green/10 text-neon-green text-[10px] font-medium px-2 py-0.5 rounded-full" variant="outline">
                    <ShieldCheck size={10} className="shrink-0" />
                    Verified student
                  </Badge>
                </div>
                {seller?.college_name && (
                  <p className="text-[11px] text-muted-foreground leading-tight">
                    {seller.college_name.replace(/\s*\(Id:[^)]*\)/gi, "").trim()}
                  </p>
                )}
                {ratingCount > 0 && avgRating !== null && (
                  <div className="flex items-center gap-0.5 pt-0.5">
                    {Array.from({ length: 5 }, (_, i) => {
                      const filled = i < Math.round(avgRating!);
                      return (
                        <Star
                          key={i}
                          size={11}
                          className={filled ? "fill-neon-green text-neon-green" : "fill-none text-muted-foreground/40"}
                        />
                      );
                    })}
                    <span className="ml-1 text-xs text-muted-foreground">
                      {avgRating!.toFixed(1)} ({ratingCount})
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="relative overflow-hidden rounded-2xl border border-border bg-overlay/[0.02] p-5 text-center">
            <div className="pointer-events-none absolute -top-8 left-1/2 h-32 w-32 -translate-x-1/2 rounded-full bg-neon-green/10 blur-2xl" />
            {isLoggedIn ? (
              <>
                <p className="relative text-sm text-foreground font-medium mb-1">
                  {listing.transaction_type === "rental" ? "Ready to rent?" : "Ready to make a deal?"}
                </p>
                <p className="relative text-xs text-shade-50 mb-4">
                  {listing.transaction_type === "rental"
                    ? "Sign in to request a rental and arrange a campus handover."
                    : "Contact the seller and arrange a campus handover."}
                </p>
                <div className="relative">
                  <Button asChild className="w-full" size="lg">
                    <Link href={`/dashboard/listings/${listing.id}`}>
                      {listing.transaction_type === "rental" ? "Rent Now" : "Buy Now"}
                    </Link>
                  </Button>
                </div>
              </>
            ) : (
              <>
                <p className="relative text-sm text-foreground font-medium mb-1">Interested in this listing?</p>
                <p className="relative text-xs text-shade-50 mb-4">
                  Sign in to contact the seller and make a deal.
                </p>
                <div className="relative flex flex-col gap-2">
                  <Button asChild className="w-full">
                    <Link href={`/auth/sign-up?redirect=/dashboard/listings/${listing.id}`}>
                      Get started free
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full">
                    <Link href={`/auth/login?redirect=/dashboard/listings/${listing.id}`}>
                      Login
                    </Link>
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

function ListingPageSkeleton() {
  return (
    <main className="relative mx-auto max-w-[1280px] px-6 py-10 md:px-10 lg:px-16">
      <Skeleton className="mb-8 h-5 w-32 rounded-lg" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          <Skeleton className="h-48 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-40 rounded-2xl" />
        </div>
      </div>
    </main>
  );
}
