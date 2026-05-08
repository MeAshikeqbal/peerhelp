import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { getCurrentUser } from "@/utils/query/auth";
import { getProfileById } from "@/utils/query/profiles";
import { IdDocumentUpload } from "@/components/verification/IdDocumentUpload";

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

  // Fetch the latest manual_review verification row.
  const { data: verification } = await supabase
    .from("college_verifications")
    .select(
      "id, status, id_document_path, review_notes, reviewed_at, verification_method, created_at",
    )
    .eq("user_id", user.id)
    .eq("verification_method", "manual_review")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const maskedEmail = profile?.college_email
    ? profile.college_email.replace(/(.{2})(.*)(@.*)/, "$1***$3")
    : null;

  const isRejected = profile?.verification_status === "rejected";
  const hasDocument = Boolean(verification?.id_document_path);
  const awaitingReview =
    hasDocument && verification?.status === "pending" && !isRejected;
  const needsUpload = !isRejected && !hasDocument && Boolean(verification);
  // Rejected users can re-upload to start a new review cycle.
  const canReuploadAfterReject = isRejected;
  const reviewerNotes = verification?.review_notes ?? null;

  let title = "Under review";
  let description =
    "We're reviewing your credentials. You'll receive an email when your account is approved — usually within 24 hours.";

  if (isRejected) {
    title = "Verification not approved";
    description =
      "Your previous submission wasn't approved. Upload a clearer photo or scan of your student ID below to start a new review.";
  } else if (needsUpload) {
    title = "Upload your student ID";
    description =
      "To complete manual review, upload a clear photo or scan of your student ID card. Documents are deleted within 24 hours of a decision.";
  } else if (awaitingReview) {
    title = "Document submitted";
    description =
      "Thanks — your ID is queued for review. You'll get an email once a reviewer responds.";
  }

  return (
    <div className="mx-auto w-full max-w-[680px]">
      <Card>
        <CardHeader className="space-y-4 pb-8">
          <CardTitle className="text-[38px] font-[330] leading-[1.08]">
            {title}
          </CardTitle>
          <CardDescription className="text-base leading-7 text-shade-50">
            {description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {reviewerNotes && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-amber-200">
              <p className="text-xs font-medium uppercase tracking-wide text-amber-300/80 mb-1">
                {isRejected ? "Reason for rejection" : "Reviewer note"}
              </p>
              <p className="leading-6">{reviewerNotes}</p>
            </div>
          )}

          <div className="rounded-xl border border-overlay/10 bg-overlay/5 p-4 space-y-3">
            <p className="text-xs font-medium uppercase tracking-wide text-shade-50">
              Submitted details
            </p>
            <div className="space-y-2 text-sm">
              {profile?.college_name && (
                <div className="flex justify-between gap-4">
                  <span className="text-shade-50">College</span>
                  <span className="text-foreground font-medium text-right">
                    {profile.college_name}
                  </span>
                </div>
              )}
              {maskedEmail && (
                <div className="flex justify-between gap-4">
                  <span className="text-shade-50">Email</span>
                  <span className="text-foreground font-medium">
                    {maskedEmail}
                  </span>
                </div>
              )}
            </div>
          </div>

          {needsUpload && <IdDocumentUpload hasExisting={false} />}
          {canReuploadAfterReject && <IdDocumentUpload hasExisting={false} />}

          {isRejected && (
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/dashboard"
                className="inline-flex h-11 items-center justify-center rounded-full border border-overlay/20 px-5 text-sm text-foreground transition hover:bg-overlay/5 sm:flex-1"
              >
                Go to workspace
              </Link>
            </div>
          )}

          <p className="text-xs text-shade-50">
            Questions?{" "}
            <a
              href="mailto:support@peerhelp.app"
              className="text-foreground hover:text-neon-green transition-colors"
            >
              Contact support
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
