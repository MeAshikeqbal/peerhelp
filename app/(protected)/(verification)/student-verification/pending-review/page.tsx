import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/utils/query/auth";
import { getProfileById } from "@/utils/query/profiles";
import { PendingReviewView } from "@/components/verification/PendingReviewView";

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

  // Reviewer notes are cleared from the row when the user re-uploads
  // (see /api/student-verification/upload-document/confirm). Belt-and-braces:
  // also hide them on the client whenever the user is awaiting a fresh review,
  // so any stale row that still carries old notes won't surface here.
  const reviewerNotes = verification?.review_notes ?? null;
  const showReviewerNotes = !awaitingReview && Boolean(reviewerNotes);

  const mode: "awaiting" | "upload" | "rejected" = isRejected
    ? "rejected"
    : needsUpload
      ? "upload"
      : "awaiting";

  return (
    <PendingReviewView
      mode={mode}
      collegeName={profile?.college_name ?? null}
      maskedEmail={maskedEmail}
      reviewerNotes={reviewerNotes}
      showReviewerNotes={showReviewerNotes}
    />
  );
}
