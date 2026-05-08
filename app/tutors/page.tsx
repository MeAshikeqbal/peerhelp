import Link from "next/link";
import { Suspense } from "react";
import type { Metadata } from "next";
import { GraduationCap } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { PublicNav } from "@/components/nav/PublicNav";
import { TutorCard } from "@/components/tutor/TutorCard";
import { TutorsSkeleton } from "@/components/tutor/TutorsSkeleton";
import { TutorsSearchBar } from "@/components/tutor/TutorsSearchBar";
import { TutorsFilters } from "@/components/tutor/TutorsFilters";
import { getActiveTutors } from "@/utils/query/tutors";

const BASE = "/tutors";

export const metadata: Metadata = {
  title: "Find a tutor | PeerHelp",
  description:
    "Browse verified students offering tutoring sessions across subjects.",
};

interface SearchParamsRaw {
  q?: string;
  subject?: string;
  mode?: string;
  page?: string;
}

interface PageProps {
  searchParams: Promise<SearchParamsRaw>;
}

async function TutorsContent({
  searchParams,
}: {
  searchParams: Promise<SearchParamsRaw>;
}) {
  const sp = await searchParams;
  const filters = {
    q: sp.q,
    subject: sp.subject,
    mode: sp.mode,
    page: Math.max(1, parseInt(sp.page || "1", 10) || 1),
    pageSize: 12,
  };
  const supabase = await createClient();
  const { data, count } = await getActiveTutors(supabase, filters);
  const tutors = data ?? [];
  const totalPages = Math.ceil((count || 0) / filters.pageSize);

  function pageUrl(p: number) {
    const params = new URLSearchParams();
    if (filters.q) params.set("q", filters.q);
    if (filters.subject) params.set("subject", filters.subject);
    if (filters.mode) params.set("mode", filters.mode);
    params.set("page", String(p));
    return `${BASE}?${params.toString()}`;
  }

  return (
    <>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-foreground mb-2">
          Find a tutor
        </h1>
        <p className="text-muted-foreground">
          Verified students offering tutoring sessions.
          {count !== null && count > 0 && (
            <span className="ml-2 text-neon-green/80 font-medium">
              ({count.toLocaleString()} tutor{count !== 1 ? "s" : ""})
            </span>
          )}
        </p>
      </div>

      <TutorsSearchBar baseUrl={BASE} />

      <div className="flex gap-8">
        <aside className="hidden lg:block w-56 shrink-0">
          <div className="sticky top-6">
            <TutorsFilters
              subject={filters.subject}
              mode={filters.mode}
              baseUrl={BASE}
            />
          </div>
        </aside>

        <div className="flex-1 min-w-0">
          {tutors.length === 0 ? (
            <Empty className="border py-24">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <GraduationCap />
                </EmptyMedia>
                <EmptyTitle>No tutors found</EmptyTitle>
                <EmptyDescription>
                  Try clearing filters or search for a different subject.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Link
                  href={BASE}
                  className="text-sm text-neon-green hover:underline underline-offset-2"
                >
                  Clear all filters
                </Link>
              </EmptyContent>
            </Empty>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
                {tutors.map((t, i) => (
                  <TutorCard
                    key={t.id}
                    tutor={t}
                    href={`${BASE}/${t.id}`}
                    priority={i < 4}
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
                  {Array.from(
                    { length: Math.min(totalPages, 7) },
                    (_, i) => i + 1,
                  ).map((p) => (
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

          <div className="relative overflow-hidden rounded-[32px] border border-border bg-[linear-gradient(145deg,rgba(54,244,164,0.08),rgba(255,255,255,0.02))] px-8 py-12 text-center md:py-16 mt-4">
            <div className="pointer-events-none absolute -top-12 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-neon-green/10 blur-[80px]" />
            <p className="relative text-[11px] font-medium uppercase tracking-[0.22em] text-neon-green mb-4">
              For Students
            </p>
            <h2 className="relative font-display text-3xl font-[330] tracking-tight text-foreground mb-4 sm:text-4xl">
              Want to tutor or get help?
            </h2>
            <p className="relative text-muted-foreground mb-6 max-w-md mx-auto text-sm leading-7">
              Verify your college email to list yourself as a tutor or to
              request sessions from peers.
            </p>
            <div className="relative flex justify-center gap-3 flex-wrap">
              <Button asChild size="lg">
                <Link href="/auth/sign-up">Get started free</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/auth/login">Login</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default function TutorsPage({ searchParams }: PageProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <PublicNav />
      <main className="relative mx-auto max-w-[1200px] px-6 py-10 md:px-10 lg:px-16">
        <Suspense fallback={<TutorsSkeleton />}>
          <TutorsContent searchParams={searchParams} />
        </Suspense>
      </main>
    </div>
  );
}
