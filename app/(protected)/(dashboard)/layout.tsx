import { Suspense } from "react";
import { AppNav } from "@/components/nav/AppNav";
import { createClient } from "@/lib/supabase/server";
import { getUnreadMessagesCount } from "@/utils/query/messages";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { ProfileIncompleteBanner } from "@/components/profile/ProfileIncompleteBanner";

async function NavWithPending() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let pendingDealsCount = 0;
  let pendingTutorRequestsCount = 0;
  let unreadMessagesCount = 0;
  if (user) {
    const [dealsRes, tutorReqRes, unread] = await Promise.all([
      supabase
        .from("deals")
        .select("id", { count: "exact", head: true })
        .eq("seller_id", user.id)
        .eq("status", "pending"),
      supabase
        .from("tutor_session_requests")
        .select("id", { count: "exact", head: true })
        .eq("tutor_user_id", user.id)
        .eq("status", "pending"),
      getUnreadMessagesCount(supabase),
    ]);
    pendingDealsCount = dealsRes.count ?? 0;
    pendingTutorRequestsCount = tutorReqRes.count ?? 0;
    unreadMessagesCount = unread;
  }

  return (
    <AppNav
      pendingDealsCount={pendingDealsCount}
      pendingTutorRequestsCount={pendingTutorRequestsCount}
      unreadMessagesCount={unreadMessagesCount}
    />
  );
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

      <Suspense fallback={null}>
        <ProfileIncompleteBanner />
      </Suspense>

      <main className="mx-auto max-w-[1280px] px-6 py-10 md:px-10 lg:px-16">
        <Suspense fallback={<div className="text-muted-foreground">Loading...</div>}>
          {children}
        </Suspense>
      </main>

      <InstallPrompt />
    </div>
  );
}
