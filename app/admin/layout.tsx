import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/utils/query/auth";
import { isAdmin, isSuperAdmin } from "@/utils/query/admin";
import { LogoutButton } from "@/components/auth/logout-button";

/**
 * Auth gate. Renders nothing — its only job is to redirect non-admins.
 * Kept as a dedicated component (not bundled with HeaderUserBadge) so the
 * gate cannot be accidentally removed by a UI refactor.
 */
async function AdminGate() {
  const supabase = await createClient();
  const { user } = await getCurrentUser(supabase);
  if (!user) redirect("/auth/login");
  if (!(await isAdmin(supabase))) redirect("/dashboard");
  return null;
}

async function HeaderUserBadge() {
  const supabase = await createClient();
  const { user } = await getCurrentUser(supabase);
  if (!user) return null;

  const superAdmin = await isSuperAdmin(supabase);

  return (
    <span className="hidden md:inline">
      {user.email}
      {superAdmin && (
        <span className="ml-2 rounded-full border border-neon-green/40 bg-neon-green/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-neon-green">
          Super
        </span>
      )}
    </span>
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
      <header className="border-b border-overlay/10 bg-void/80 backdrop-blur">
        <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-6 px-6 py-4 md:px-10">
          <div className="flex items-center gap-6">
            <Link
              href="/admin"
              className="text-base font-medium tracking-wide text-foreground"
            >
              PeerHelp <span className="text-neon-green">Admin</span>
            </Link>
            <nav className="hidden items-center gap-5 text-sm text-shade-50 md:flex">
              <Link href="/admin" className="hover:text-foreground">
                Overview
              </Link>
              <Link
                href="/admin/verifications"
                className="hover:text-foreground"
              >
                Queue
              </Link>
              <Link
                href="/admin/verifications?status=verified"
                className="hover:text-foreground"
              >
                Approved
              </Link>
              <Link
                href="/admin/verifications?status=rejected"
                className="hover:text-foreground"
              >
                Rejected
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-3 text-sm text-shade-50">
            <Suspense
              fallback={
                <span className="hidden md:inline opacity-60">Loading…</span>
              }
            >
              <HeaderUserBadge />
            </Suspense>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-[1280px] px-6 py-8 md:px-10">
        <Suspense
          fallback={<div className="text-sm text-shade-50">Loading…</div>}
        >
          {children}
        </Suspense>
      </main>
    </div>
  );
}
