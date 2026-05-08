import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { GraduationCap, LayoutList, Handshake, PlusCircle, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getCurrentUser } from "@/utils/query/auth";
import { getProfileById } from "@/utils/query/profiles";
import { countUserListings } from "@/utils/query/listings";
import { countUserDeals } from "@/utils/query/deals";
import { getOwnTutorProfile } from "@/utils/query/tutors";
import { Skeleton } from "@/components/ui/skeleton";
import { Suspense } from "react";

function DashboardSkeleton() {
  return (
    <div className="animate-in fade-in duration-300">
      {/* Header */}
      <div className="mb-8">
        <Skeleton className="mb-2 h-10 w-72" />
        <Skeleton className="h-5 w-56" />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-overlay/[0.02] p-6">
            <Skeleton className="mb-2 h-6 w-32" />
            <Skeleton className="mb-6 h-4 w-44" />
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-overlay/[0.02] p-6">
            <Skeleton className="mb-4 h-6 w-32" />
            <Skeleton className="mb-2 h-10 w-16" />
            <Skeleton className="mb-4 h-4 w-48" />
            <Skeleton className="h-10 w-44 rounded-md" />
          </div>
        ))}
      </div>

      {/* Help Section */}
      <div className="rounded-xl border border-border bg-overlay/[0.02] p-6">
        <Skeleton className="mb-4 h-6 w-28" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/6" />
          <Skeleton className="h-4 w-3/6" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      </div>
    </div>
  );
}

async function DashboardContent() {
  const supabase = await createClient();
  const { user, error: userError } = await getCurrentUser(supabase);

  if (userError || !user) {
    redirect("/auth/login");
  }

  const { data: profile, error: profileError } = await getProfileById(supabase, user.id);

  if (profileError) {
    console.error("[DashboardContent]", profileError);
    throw new Error("Failed to fetch profile");
  }

  if (profile?.verification_status !== "verified") {
    redirect("/student-verification");
  }

  const [{ count: listingsCount }, { count: dealsCount }, { data: tutor }] = await Promise.all([
    countUserListings(supabase, user.id),
    countUserDeals(supabase, user.id),
    getOwnTutorProfile(supabase, user.id),
  ]);

  const hasActiveTutorProfile = tutor?.status === "active";

  return (
    <>
      {/* Header */}
      <div className="mb-8 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-2">
            Welcome back, {profile?.full_name || "Student"}!
          </h1>
          {profile?.college_name && (
            <p className="text-muted-foreground inline-flex items-center gap-1.5">
              <GraduationCap size={14} className="shrink-0" />
              {profile.college_name.replace(/\s*\(Id:[^)]*\)/gi, "").trim()}
            </p>
          )}
        </div>
        <Badge
          variant="outline"
          className="mt-1 shrink-0 gap-1.5 border-neon-green/30 bg-neon-green/10 text-neon-green px-3 py-1.5 text-xs"
        >
          <ShieldCheck size={12} />
          Verified student
        </Badge>
      </div>

      {/* Action + Stat Cards — merged to avoid redundancy */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {/* My Listings */}
        <div className="flex flex-col rounded-xl border border-border bg-overlay/[0.02] p-6 transition-colors hover:border-neon-green/30 hover:bg-neon-green/[0.03]">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-neon-green/10 mb-4">
            <PlusCircle size={18} className="text-neon-green" />
          </div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">My Listings</p>
          <div className="font-display text-3xl font-bold text-neon-green mb-1">{listingsCount ?? 0}</div>
          <p className="text-sm text-muted-foreground mb-5 flex-1">Books and materials you&apos;ve listed for sale</p>
          <Link href="/dashboard/listings/create">
            <Button className="w-full">Create Listing</Button>
          </Link>
        </div>

        {/* Marketplace */}
        <div className="flex flex-col rounded-xl border border-border bg-overlay/[0.02] p-6 transition-colors hover:border-neon-green/30 hover:bg-neon-green/[0.03]">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-neon-green/10 mb-4">
            <LayoutList size={18} className="text-neon-green" />
          </div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Marketplace</p>
          <div className="font-display text-3xl font-bold text-foreground mb-1">Browse</div>
          <p className="text-sm text-muted-foreground mb-5 flex-1">Find textbooks and materials from your peers</p>
          <Link href="/dashboard/listings">
            <Button variant="outline" className="w-full">Browse Listings</Button>
          </Link>
        </div>

        {/* My Deals */}
        <div className="flex flex-col rounded-xl border border-border bg-overlay/[0.02] p-6 transition-colors hover:border-neon-green/30 hover:bg-neon-green/[0.03]">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-neon-green/10 mb-4">
            <Handshake size={18} className="text-neon-green" />
          </div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">My Deals</p>
          <div className="font-display text-3xl font-bold text-neon-green mb-1">{dealsCount ?? 0}</div>
          <p className="text-sm text-muted-foreground mb-5 flex-1">Active and completed transactions</p>
          <Link href="/dashboard/deals">
            <Button variant="outline" className="w-full">View Deals</Button>
          </Link>
        </div>
      </div>

      {/* Tutoring CTA / status */}
      <div className="mb-8 rounded-xl border border-border bg-overlay/[0.02] p-6 transition-colors hover:border-neon-green/30">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-start gap-4 min-w-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-neon-green/10 shrink-0">
              <Sparkles size={18} className="text-neon-green" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                Tutoring
              </p>
              <p className="font-display text-xl font-semibold text-foreground mb-1">
                {hasActiveTutorProfile
                  ? "You’re listed as a tutor"
                  : tutor
                    ? "Resume your tutor profile"
                    : "Become a tutor"}
              </p>
              <p className="text-sm text-muted-foreground">
                {hasActiveTutorProfile
                  ? "Manage your profile, review incoming requests, and track sessions."
                  : "Share what you know and let peers book sessions with you."}
              </p>
            </div>
          </div>
          <div className="flex flex-col xs:flex-row sm:flex-row gap-2 w-full sm:w-auto shrink-0">
            {hasActiveTutorProfile ? (
              <>
                <Link href="/dashboard/tutoring/requests" className="w-full sm:w-auto">
                  <Button variant="outline" className="w-full sm:w-auto">Incoming requests</Button>
                </Link>
                <Link href="/dashboard/tutoring" className="w-full sm:w-auto">
                  <Button className="w-full sm:w-auto">Manage profile</Button>
                </Link>
              </>
            ) : tutor ? (
              <Link href="/dashboard/tutoring/edit" className="w-full sm:w-auto">
                <Button className="w-full sm:w-auto">Edit profile</Button>
              </Link>
            ) : (
              <Link href="/dashboard/tutoring/create" className="w-full sm:w-auto">
                <Button className="w-full sm:w-auto">
                  <Sparkles size={14} className="mr-1.5" /> List yourself
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Tips */}
      <div className="rounded-xl border border-border bg-overlay/[0.02] px-6 py-5">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Quick tips</p>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1.5 text-sm text-muted-foreground">
          <li className="flex items-start gap-2"><span className="text-neon-green mt-0.5 shrink-0">&bull;</span>Browse the Marketplace to find books from peers</li>
          <li className="flex items-start gap-2"><span className="text-neon-green mt-0.5 shrink-0">&bull;</span>Create a listing to sell your textbooks quickly</li>
          <li className="flex items-start gap-2"><span className="text-neon-green mt-0.5 shrink-0">&bull;</span>Track all your active deals in one place</li>
          <li className="flex items-start gap-2"><span className="text-neon-green mt-0.5 shrink-0">&bull;</span>Rate peers to help build a trusted community</li>
        </ul>
      </div>
    </>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent />
    </Suspense>
  );
}
