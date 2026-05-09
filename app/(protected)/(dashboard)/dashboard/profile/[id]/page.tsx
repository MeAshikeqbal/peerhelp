import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import {
  ArrowLeft,
  GraduationCap,
  Star,
  BookOpen,
  FileText,
  CalendarDays,
  LayoutList,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { UserAvatar } from "@/components/ui/user-avatar";
import { getCurrentUser } from "@/utils/query/auth";
import { getPublicProfile, getProfilesByIds } from "@/utils/query/profiles";
import { getUserRatingsWithComments } from "@/utils/query/ratings";
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

function ProfileSkeleton() {
  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Back link */}
      <Skeleton className="h-5 w-32" />

      {/* Hero card */}
      <div className="rounded-2xl border border-overlay/[0.07] bg-forest overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 px-5 py-6 sm:px-7 sm:py-8">
          <Skeleton className="h-16 w-16 sm:h-20 sm:w-20 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
            <Skeleton className="h-4 w-36" />
          </div>
        </div>
        <div className="border-t border-overlay/[0.07] grid grid-cols-2 divide-x divide-overlay/[0.07]">
          <div className="px-6 py-4 space-y-2">
            <Skeleton className="h-3 w-14" />
            <Skeleton className="h-4 w-28" />
          </div>
          <div className="px-6 py-4 space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-4 w-8" />
          </div>
        </div>
      </div>

      {/* Listings card */}
      <div className="rounded-2xl border border-overlay/[0.07] bg-forest overflow-hidden">
        <div className="flex items-center gap-2 px-6 pt-5 pb-3">
          <Skeleton className="h-7 w-7 rounded-lg" />
          <Skeleton className="h-3 w-28" />
        </div>
        <div className="divide-y divide-white/[0.05] border-t border-overlay/[0.05]">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-6 py-3.5">
              <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Ratings card */}
      <div className="rounded-2xl border border-overlay/[0.07] bg-forest overflow-hidden">
        <div className="flex items-center gap-2 px-6 pt-5 pb-3">
          <Skeleton className="h-7 w-7 rounded-lg" />
          <Skeleton className="h-3 w-20" />
        </div>
        <div className="divide-y divide-white/[0.05] border-t border-overlay/[0.05]">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-start gap-4 px-6 py-4">
              <Skeleton className="h-8 w-8 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-5/6" />
              </div>
            </div>
          ))}
        </div>
      </div>
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
  if (!data) return { title: "Profile | PeerHelp" };
  return {
    title: `${data.full_name ?? "Student"} — Profile | PeerHelp`,
  };
}

async function ProfileContent({ id }: { id: string }) {
  const supabase = await createClient();

  const { data: profile } = await getPublicProfile(supabase, id);
  if (!profile) notFound();

  const [{ data: ratingsData }, { data: listingsData }] = await Promise.all([
    getUserRatingsWithComments(supabase, id),
    getSellerActiveListings(supabase, id),
  ]);

  const ratings = (ratingsData ?? []) as RatingRow[];
  const listings = (listingsData ?? []) as ListingRow[];

  const raterIds = [...new Set(ratings.map((r) => r.rater_id))];
  const nameMap: Record<string, string> = {};
  const avatarMap: Record<string, string | null> = {};
  if (raterIds.length > 0) {
    const { data: raterProfiles } = await getProfilesByIds(supabase, raterIds);
    for (const p of raterProfiles ?? []) {
      if (p.full_name) nameMap[p.id] = p.full_name;
      avatarMap[p.id] = p.avatar_url ?? null;
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
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back */}
      <Link
        href="/dashboard/listings"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft size={15} />
        Back to Listings
      </Link>

      {/* Hero card */}
      <div className="relative overflow-hidden rounded-2xl border border-overlay/[0.07] bg-forest">
        <div className="pointer-events-none absolute -top-16 -left-16 h-64 w-64 rounded-full bg-neon-green/8 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-10 right-10 h-48 w-48 rounded-full bg-neon-green/5 blur-2xl" />

        <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-5 px-5 py-6 sm:px-7 sm:py-8">
          {/* Avatar */}
          <UserAvatar
            size="xl"
            src={profile.avatar_url}
            name={profile.full_name}
            className="shrink-0 ring-2 ring-neon-green/20 border-2 border-neon-green/20"
          />

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground truncate mb-1">
              {profile.full_name ?? "Student"}
            </h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              {profile.college_name && (
                <span className="inline-flex items-center gap-1.5">
                  <GraduationCap size={13} className="shrink-0" />
                  {cleanCollegeName(profile.college_name)}
                </span>
              )}
              {joinedYear && (
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays size={13} className="shrink-0" />
                  Member since {joinedYear}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Stats strip */}
        <div className="relative border-t border-overlay/[0.07] grid grid-cols-2 divide-x divide-overlay/[0.07]">
          <div className="px-6 py-4">
            <p className="text-[11px] font-medium text-shade-50 uppercase tracking-widest mb-1">Rating</p>
            {avgRating !== undefined ? (
              <div className="flex items-center gap-2">
                <StarRow score={Math.round(avgRating)} />
                <span className="text-sm font-semibold text-foreground">{avgRating.toFixed(1)}</span>
                <span className="text-xs text-muted-foreground">({ratingCount})</span>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No ratings yet</p>
            )}
          </div>
          <div className="px-6 py-4">
            <p className="text-[11px] font-medium text-shade-50 uppercase tracking-widest mb-1">Active Listings</p>
            <p className="text-sm font-semibold text-foreground">{listings.length}</p>
          </div>
        </div>
      </div>

      {/* Active listings */}
      {listings.length > 0 && (
        <section className="rounded-2xl border border-overlay/[0.07] bg-forest overflow-hidden">
          <div className="flex items-center gap-2 px-6 pt-5 pb-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-neon-green/10">
              <LayoutList size={13} className="text-neon-green" />
            </div>
            <h2 className="text-xs font-medium text-shade-50 uppercase tracking-widest">
              Active Listings
            </h2>
          </div>
          <div className="divide-y divide-white/[0.05]">
            {listings.map((listing) => (
              <Link
                key={listing.id}
                href={`/dashboard/listings/${listing.id}`}
                className="group flex items-center gap-4 px-6 py-3.5 hover:bg-overlay/[0.03] transition-colors"
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
                    {listing.department ? ` · ${listing.department}` : ""}
                  </p>
                </div>
                <ArrowLeft size={14} className="text-muted-foreground rotate-180 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Ratings */}
      <section className="rounded-2xl border border-overlay/[0.07] bg-forest overflow-hidden">
        <div className="flex items-center gap-2 px-6 pt-5 pb-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-neon-green/10">
            <Star size={13} className="text-neon-green" />
          </div>
          <h2 className="text-xs font-medium text-shade-50 uppercase tracking-widest">
            Ratings {ratingCount > 0 ? `(${ratingCount})` : ""}
          </h2>
        </div>
        {ratings.length === 0 ? (
          <div className="px-6 pb-8 pt-4 text-center border-t border-overlay/[0.05]">
            <p className="text-sm text-muted-foreground">No ratings yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.05] border-t border-overlay/[0.05]">
            {ratings.map((r) => (
              <div key={r.id} className="flex items-start gap-4 px-6 py-4">
                <UserAvatar size="sm" name={nameMap[r.rater_id] ?? "Student"} src={avatarMap[r.rater_id] ?? undefined} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
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

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const { user } = await getCurrentUser(supabase);
  if (!user) redirect("/auth/login");
  if (user.id === id) redirect("/dashboard/profile");

  return (
    <Suspense fallback={<ProfileSkeleton />}>
      <ProfileContent id={id} />
    </Suspense>
  );
}
