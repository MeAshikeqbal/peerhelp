import Link from "next/link";
import { Suspense } from "react";
import {
  ClipboardList,
  CheckCircle2,
  XCircle,
  ShieldCheck,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Skeleton } from "@/components/ui/skeleton";

function AdminHomeSkeleton() {
  return (
    <div className="animate-in fade-in duration-300">
      <div className="mb-8">
        <Skeleton className="mb-2 h-10 w-72" />
        <Skeleton className="h-5 w-56" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-border bg-overlay/[0.02] p-6"
          >
            <Skeleton className="mb-4 h-9 w-9 rounded-lg" />
            <Skeleton className="mb-2 h-4 w-32" />
            <Skeleton className="mb-1 h-10 w-16" />
            <Skeleton className="mb-5 h-4 w-44" />
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-overlay/[0.02] p-6">
        <Skeleton className="mb-4 h-6 w-28" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/6" />
          <Skeleton className="h-4 w-3/6" />
        </div>
      </div>
    </div>
  );
}

async function AdminHomeContent() {
  const supabase = await createClient();

  async function count(status: "pending" | "verified" | "rejected") {
    const { count, error } = await supabase
      .from("college_verifications")
      .select("id", { count: "exact", head: true })
      .eq("verification_method", "manual_review")
      .eq("status", status);
    if (error) throw new Error(`[AdminHome] count(${status}) failed: ${error.message}`);
    return count ?? 0;
  }

  const [pending, verified, rejected] = await Promise.all([
    count("pending"),
    count("verified"),
    count("rejected"),
  ]);

  const cards = [
    {
      label: "Pending review",
      value: pending,
      href: "/admin/verifications?status=pending",
      cta: "Review queue",
      icon: ClipboardList,
      accent: true,
      description: "Submissions awaiting a decision",
    },
    {
      label: "Approved",
      value: verified,
      href: "/admin/verifications?status=verified",
      cta: "View approved",
      icon: CheckCircle2,
      accent: false,
      description: "Students currently verified via manual review",
    },
    {
      label: "Rejected",
      value: rejected,
      href: "/admin/verifications?status=rejected",
      cta: "View rejected",
      icon: XCircle,
      accent: false,
      description: "Submissions that did not pass review",
    },
  ];

  return (
    <>
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-bold text-foreground mb-2">
            Admin overview
          </h1>
          <p className="text-muted-foreground">
            Manual student verifications and review queue.
          </p>
        </div>
        <span className="mt-1 shrink-0 inline-flex items-center gap-1.5 rounded-full border border-neon-green/30 bg-neon-green/10 px-3 py-1.5 text-xs text-neon-green">
          <ShieldCheck size={12} />
          Admin console
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div
              key={c.label}
              className="flex flex-col rounded-xl border border-border bg-overlay/[0.02] p-6 transition-colors hover:border-neon-green/30 hover:bg-neon-green/[0.03]"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-neon-green/10 mb-4">
                <Icon size={18} className="text-neon-green" />
              </div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                {c.label}
              </p>
              <div
                className={`font-display text-3xl font-bold mb-1 ${c.accent ? "text-neon-green" : "text-foreground"}`}
              >
                {c.value}
              </div>
              <p className="text-sm text-muted-foreground mb-5 flex-1">
                {c.description}
              </p>
              <Link
                href={c.href}
                className={`inline-flex w-full items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                  c.accent
                    ? "bg-neon-green text-forest hover:bg-neon-green/90"
                    : "border border-overlay/15 text-foreground hover:bg-overlay/5"
                }`}
              >
                {c.cta}
              </Link>
            </div>
          );
        })}
      </div>

      <div className="rounded-xl border border-border bg-overlay/[0.02] px-6 py-5">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
          Reviewer guidance
        </p>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1.5 text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="text-neon-green mt-0.5 shrink-0">&bull;</span>
            Open the queue and pick the oldest pending submission first
          </li>
          <li className="flex items-start gap-2">
            <span className="text-neon-green mt-0.5 shrink-0">&bull;</span>
            Verify the document matches the claimed college email and name
          </li>
          <li className="flex items-start gap-2">
            <span className="text-neon-green mt-0.5 shrink-0">&bull;</span>
            Use &ldquo;Request changes&rdquo; for blurry or wrong-document uploads
          </li>
          <li className="flex items-start gap-2">
            <span className="text-neon-green mt-0.5 shrink-0">&bull;</span>
            Always include a reason when rejecting a submission
          </li>
        </ul>
      </div>
    </>
  );
}

export default function AdminHome() {
  return (
    <Suspense fallback={<AdminHomeSkeleton />}>
      <AdminHomeContent />
    </Suspense>
  );
}
