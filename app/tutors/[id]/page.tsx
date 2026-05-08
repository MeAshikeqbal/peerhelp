import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import {
  ArrowLeft,
  CalendarDays,
  GraduationCap,
  MapPin,
  ShieldCheck,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PublicNav } from "@/components/nav/PublicNav";
import { RequestSessionButton } from "@/components/tutor/RequestSessionButton";
import { getCurrentUser } from "@/utils/query/auth";
import { getVerificationStatus, getSellerProfile } from "@/utils/query/profiles";
import { getTutorById } from "@/utils/query/tutors";

const MODE_LABEL: Record<string, string> = {
  online: "Online",
  in_person: "In person",
  hybrid: "Hybrid",
};

export default function TutorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top,_rgba(54,244,164,0.07),_transparent_40%)]" />
      <PublicNav />
      <Suspense fallback={<TutorPageSkeleton />}>
        <TutorContent params={params} />
      </Suspense>
    </div>
  );
}

async function TutorContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ user }, { data: tutor }] = await Promise.all([
    getCurrentUser(supabase),
    getTutorById(supabase, id),
  ]);

  if (!tutor || tutor.status !== "active") notFound();

  const [{ data: ownerProfile }, verificationRes] = await Promise.all([
    getSellerProfile(supabase, tutor.user_id),
    user
      ? getVerificationStatus(supabase, user.id)
      : Promise.resolve({ data: null }),
  ]);

  const isLoggedIn = !!user;
  const isVerified =
    verificationRes.data?.verification_status === "verified";
  const isSelf = user?.id === tutor.user_id;

  const postedAt = new Date(tutor.created_at).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <main className="relative mx-auto max-w-[1100px] px-6 py-8 md:px-10 lg:px-16">
      <Link
        href="/tutors"
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft size={14} /> Back to tutors
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">
        <div className="space-y-6">
          <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl border border-border bg-forest">
            {tutor.image_url ? (
              <Image
                src={tutor.image_url}
                alt={tutor.headline}
                fill
                sizes="(max-width: 1024px) 100vw, 700px"
                className="object-cover"
                priority
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <GraduationCap size={64} className="text-muted-foreground/30" />
              </div>
            )}
          </div>

          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight text-foreground mb-2">
              {tutor.headline}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <Badge variant="outline" className="border-neon-green/30 text-neon-green">
                {MODE_LABEL[tutor.mode] ?? tutor.mode}
              </Badge>
              <span className="inline-flex items-center gap-1">
                <CalendarDays size={14} /> Listed {postedAt}
              </span>
              {ownerProfile?.college_name && (
                <span className="inline-flex items-center gap-1">
                  <MapPin size={14} /> {ownerProfile.college_name}
                </span>
              )}
            </div>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-foreground mb-2">
              Subjects
            </h2>
            <div className="flex flex-wrap gap-2">
              {(tutor.subjects ?? []).map((s) => (
                <span
                  key={s}
                  className="inline-flex items-center rounded-full border border-border bg-overlay/[0.03] px-3 py-1 text-xs text-shade-30"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>

          {tutor.bio && (
            <div>
              <h2 className="text-sm font-semibold text-foreground mb-2">
                About
              </h2>
              <p className="whitespace-pre-line text-sm leading-7 text-shade-30">
                {tutor.bio}
              </p>
            </div>
          )}

          {tutor.experience && (
            <div>
              <h2 className="text-sm font-semibold text-foreground mb-2">
                Experience
              </h2>
              <p className="whitespace-pre-line text-sm leading-7 text-shade-30">
                {tutor.experience}
              </p>
            </div>
          )}

          {tutor.languages && tutor.languages.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-foreground mb-2">
                Languages
              </h2>
              <div className="flex flex-wrap gap-2">
                {(tutor.languages ?? []).map((l) => (
                  <span
                    key={l}
                    className="inline-flex items-center rounded-full border border-border px-3 py-1 text-xs text-shade-30"
                  >
                    {l}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <aside className="lg:sticky lg:top-6 h-fit space-y-4 rounded-2xl border border-border bg-deep-teal p-6">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground/70">
              Hourly rate
            </p>
            <p className="font-display text-3xl font-bold text-accent mt-1">
              ₹{tutor.hourly_rate.toLocaleString()}
              <span className="text-sm font-normal text-muted-foreground ml-1">
                / hour
              </span>
            </p>
          </div>

          {tutor.availability && (
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground/70 mb-1">
                Availability
              </p>
              <p className="text-sm text-shade-30">{tutor.availability}</p>
            </div>
          )}

          <div className="border-t border-border pt-4">
            <div className="flex items-center gap-2 mb-3 text-xs text-muted-foreground">
              <ShieldCheck size={14} className="text-neon-green" />
              Verified student
            </div>
            <p className="text-sm font-medium text-foreground mb-3">
              {ownerProfile?.full_name ?? "PeerHelp tutor"}
            </p>
            <RequestSessionButton
              tutorId={tutor.id}
              isLoggedIn={isLoggedIn}
              isVerified={isVerified}
              isSelf={isSelf}
              defaultSubjects={tutor.subjects ?? []}
            />
          </div>
        </aside>
      </div>
    </main>
  );
}

function TutorPageSkeleton() {
  return (
    <main className="relative mx-auto max-w-[1100px] px-6 py-8 md:px-10 lg:px-16">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">
        <div className="space-y-6">
          <Skeleton className="aspect-[16/9] w-full rounded-2xl" />
          <Skeleton className="h-9 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-32 w-full" />
        </div>
        <Skeleton className="h-72 w-full rounded-2xl" />
      </div>
    </main>
  );
}
