import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { StatusPill } from "../../../../../components/admin/StatusPill";

type Status = "pending" | "verified" | "rejected" | "all";

const STATUSES: { value: Status; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "verified", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "all", label: "All" },
];

interface Row {
  id: string;
  user_id: string;
  college_email: string;
  email_domain: string;
  status: "pending" | "verified" | "rejected";
  id_document_path: string | null;
  reviewed_at: string | null;
  created_at: string;
  notes: string | null;
}

export default async function AdminVerificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const sp = await searchParams;
  const VALID_STATUSES: Status[] = ["pending", "verified", "rejected", "all"];
  const rawStatus = sp.status as Status | undefined;
  const status: Status = rawStatus && VALID_STATUSES.includes(rawStatus) ? rawStatus : "pending";

  const supabase = await createClient();
  let query = supabase
    .from("college_verifications")
    .select(
      "id, user_id, college_email, email_domain, status, id_document_path, reviewed_at, created_at, notes",
    )
    .eq("verification_method", "manual_review")
    .order("created_at", { ascending: false })
    .limit(200);

  if (status !== "all") {
    query = query.eq("status", status);
  }

  const { data, error } = await query;
  const rows = (data ?? []) as Row[];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-[28px] font-[330]">Verifications</h1>
        <div className="flex gap-2">
          {STATUSES.map((s) => {
            const active = s.value === status;
            return (
              <Link
                key={s.value}
                href={`/admin/verifications?status=${s.value}`}
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
      ) : rows.length === 0 ? (
        <p className="text-sm text-shade-50">No verifications match.</p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-overlay/10">
          <table className="w-full text-sm">
            <thead className="bg-overlay/5 text-left text-xs uppercase tracking-wide text-shade-50">
              <tr>
                <th className="px-4 py-3 font-medium">Submitted</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Domain</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Doc</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.id}
                  className="border-t border-overlay/10 hover:bg-overlay/5"
                >
                  <td className="px-4 py-3 text-shade-50">
                    {new Date(r.created_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">{r.college_email}</td>
                  <td className="px-4 py-3 text-shade-50">{r.email_domain}</td>
                  <td className="px-4 py-3">
                    <StatusPill status={r.status} />
                  </td>
                  <td className="px-4 py-3 text-shade-50">
                    {r.id_document_path ? "yes" : "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/verifications/${r.id}`}
                      className="text-neon-green hover:underline"
                    >
                      Review →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
