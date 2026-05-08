import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { getCurrentUser } from "@/utils/query/auth";
import { getProfileById } from "@/utils/query/profiles";

interface ProfileRow {
  college_name: string | null;
  college_email: string | null;
  verification_status: string;
}

export default async function PendingReviewPage() {
  const supabase = await createClient();

  const { user } = await getCurrentUser(supabase);
  if (!user) redirect("/auth/login");

  const { data: profileData } = await getProfileById(supabase, user.id);

  const profile = profileData as ProfileRow | null;

  if (profile?.verification_status === "verified") {
    redirect("/dashboard");
  }

  const maskedEmail = profile?.college_email
    ? profile.college_email.replace(/(.{2})(.*)(@.*)/, "$1***$3")
    : null;

  return (
    <div className="mx-auto w-full max-w-[680px]">
      <Card>
        <CardHeader className="space-y-4 pb-8">
          <CardTitle className="text-[38px] font-[330] leading-[1.08]">
            Under review
          </CardTitle>
          <CardDescription className="text-base leading-7 text-shade-50">
            We&apos;re reviewing your credentials. You&apos;ll receive an email when your account is approved — usually within 24 hours.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Submitted details */}
          <div className="rounded-xl border border-overlay/10 bg-overlay/5 p-4 space-y-3">
            <p className="text-xs font-medium uppercase tracking-wide text-shade-50">Submitted details</p>
            <div className="space-y-2 text-sm">
              {profile?.college_name && (
                <div className="flex justify-between gap-4">
                  <span className="text-shade-50">College</span>
                  <span className="text-foreground font-medium text-right">{profile.college_name}</span>
                </div>
              )}
              {maskedEmail && (
                <div className="flex justify-between gap-4">
                  <span className="text-shade-50">Email</span>
                  <span className="text-foreground font-medium">{maskedEmail}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/student-verification"
              className="inline-flex h-11 items-center justify-center rounded-full border border-overlay/20 px-5 text-sm text-foreground transition hover:bg-overlay/5 sm:flex-1"
            >
              Update details
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex h-11 items-center justify-center rounded-full bg-foreground px-5 text-sm text-background transition hover:opacity-90 sm:flex-1"
            >
              Go to workspace
            </Link>
          </div>

          <p className="text-xs text-shade-50">
            Questions?{" "}
            <a href="mailto:support@peerhelp.app" className="text-foreground hover:text-neon-green transition-colors">
              Contact support
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

