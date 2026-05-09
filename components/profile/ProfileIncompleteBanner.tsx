import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getProfileById, getOwnPhone } from "@/utils/query/profiles";
import { getCurrentUser } from "@/utils/query/auth";

export async function ProfileIncompleteBanner() {
  const supabase = await createClient();
  const { user, error: userError } = await getCurrentUser(supabase);
  if (userError || !user) return null;

  const [{ data: profile }, { data: phoneData }] = await Promise.all([
    getProfileById(supabase, user.id),
    getOwnPhone(supabase),
  ]);
  if (!profile) return null;

  const missingFields: string[] = [];
  if (!profile.full_name?.trim()) missingFields.push("display name");
  if (!(phoneData as string | null)) missingFields.push("phone number");

  if (missingFields.length === 0) return null;

  return (
    <div className="border-b border-yellow-500/20 bg-yellow-500/10 px-6 py-3">
      <div className="mx-auto max-w-[1280px] px-0 md:px-4 lg:px-10 flex items-center gap-3">
        <AlertCircle size={16} className="text-yellow-400 shrink-0" />
        <p className="text-sm text-yellow-300 flex-1">
          Your profile is incomplete — missing:{" "}
          <span className="font-medium">{missingFields.join(", ")}</span>.
        </p>
        <Link
          href="/dashboard/profile"
          className="shrink-0 text-xs font-semibold text-yellow-300 underline underline-offset-2 hover:text-yellow-200 transition-colors"
        >
          Complete profile
        </Link>
      </div>
    </div>
  );
}
