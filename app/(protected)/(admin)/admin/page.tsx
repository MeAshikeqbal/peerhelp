import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

async function getCounts() {
  const supabase = await createClient();

  async function count(status: "pending" | "verified" | "rejected") {
    const { count } = await supabase
      .from("college_verifications")
      .select("id", { count: "exact", head: true })
      .eq("verification_method", "manual_review")
      .eq("status", status);
    return count ?? 0;
  }

  const [pending, verified, rejected] = await Promise.all([
    count("pending"),
    count("verified"),
    count("rejected"),
  ]);
  return { pending, verified, rejected };
}

export default async function AdminHome() {
  const counts = await getCounts();

  const cards: { label: string; value: number; href: string; tone: string }[] =
    [
      {
        label: "Pending review",
        value: counts.pending,
        href: "/admin/verifications?status=pending",
        tone: "border-neon-green/30 bg-neon-green/5 text-neon-green",
      },
      {
        label: "Approved",
        value: counts.verified,
        href: "/admin/verifications?status=verified",
        tone: "border-overlay/15 bg-overlay/5 text-foreground",
      },
      {
        label: "Rejected",
        value: counts.rejected,
        href: "/admin/verifications?status=rejected",
        tone: "border-overlay/15 bg-overlay/5 text-foreground",
      },
    ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-[36px] font-[330] leading-tight">
          Admin overview
        </h1>
        <p className="mt-1 text-sm text-shade-50">
          Manual student verifications.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {cards.map((c) => (
          <Link
            key={c.label}
            href={c.href}
            className={`rounded-2xl border p-6 transition hover:opacity-90 ${c.tone}`}
          >
            <p className="text-xs font-medium uppercase tracking-wide opacity-80">
              {c.label}
            </p>
            <p className="mt-2 text-3xl font-light">{c.value}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
