import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import CreateListingForm from "@/components/listing/CreateListingForm";

export default async function CreateListingPage() {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/auth/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("verification_status")
    .eq("id", user.id)
    .single();

  // Redirect unverified users to verification
  if (profile?.verification_status !== "verified") {
    redirect("/student-verification");
  }

  return (
    <>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-foreground mb-2">
          Create a listing
        </h1>
        <p className="text-muted-foreground">
          List your books or study materials for sale on campus
        </p>
      </div>

      <CreateListingForm />
    </>
  );
}
