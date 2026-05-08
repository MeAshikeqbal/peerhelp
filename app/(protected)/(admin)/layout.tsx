import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/utils/query/auth";
import { isAdmin, isSuperAdmin } from "@/utils/query/admin";
import { AdminNav } from "@/components/nav/AdminNav";

/**
 * Auth gate. Renders nothing — its only job is to redirect non-admins.
 * Kept dedicated (not bundled with the nav) so the gate cannot be accidentally
 * removed by a UI refactor.
 */
async function AdminGate() {
  const supabase = await createClient();
  const { user } = await getCurrentUser(supabase);
  if (!user) redirect("/auth/login");
  if (!(await isAdmin(supabase))) redirect("/dashboard");
  return null;
}

async function NavWithCounts() {
  const supabase = await createClient();
  const { user } = await getCurrentUser(supabase);

  const [{ count }, superAdmin] = await Promise.all([
    supabase
      .from("college_verifications")
      .select("id", { count: "exact", head: true })
      .eq("verification_method", "manual_review")
      .eq("status", "pending"),
    isSuperAdmin(supabase),
  ]);

  return (
    <AdminNav
      pendingCount={count ?? 0}
      isSuperAdmin={superAdmin}
      email={user?.email ?? null}
    />
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-void text-foreground">
      {/* Auth gate runs in parallel with the rest; redirects before children render. */}
      <Suspense fallback={null}>
        <AdminGate />
      </Suspense>

      <Suspense
        fallback={<div className="h-16 border-b border-overlay/[0.06] bg-deep-teal/80" />}
      >
        <NavWithCounts />
      </Suspense>

      <main className="mx-auto max-w-[1280px] px-6 py-10 md:px-10 lg:px-16">
        <Suspense
          fallback={<div className="text-sm text-shade-50">Loading…</div>}
        >
          {children}
        </Suspense>
      </main>
    </div>
  );
}
