import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Skeleton } from "@/components/ui/skeleton";
import { DecisionPanel } from "./DecisionPanel";
import { StatusPill } from "@/components/admin/StatusPill";

const BUCKET = "verification-documents";
const SIGNED_URL_TTL = 60 * 5;

function VerificationDetailSkeleton() {
  return (
    <div className="animate-in fade-in space-y-6 duration-300">
      {/* Back + title */}
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="mb-3 h-4 w-32" />
          <Skeleton className="h-9 w-56" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          {/* Submitter card */}
          <div className="rounded-2xl border border-overlay/10 bg-overlay/5 p-5">
            <Skeleton className="mb-4 h-3 w-24" />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {[...Array(8)].map((_, i) => (
                <div key={i}>
                  <Skeleton className="mb-1 h-3 w-20" />
                  <Skeleton className="h-4 w-40" />
                </div>
              ))}
            </div>
          </div>

          {/* Document card */}
          <div className="rounded-2xl border border-overlay/10 bg-overlay/5 p-5">
            <Skeleton className="mb-4 h-3 w-28" />
            <Skeleton className="h-[300px] w-full rounded-xl" />
          </div>

          {/* Audit log card */}
          <div className="rounded-2xl border border-overlay/10 bg-overlay/5 p-5">
            <Skeleton className="mb-4 h-3 w-20" />
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-start justify-between gap-4 border-b border-overlay/5 pb-3 last:border-0">
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                  <Skeleton className="h-3 w-24 shrink-0" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Decision panel skeleton */}
        <div className="rounded-2xl border border-overlay/15 bg-overlay/5 p-5">
          <Skeleton className="mb-2 h-5 w-20" />
          <Skeleton className="mb-4 h-3 w-56" />
          <Skeleton className="mb-4 h-24 w-full rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-9 w-full rounded-md" />
            <Skeleton className="h-9 w-full rounded-md" />
            <Skeleton className="h-9 w-full rounded-md" />
          </div>
        </div>
      </div>
    </div>
  );
}

interface DetailRow {
  id: string;
  user_id: string;
  college_email: string;
  status: "pending" | "verified" | "rejected";
  id_document_path: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  document_purge_at: string | null;
  notes: string | null;
  created_at: string;
  profiles?: {
    id: string;
    full_name: string | null;
    college_name: string | null;
    college_email: string | null;
    verification_status: string;
  } | null;
}

interface AuditRow {
  id: string;
  actor_user_id: string | null;
  action: string;
  reason: string | null;
  created_at: string;
}

export default async function AdminVerificationDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<VerificationDetailSkeleton />}>
      <VerificationDetailContent params={params} />
    </Suspense>
  );
}

async function VerificationDetailContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // NB: college_verifications.user_id FKs auth.users (not public.profiles), so
  // PostgREST cannot embed `profiles` directly. Fetch in two steps instead.
  const { data: verification, error: vErr } = await supabase
    .from("college_verifications")
    .select(
      `id, user_id, college_email, status,
       id_document_path, reviewed_by, reviewed_at, review_notes, document_purge_at,
       notes, created_at`,
    )
    .eq("id", id)
    .maybeSingle();

  if (vErr) {
    console.error("[admin/verifications/[id]] load failed", vErr);
  }
  if (!verification) notFound();

  const admin = createAdminClient();

  const { data: profileRow } = await admin
    .from("profiles")
    .select(
      "id, full_name, college_name, college_email, verification_status",
    )
    .eq("id", verification.user_id)
    .maybeSingle();

  const v = {
    ...verification,
    profiles: profileRow ?? null,
  } as unknown as DetailRow;

  const { data: auditData } = await admin
    .from("verification_audit_log")
    .select("id, actor_user_id, action, reason, created_at")
    .eq("verification_id", id)
    .order("created_at", { ascending: false });
  const audit = (auditData ?? []) as AuditRow[];

  let documentUrl: string | null = null;
  let documentMime: string | null = null;
  if (v.id_document_path) {
    const { data: signed } = await admin.storage
      .from(BUCKET)
      .createSignedUrl(v.id_document_path, SIGNED_URL_TTL);
    documentUrl = signed?.signedUrl ?? null;

    // Best-effort: get mimetype from object metadata
    const folder = v.id_document_path.substring(
      0,
      v.id_document_path.lastIndexOf("/"),
    );
    const filename = v.id_document_path.substring(
      v.id_document_path.lastIndexOf("/") + 1,
    );
    const { data: list } = await admin.storage
      .from(BUCKET)
      .list(folder, { search: filename, limit: 1 });
    const meta = list?.[0]?.metadata as { mimetype?: string } | undefined;
    documentMime = meta?.mimetype ?? null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/admin/verifications"
            className="text-xs text-shade-50 hover:text-foreground"
          >
            ← Back to queue
          </Link>
          <h1 className="mt-2 text-[28px] font-[330]">
            Verification review
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-overlay/10 bg-overlay/5 p-5">
            <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-shade-50">
              Submitter
            </h2>
            <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
              <Field label="Name" value={v.profiles?.full_name ?? "—"} />
              <Field label="Profile email" value={v.profiles?.college_email ?? "—"} />
              <Field label="College (claimed)" value={v.profiles?.college_name ?? "—"} />
              <Field label="Submitted college email" value={v.college_email} />
              <Field
                label="Submitted"
                value={new Date(v.created_at).toLocaleString()}
              />
              <div>
                <dt className="text-xs uppercase tracking-wide text-shade-50">
                  Status
                </dt>
                <dd className="mt-1">
                  <StatusPill status={v.status} />
                </dd>
              </div>
              {v.notes && <Field label="User note" value={v.notes} />}
              {v.review_notes && (
                <Field label="Last reviewer note" value={v.review_notes} />
              )}
              {v.document_purge_at && (
                <Field
                  label="Auto-purge at"
                  value={new Date(v.document_purge_at).toLocaleString()}
                />
              )}
            </dl>
          </section>

          <section className="rounded-2xl border border-overlay/10 bg-overlay/5 p-5">
            <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-shade-50">
              ID document
            </h2>
            {!v.id_document_path ? (
              <p className="text-sm text-shade-50">
                No document uploaded yet.
              </p>
            ) : !documentUrl ? (
              <p className="text-sm text-red-400">
                Could not generate signed URL.
              </p>
            ) : documentMime?.startsWith("image/") ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={documentUrl}
                alt="ID document"
                className="max-h-[640px] w-full rounded-xl object-contain"
              />
            ) : (
              <a
                href={documentUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center rounded-full border border-overlay/15 px-4 py-2 text-sm hover:bg-overlay/10"
              >
                Open document ({documentMime ?? "file"})
              </a>
            )}
          </section>

          <section className="rounded-2xl border border-overlay/10 bg-overlay/5 p-5">
            <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-shade-50">
              Audit log
            </h2>
            {audit.length === 0 ? (
              <p className="text-sm text-shade-50">No events recorded.</p>
            ) : (
              <ul className="space-y-3 text-sm">
                {audit.map((a) => (
                  <li
                    key={a.id}
                    className="flex items-start justify-between gap-4 border-b border-overlay/5 pb-2 last:border-0"
                  >
                    <div>
                      <p className="font-medium">{a.action}</p>
                      {a.reason && (
                        <p className="text-shade-50">{a.reason}</p>
                      )}
                    </div>
                    <p className="text-xs text-shade-50 whitespace-nowrap">
                      {new Date(a.created_at).toLocaleString()}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <aside className="space-y-6">
          <DecisionPanel
            verificationId={v.id}
            status={v.status}
            hasDocument={Boolean(v.id_document_path)}
          />
        </aside>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-shade-50">{label}</dt>
      <dd className="mt-1 text-sm text-foreground">{value ?? "—"}</dd>
    </div>
  );
}
