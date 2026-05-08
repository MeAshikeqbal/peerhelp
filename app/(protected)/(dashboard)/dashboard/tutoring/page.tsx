import Link from "next/link";
import { redirect } from "next/navigation";
import {
  GraduationCap,
  Inbox,
  PencilLine,
  Send,
  Sparkles,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getCurrentUser } from "@/utils/query/auth";
import { getProfileById } from "@/utils/query/profiles";
import { getOwnTutorProfile } from "@/utils/query/tutors";

const STATUS_LABEL: Record<string, string> = {
  active: "Active",
  paused: "Paused",
  archived: "Archived",
};

const STATUS_COLOR: Record<string, string> = {
  active: "border-neon-green/30 bg-neon-green/10 text-neon-green",
  paused: "border-yellow-500/30 bg-yellow-500/10 text-yellow-300",
  archived: "border-border bg-overlay/[0.04] text-muted-foreground",
};

export default async function TutoringHomePage() {
  const supabase = await createClient();
  const { user } = await getCurrentUser(supabase);
  if (!user) redirect("/auth/login");

  const { data: profile } = await getProfileById(supabase, user.id);
  if (profile?.verification_status !== "verified") {
    redirect("/student-verification");
  }

  const { data: tutor } = await getOwnTutorProfile(supabase, user.id);

  return (
    <>
      <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground mb-2">
            Tutoring
          </h1>
          <p className="text-muted-foreground">
            Offer your help to peers or track sessions you&apos;ve booked.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/tutoring/learning">
            <Button variant="outline">
              <Send size={14} className="mr-1.5" /> My requests
            </Button>
          </Link>
          {tutor && (
            <Link href="/dashboard/tutoring/requests">
              <Button variant="outline">
                <Inbox size={14} className="mr-1.5" /> Incoming
              </Button>
            </Link>
          )}
        </div>
      </div>

      {tutor ? (
        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-overlay/[0.02] p-6">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex-1 min-w-0">
                <Badge
                  variant="outline"
                  className={`mb-3 ${STATUS_COLOR[tutor.status] ?? ""}`}
                >
                  {STATUS_LABEL[tutor.status] ?? tutor.status}
                </Badge>
                <h2 className="font-display text-xl font-semibold text-foreground mb-1">
                  {tutor.headline}
                </h2>
                <p className="text-sm text-muted-foreground">
                  ₹{tutor.hourly_rate.toLocaleString("en-IN")} / hour ·{" "}
                  {tutor.subjects.slice(0, 4).join(", ")}
                  {tutor.subjects.length > 4
                    ? ` +${tutor.subjects.length - 4}`
                    : ""}
                </p>
              </div>
              <div className="flex gap-2">
                <Link href={`/tutors/${tutor.id}`}>
                  <Button variant="outline" size="sm">
                    View public page
                  </Button>
                </Link>
                <Link href="/dashboard/tutoring/edit">
                  <Button size="sm">
                    <PencilLine size={14} className="mr-1.5" /> Edit
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-overlay/[0.02] p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-neon-green/10 mb-4">
            <GraduationCap size={22} className="text-neon-green" />
          </div>
          <h2 className="font-display text-xl font-semibold text-foreground mb-2">
            Become a tutor
          </h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
            Share what you know — list yourself as a tutor and let peers find
            you. You can pause or archive your profile any time.
          </p>
          <Link href="/dashboard/tutoring/create">
            <Button>
              <Sparkles size={14} className="mr-1.5" /> Create tutor profile
            </Button>
          </Link>
        </div>
      )}
    </>
  );
}
