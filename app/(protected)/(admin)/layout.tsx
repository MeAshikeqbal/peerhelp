import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/utils/query/auth";
import { isAdmin, isSuperAdmin } from "@/utils/query/admin";
import { AdminNav } from "@/components/nav/AdminNav";

/**
 * AdminShell performs the auth check before rendering nav + children,
 * so children are never streamed to non-admins. Must be async and wrapped
 * in <Suspense> (required by cacheComponents).
 */
async function AdminShell({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { user } = await getCurrentUser(supabase);
  if (!user) redirect("/auth/login");
  if (!(await isAdmin(supabase))) redirect("/dashboard");

  const [{ count }, superAdmin] = await Promise.all([
    supabase
      .from("college_verifications")
      .select("id", { count: "exact", head: true })
      .eq("verification_method", "manual_review")
      .eq("status", "pending"),
    isSuperAdmin(supabase),
  ]);

  return (
    <>
      <AdminNav
        pendingCount={count ?? 0}
        isSuperAdmin={superAdmin}
        email={user.email ?? null}
      />
      <main className="mx-auto max-w-[1280px] px-6 py-10 md:px-10 lg:px-16">
        <Suspense
          fallback={<div className="text-sm text-shade-50">Loading…</div>}
        >
          {children}
        </Suspense>
      </main>
    </>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-void text-foreground">
      <Suspense
        fallback={<div className="h-16 border-b border-overlay/[0.06] bg-deep-teal/80" />}
      >
        <AdminShell>{children}</AdminShell>
      </Suspense>
    </div>
  );
}
