import Link from "next/link";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { ReportsTable } from "@/components/admin/ReportsTable";

type Status = "pending" | "reviewed" | "dismissed" | "all";

const STATUSES: { value: Status; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "reviewed", label: "Reviewed" },
  { value: "dismissed", label: "Dismissed" },
  { value: "all", label: "All" },
];

interface ReportRow {
  id: string;
  reporter_id: string;
  reported_user_id: string;
  thread_id: string | null;
  message_id: string | null;
  reason: string;
  status: "pending" | "reviewed" | "dismissed";
  created_at: string;
  reviewed_at: string | null;
}

async function ReportsList({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const sp = await searchParams;
  const VALID: Status[] = ["pending", "reviewed", "dismissed", "all"];
  const rawStatus = sp.status as Status | undefined;
  const status: Status =
    rawStatus && VALID.includes(rawStatus) ? rawStatus : "pending";

  const supabase = await createClient();
  let query = supabase
    .from("message_reports")
    .select(
      "id, reporter_id, reported_user_id, thread_id, message_id, reason, status, created_at, reviewed_at",
    )
    .order("created_at", { ascending: false })
    .limit(200);
  if (status !== "all") query = query.eq("status", status);

  const { data, error } = await query;
  const rows = (data ?? []) as ReportRow[];

  const ids = Array.from(
    new Set(rows.flatMap((r) => [r.reporter_id, r.reported_user_id])),
  );
  const { data: profiles } = ids.length
    ? await supabase.from("profiles").select("id, full_name").in("id", ids)
    : { data: [] as { id: string; full_name: string | null }[] };
  const nameMap = new Map((profiles ?? []).map((p) => [p.id, p.full_name]));

  const enriched = rows.map((r) => ({
    ...r,
    reporter_name: nameMap.get(r.reporter_id) ?? null,
    reported_name: nameMap.get(r.reported_user_id) ?? null,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-[28px] font-[330]">Reports</h1>
        <div className="flex gap-2">
          {STATUSES.map((s) => {
            const active = s.value === status;
            return (
              <Link
                key={s.value}
                href={`/admin/reports?status=${s.value}`}
                className={`rounded-full border px-3 py-1 text-xs transition ${
                  active
                    ? "border-neon-green/40 bg-neon-green/10 text-neon-green"
                    : "border-overlay/15 text-shade-50 hover:text-foreground"
                }`}
              >
                {s.label}
              </Link>
            );
          })}
        </div>
      </div>

      {error ? (
        <p className="text-sm text-red-400">Failed to load: {error.message}</p>
      ) : (
        <ReportsTable reports={enriched} />
      )}
    </div>
  );
}

export default function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  return (
    <Suspense fallback={<div className="text-sm text-shade-50">Loading…</div>}>
      <ReportsList searchParams={searchParams} />
    </Suspense>
  );
}
