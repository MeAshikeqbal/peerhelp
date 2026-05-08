import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/utils/query/auth";
import ClientForm from "./ClientForm";

function getMessage(searchParams: Record<string, string | string[] | undefined>) {
  if (searchParams.error === "invalid-email") {
    return "Please enter a valid student email.";
  }

  if (searchParams.error === "profile-update") {
    return "We could not update your profile. Please try again.";
  }

  if (searchParams.error === "otp-send") {
    return "Failed to send OTP. Please try again.";
  }

  return null;
}

async function StudentVerificationContent({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const supabase = await createClient();
  const { user } = await getCurrentUser(supabase);
  if (!user) redirect("/auth/login");

  // If the user has already entered the manual-review track (in any state),
  // do not let them re-fill the form. Send them to the pending-review page
  // where they can monitor status or re-upload after a rejection.
  const { data: existingManual } = await supabase
    .from("college_verifications")
    .select("id")
    .eq("user_id", user.id)
    .eq("verification_method", "manual_review")
    .limit(1)
    .maybeSingle();

  if (existingManual) {
    redirect("/student-verification/pending-review");
  }

  const params = await searchParams;
  const message = getMessage(params);

  return (
    <div className="mx-auto w-full max-w-[680px]">
      <Card>
        <CardHeader className="space-y-4 pb-8">
          <CardTitle className="text-[38px] font-[330] leading-[1.08]">
            Verify your student account
          </CardTitle>
          <CardDescription className="text-base leading-7 text-shade-50">
            Tell us who you are and where you study. We&apos;ll send a one-time code to confirm your student email.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ClientForm message={message} />
        </CardContent>
      </Card>
    </div>
  );
}

function StudentVerificationLoading() {
  return (
    <div className="mx-auto w-full max-w-[680px]">
      <Card>
        <CardHeader className="space-y-4 pb-8">
          <CardTitle className="text-[38px] font-[330] leading-[1.08]">
            Verify your student account
          </CardTitle>
          <CardDescription className="text-base leading-7 text-shade-50">
            Loading verification details...
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}

export default function StudentVerificationPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <Suspense fallback={<StudentVerificationLoading />}>
      <StudentVerificationContent searchParams={searchParams} />
    </Suspense>
  );
}