import Link from "next/link";
import { redirect } from "next/navigation";
import { Send } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/utils/query/auth";
import { getProfileById, getProfilesByIds } from "@/utils/query/profiles";
import { getOutgoingRequests } from "@/utils/query/tutors";
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

export default async function LearningPage() {
  const supabase = await createClient();
  const { user } = await getCurrentUser(supabase);
  if (!user) redirect("/auth/login");

  const { data: profile } = await getProfileById(supabase, user.id);
  if (profile?.verification_status !== "verified") {
    redirect("/student-verification");
  }

  const { data: requests, error: reqError } = await getOutgoingRequests(supabase, user.id);
  if (reqError) throw reqError;
  const list = requests ?? [];

  const tutorIds = Array.from(new Set(list.map((r) => r.tutor_user_id)));
  const profileMap = new Map<string, string>();
  if (tutorIds.length > 0) {
    const { data: profiles, error: profError } = await getProfilesByIds(supabase, tutorIds);
    if (profError) console.error("[LearningPage] getProfilesByIds failed", profError);
    for (const p of profiles ?? []) {
      if (p.full_name) profileMap.set(p.id, p.full_name);
    }
  }

  return (
    <>
      <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground mb-2">
            My session requests
          </h1>
          <p className="text-muted-foreground">
            Track sessions you&apos;ve requested from tutors.
          </p>
        </div>
        <Link href="/tutors">
          <Button variant="outline">Find more tutors</Button>
        </Link>
      </div>

      {list.length === 0 ? (
        <div className="rounded-2xl border border-border bg-overlay/[0.02] p-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-neon-green/10 mb-4">
            <Send size={22} className="text-neon-green" />
          </div>
          <p className="text-foreground font-medium mb-1">No requests yet</p>
          <p className="text-sm text-muted-foreground mb-4">
            Browse tutors and request your first session.
          </p>
          <Link href="/tutors">
            <Button>Find a tutor</Button>
          </Link>
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
                  <p className="font-medium text-foreground">{r.subject}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    With{" "}
                    <Link
                      href={`/tutors/${r.tutor_profile_id}`}
                      className="text-shade-30 hover:text-foreground underline-offset-2 hover:underline"
                    >
                      {profileMap.get(r.tutor_user_id) ?? "a tutor"}
                    </Link>{" "}
                    · {MODE_LABEL[r.mode] ?? r.mode}
                    {r.proposed_when ? ` · ${r.proposed_when}` : ""}
                  </p>
                </div>
                <SessionRequestStatusActions
                  requestId={r.id}
                  role="learner"
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
