import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  GraduationCap,
  Star,
  BookOpen,
  FileText,
  CalendarDays,
} from "lucide-react";
import { getCurrentUser } from "@/utils/query/auth";
import { getPublicProfile, getProfilesByIds } from "@/utils/query/profiles";
import { getSellerRatingsWithComments } from "@/utils/query/ratings";
import { getSellerActiveListings } from "@/utils/query/listings";

type RatingRow = {
  id: string;
  score: number;
  comment: string | null;
  created_at: string;
  rater_id: string;
};

type ListingRow = {
  id: string;
  title: string;
  condition: string;
  price: number;
  image_url: string | null;
  listing_type: string;
  department: string | null;
};

function cleanCollegeName(name: string) {
  return name.replace(/\s*\(Id:[^)]*\)/gi, "").trim();
}

function StarRow({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          size={12}
          className={
            i < score
              ? "fill-neon-green text-neon-green"
              : "fill-none text-muted-foreground/30"
          }
        />
      ))}
    </div>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await getPublicProfile(supabase, id);
  if (!data) return { title: "Seller Profile | PeerHelp" };
  return {
    title: `${data.full_name ?? "Seller"} — Profile | PeerHelp`,
  };
}

export default async function SellerProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { user } = await getCurrentUser(supabase);
  if (!user) redirect("/auth/login");

  // Redirect to own profile page if viewing yourself
  if (user.id === id) redirect("/dashboard/profile");

  const { data: profile } = await getPublicProfile(supabase, id);
  if (!profile) notFound();

  const [{ data: ratingsData }, { data: listingsData }] = await Promise.all([
    getSellerRatingsWithComments(supabase, id),
    getSellerActiveListings(supabase, id),
  ]);

  const ratings = (ratingsData ?? []) as RatingRow[];
  const listings = (listingsData ?? []) as ListingRow[];

  // Batch fetch rater names
  const raterIds = [...new Set(ratings.map((r) => r.rater_id))];
  const nameMap: Record<string, string> = {};
  if (raterIds.length > 0) {
    const { data: raterProfiles } = await getProfilesByIds(supabase, raterIds);
    for (const p of raterProfiles ?? []) {
      if (p.full_name) nameMap[p.id] = p.full_name;
    }
  }

  const ratingCount = ratings.length;
  const avgRating =
    ratingCount > 0
      ? ratings.reduce((sum, r) => sum + r.score, 0) / ratingCount
      : undefined;

  const joinedYear = profile.created_at
    ? new Date(profile.created_at).getFullYear()
    : null;

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Back */}
      <Link
        href="/dashboard/listings"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft size={15} />
        Back to Listings
      </Link>

      {/* Profile header */}
      <div className="rounded-2xl border border-overlay/[0.07] bg-forest px-6 py-6 flex items-start gap-5">
        <div className="h-16 w-16 rounded-full bg-overlay/[0.08] border border-overlay/[0.12] flex items-center justify-center shrink-0 text-2xl font-bold text-muted-foreground select-none">
          {(profile.full_name ?? "?")[0].toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="font-display text-2xl font-bold text-foreground truncate">
            {profile.full_name ?? "Student"}
          </h1>
          {profile.college_name && (
            <div className="flex items-center gap-1.5 mt-1">
              <GraduationCap size={13} className="text-muted-foreground shrink-0" />
              <span className="text-sm text-muted-foreground">
                {cleanCollegeName(profile.college_name)}
              </span>
            </div>
          )}
          {joinedYear && (
            <div className="flex items-center gap-1.5 mt-1">
              <CalendarDays size={12} className="text-muted-foreground shrink-0" />
              <span className="text-xs text-muted-foreground">Member since {joinedYear}</span>
            </div>
          )}
          {ratingCount > 0 && avgRating !== undefined && (
            <div className="flex items-center gap-2 mt-2.5">
              <StarRow score={Math.round(avgRating)} />
              <span className="text-sm font-semibold text-foreground">
                {avgRating.toFixed(1)}
              </span>
              <span className="text-xs text-muted-foreground">({ratingCount} rating{ratingCount !== 1 ? "s" : ""})</span>
            </div>
          )}
          {ratingCount === 0 && (
            <p className="mt-2 text-xs text-muted-foreground">No ratings yet</p>
          )}
        </div>
      </div>

      {/* Active listings */}
      {listings.length > 0 && (
        <section>
          <h2 className="text-xs font-medium text-shade-50 uppercase tracking-widest mb-3 px-1">
            Active Listings ({listings.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {listings.map((listing) => (
              <Link
                key={listing.id}
                href={`/dashboard/listings/${listing.id}`}
                className="group flex items-center gap-3 rounded-xl border border-overlay/[0.07] bg-forest px-4 py-3 hover:border-neon-green/20 hover:bg-overlay/[0.04] transition-colors"
              >
                <div className="relative h-10 w-10 shrink-0 rounded-lg overflow-hidden border border-overlay/[0.07] bg-overlay/[0.05] flex items-center justify-center">
                  {listing.image_url ? (
                    <Image
                      src={listing.image_url}
                      alt={listing.title}
                      fill
                      className="object-cover"
                      sizes="40px"
                    />
                  ) : listing.listing_type === "material" ? (
                    <FileText size={14} className="text-muted-foreground/60" />
                  ) : (
                    <BookOpen size={14} className="text-muted-foreground/60" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate group-hover:text-neon-green transition-colors">
                    {listing.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    ₹{listing.price.toLocaleString("en-IN")}
                    {listing.condition ? ` · ${listing.condition}` : ""}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Ratings */}
      <section>
        <h2 className="text-xs font-medium text-shade-50 uppercase tracking-widest mb-3 px-1">
          Ratings {ratingCount > 0 ? `(${ratingCount})` : ""}
        </h2>
        {ratings.length === 0 ? (
          <div className="rounded-2xl border border-overlay/[0.07] bg-forest px-5 py-8 text-center">
            <p className="text-sm text-muted-foreground">No ratings yet.</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-overlay/[0.07] bg-forest overflow-hidden divide-y divide-overlay/[0.05]">
            {ratings.map((r) => (
              <div key={r.id} className="px-5 py-4 flex items-start gap-3">
                <div className="h-8 w-8 shrink-0 rounded-full bg-overlay/[0.06] border border-overlay/[0.1] flex items-center justify-center text-xs font-semibold text-muted-foreground">
                  {(nameMap[r.rater_id] ?? "S")[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-foreground">
                      {nameMap[r.rater_id] ?? "Student"}
                    </span>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {new Date(r.created_at).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <StarRow score={r.score} />
                  {r.comment && (
                    <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
                      {r.comment}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
