import Link from "next/link";
import { redirect } from "next/navigation";
import { Inbox } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { getCurrentUser } from "@/utils/query/auth";
import { getProfileById, getProfilesByIds } from "@/utils/query/profiles";
import { getIncomingRequests } from "@/utils/query/tutors";
import { SessionRequestStatusActions } from "@/components/tutor/SessionRequestStatusActions";
import { MessageButton } from "@/components/messages/MessageButton";

const STATUS_COLOR: Record<string, string> = {
  pending: "border-yellow-500/30 bg-yellow-500/10 text-yellow-300",
  accepted: "border-neon-green/30 bg-neon-green/10 text-neon-green",
  declined: "border-red-500/30 bg-red-500/10 text-red-400",
  cancelled: "border-border bg-overlay/[0.04] text-muted-foreground",
  completed: "border-blue-500/30 bg-blue-500/10 text-blue-400",
};

const MODE_LABEL: Record<string, string> = {
  online: "Online",
  in_person: "In person",
  hybrid: "Hybrid",
};

type Status =
  | "pending"
  | "accepted"
  | "declined"
  | "cancelled"
  | "completed";

export default async function TutorRequestsPage() {
  const supabase = await createClient();
  const { user } = await getCurrentUser(supabase);
  if (!user) redirect("/auth/login");

  const { data: profile } = await getProfileById(supabase, user.id);
  if (profile?.verification_status !== "verified") {
    redirect("/student-verification");
  }

  const { data: requests } = await getIncomingRequests(supabase, user.id);
  const list = requests ?? [];

  const learnerIds = Array.from(new Set(list.map((r) => r.learner_user_id)));
  const profileMap = new Map<string, string>();
  if (learnerIds.length > 0) {
    const { data: profiles } = await getProfilesByIds(supabase, learnerIds);
    for (const p of profiles ?? []) {
      if (p.full_name) profileMap.set(p.id, p.full_name);
    }
  }

  return (
    <>
      <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground mb-2">
            Incoming session requests
          </h1>
          <p className="text-muted-foreground">
            Review and respond to learners who want to book you.
          </p>
        </div>
        <Link
          href="/dashboard/tutoring"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to tutoring
        </Link>
      </div>

      {list.length === 0 ? (
        <div className="rounded-2xl border border-border bg-overlay/[0.02] p-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-neon-green/10 mb-4">
            <Inbox size={22} className="text-neon-green" />
          </div>
          <p className="text-foreground font-medium mb-1">No requests yet</p>
          <p className="text-sm text-muted-foreground">
            When a peer requests a session, it&apos;ll show up here.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {list.map((r) => (
            <li
              key={r.id}
              className="rounded-2xl border border-border bg-overlay/[0.02] p-5"
            >
              <div className="flex items-start justify-between gap-4 flex-wrap mb-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge
                      variant="outline"
                      className={STATUS_COLOR[r.status] ?? ""}
                    >
                      {r.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(r.created_at).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <p className="font-medium text-foreground">
                    {r.subject}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    From{" "}
                    <span className="text-shade-30">
                      {profileMap.get(r.learner_user_id) ?? "a peer"}
                    </span>{" "}
                    · {MODE_LABEL[r.mode] ?? r.mode}
                    {r.proposed_when ? ` · ${r.proposed_when}` : ""}
                  </p>
                </div>
                <SessionRequestStatusActions
                  requestId={r.id}
                  role="tutor"
                  status={r.status as Status}
                />
              </div>
              {(r.status === "accepted" || r.status === "completed") && (
                <div className="mt-2">
                  <MessageButton contextType="tutor_request" contextId={r.id} variant="compact" />
                </div>
              )}
              {r.message && (
                <p className="text-sm text-shade-30 whitespace-pre-line border-t border-border pt-3 mt-2">
                  {r.message}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
