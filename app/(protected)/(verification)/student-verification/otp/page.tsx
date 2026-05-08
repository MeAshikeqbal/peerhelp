import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import OtpForm from "./OtpForm";
import { getCurrentUser } from "@/utils/query/auth";
import { getProfileById } from "@/utils/query/profiles";

function getMessage(searchParams: Record<string, string | string[] | undefined>) {
  if (searchParams.error === "invalid-otp") {
    return "Invalid verification code. Please try again.";
  }

  if (searchParams.error === "otp-expired") {
    return "Verification code expired. Please request a new one.";
  }

  if (searchParams.error === "otp-verify") {
    return "Could not verify your code. Please try again.";
  }

  if (searchParams.error === "already-verified") {
    return "Your account is already verified.";
  }

  if (searchParams.status === "pending-review") {
    return "Your code was accepted, but your account is waiting for manual review.";
  }

  return null;
}

async function OtpVerificationContent({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const message = getMessage(params);

  const supabase = await createClient();
  const { user } = await getCurrentUser(supabase);

  if (!user) {
    redirect("/auth/login");
  }

  const { data: profile } = await getProfileById(supabase, user.id);

  const collegeEmail = profile?.college_email;
  const maskedEmail = collegeEmail
    ? collegeEmail.replace(/(.{2})(.*)(@.*)/, "$1***$3")
    : "your college email";

  if (params.status === "pending-review") {
    return (
      <div className="mx-auto w-full max-w-[680px]">
        <Card>
          <CardHeader className="space-y-4 pb-8">
            <CardTitle className="text-[38px] font-[330] leading-[1.08]">
              Manual review pending
            </CardTitle>
            <CardDescription className="text-base leading-7 text-shade-50">
              Your code was accepted. We need to review your account before granting full access.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-shade-50">
              We sent the review request for {maskedEmail}. You do not need to enter another code.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href="/student-verification" className="inline-flex h-11 items-center justify-center rounded-full border border-overlay/20 px-5 text-sm text-foreground transition hover:bg-overlay/5">
                Update details
              </Link>
              <Link href="/dashboard" className="inline-flex h-11 items-center justify-center rounded-full bg-foreground px-5 text-sm text-background transition hover:opacity-90">
                Go to workspace
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[680px]">
      <Card>
        <CardHeader className="space-y-4 pb-8">
          <CardTitle className="text-[38px] font-[330] leading-[1.08]">
            Enter verification code
          </CardTitle>
          <CardDescription className="text-base leading-7 text-shade-50">
            We sent a code to {maskedEmail}. Enter it below to verify your student access.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OtpForm message={message} />
        </CardContent>
      </Card>
    </div>
  );
}

function OtpVerificationLoading() {
  return (
    <div className="mx-auto w-full max-w-[680px]">
      <Card>
        <CardHeader className="space-y-4 pb-8">
          <CardTitle className="text-[38px] font-[330] leading-[1.08]">
            Enter verification code
          </CardTitle>
          <CardDescription className="text-base leading-7 text-shade-50">
            Loading...
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}

export default function OtpVerificationPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <Suspense fallback={<OtpVerificationLoading />}>
      <OtpVerificationContent searchParams={searchParams} />
    </Suspense>
  );
}