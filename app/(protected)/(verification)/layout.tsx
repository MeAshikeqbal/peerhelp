import { Suspense } from "react";
import { AppNav } from "@/components/nav/AppNav";

export default function VerificationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-void">
      <Suspense fallback={<div className="h-16 border-b border-border bg-forest/80" />}>
        <AppNav />
      </Suspense>

      <main className="mx-auto max-w-[1280px] px-6 py-10 md:px-10 lg:px-16">
        <Suspense fallback={<div className="text-muted-foreground">Loading...</div>}>
          {children}
        </Suspense>
      </main>
    </div>
  );
}
