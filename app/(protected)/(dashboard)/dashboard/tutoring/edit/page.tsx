import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TutorForm } from "@/components/tutor/TutorForm";
import { getCurrentUser } from "@/utils/query/auth";
import { getProfileById } from "@/utils/query/profiles";
import { getOwnTutorProfile } from "@/utils/query/tutors";

export default async function EditTutorPage() {
  const supabase = await createClient();
  const { user } = await getCurrentUser(supabase);
  if (!user) redirect("/auth/login");

  const { data: profile } = await getProfileById(supabase, user.id);
  if (profile?.verification_status !== "verified") {
    redirect("/student-verification");
  }

  const { data: tutor } = await getOwnTutorProfile(supabase, user.id);
  if (!tutor) redirect("/dashboard/tutoring/create");

  return (
    <>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-foreground mb-2">
          Edit tutor profile
        </h1>
        <p className="text-muted-foreground">
          Update your headline, subjects, rate or availability.
        </p>
      </div>
      <TutorForm
        mode="edit"
        initial={{
          id: tutor.id,
          headline: tutor.headline,
          bio: tutor.bio,
          subjects: tutor.subjects,
          mode: tutor.mode,
          hourly_rate: tutor.hourly_rate,
          availability: tutor.availability,
          languages: tutor.languages,
          experience: tutor.experience,
          status: tutor.status,
        }}
      />
    </>
  );
}
