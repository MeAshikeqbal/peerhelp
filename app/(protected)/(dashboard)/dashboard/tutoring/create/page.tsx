import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TutorForm } from "@/components/tutor/TutorForm";
import { getCurrentUser } from "@/utils/query/auth";
import { getProfileById } from "@/utils/query/profiles";

export default async function CreateTutorPage() {
  const supabase = await createClient();
  const { user } = await getCurrentUser(supabase);
  if (!user) redirect("/auth/login");

  const { data: profile } = await getProfileById(supabase, user.id);
  if (profile?.verification_status !== "verified") {
    redirect("/student-verification");
  }

  return (
    <>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-foreground mb-2">
          Become a tutor
        </h1>
        <p className="text-muted-foreground">
          Tell peers what you can help with.
        </p>
      </div>
      <TutorForm mode="create" />
    </>
  );
}
