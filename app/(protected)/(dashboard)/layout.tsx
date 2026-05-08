import { Suspense } from "react";
import { AppNav } from "@/components/nav/AppNav";
import { createClient } from "@/lib/supabase/server";

async function NavWithPending() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let pendingDealsCount = 0;
  if (user) {
    const { count } = await supabase
      .from("deals")
      .select("id", { count: "exact", head: true })
      .eq("seller_id", user.id)
      .eq("status", "pending");
    pendingDealsCount = count ?? 0;
  }

  return <AppNav pendingDealsCount={pendingDealsCount} />;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-void">
      <Suspense fallback={<div className="h-16 border-b border-border bg-forest/80" />}>
        <NavWithPending />
      </Suspense>

      <main className="mx-auto max-w-[1280px] px-6 py-10 md:px-10 lg:px-16">
        <Suspense fallback={<div className="text-muted-foreground">Loading...</div>}>
          {children}
        </Suspense>
      </main>
    </div>
  );
}
