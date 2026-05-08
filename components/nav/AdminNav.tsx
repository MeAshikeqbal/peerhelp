"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, LogOut, ChevronDown, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationBell } from "@/components/nav/NotificationBell";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";

interface NavUser {
  email: string;
  initials: string;
  isSuperAdmin: boolean;
}

function getInitials(email: string) {
  const local = email.split("@")[0];
  const parts = local.split(/[._-]/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return local.slice(0, 2).toUpperCase();
}

export function AdminNav({
  pendingCount = 0,
  pendingReportsCount = 0,
  isSuperAdmin = false,
  email,
}: {
  pendingCount?: number;
  pendingReportsCount?: number;
  isSuperAdmin?: boolean;
  email?: string | null;
}) {
  const [user, setUser] = useState<NavUser | null>(
    email ? { email, initials: getInitials(email), isSuperAdmin } : null,
  );
  const [avatarOpen, setAvatarOpen] = useState(false);
  const avatarRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (user) return;
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      if (u?.email) {
        setUser({ email: u.email, initials: getInitials(u.email), isSuperAdmin });
      }
    });
  }, [user, isSuperAdmin]);

  useEffect(() => {
    setAvatarOpen(false);
  }, [pathname]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) {
        setAvatarOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const navItems = [
    { href: "/admin", label: "Overview", active: pathname === "/admin", badge: 0 },
    {
      href: "/admin/verifications",
      label: "Queue",
      active:
        pathname === "/admin/verifications" ||
        (pathname?.startsWith("/admin/verifications/") ?? false),
      badge: pendingCount,
    },
    {
      href: "/admin/reports",
      label: "Reports",
      active:
        pathname === "/admin/reports" ||
        (pathname?.startsWith("/admin/reports/") ?? false),
      badge: pendingReportsCount,
    },
  ];

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  const linkCls = (active: boolean) =>
    active
      ? "text-sm font-medium px-3 py-1.5 rounded-full bg-neon-green/10 text-neon-green transition-colors"
      : "text-sm font-medium px-3 py-1.5 rounded-full text-shade-50 hover:text-foreground hover:bg-overlay/5 transition-colors";

  return (
    <nav className="sticky top-0 z-40 border-b border-overlay/[0.06] bg-deep-teal/80 backdrop-blur-md">
      <div className="mx-auto max-w-[1280px] px-6 md:px-10 lg:px-16">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo className="text-lg" />
            <span className="hidden sm:inline-flex items-center gap-1 rounded-full border border-neon-green/30 bg-neon-green/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-neon-green">
              <ShieldCheck size={10} />
              Admin
            </span>
          </div>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link key={item.label} href={item.href} className={linkCls(item.active)}>
                <span className="relative inline-flex items-center">
                  {item.label}
                  {item.badge > 0 && (
                    <span
                      aria-label={`${item.badge} pending`}
                      className="ml-1.5 inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-neon-green/20 text-neon-green text-[10px] font-semibold px-1"
                    >
                      {item.badge > 99 ? "99+" : item.badge}
                    </span>
                  )}
                </span>
              </Link>
            ))}
          </div>

          {/* Desktop avatar menu */}
          <div className="hidden md:flex items-center gap-1">
            <ThemeToggle />
            <NotificationBell />
            {user && (
              <div ref={avatarRef} className="relative">
                <button
                  onClick={() => setAvatarOpen((v) => !v)}
                  className="flex items-center gap-2 rounded-full pl-1 pr-2 py-1 hover:bg-overlay/5 transition-colors"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neon-green/15 border border-neon-green/20 text-neon-green text-xs font-semibold select-none">
                    {user.initials}
                  </div>
                  <ChevronDown
                    size={14}
                    className={`text-shade-50 transition-transform duration-200 ${avatarOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {avatarOpen && (
                  <div className="absolute right-0 mt-2 w-60 rounded-xl border border-overlay/[0.08] bg-deep-teal shadow-card-elevated py-1.5 overflow-hidden">
                    <div className="px-4 py-2.5 border-b border-overlay/[0.06]">
                      <p className="text-xs text-shade-50 truncate">{user.email}</p>
                      {user.isSuperAdmin && (
                        <p className="mt-1 inline-flex items-center gap-1 rounded-full border border-neon-green/40 bg-neon-green/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-neon-green">
                          Super admin
                        </p>
                      )}
                    </div>
                    <div className="py-1">
                      <Link
                        href="/dashboard"
                        onClick={() => setAvatarOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-sm text-shade-30 hover:text-foreground hover:bg-overlay/5 transition-colors"
                      >
                        Switch to dashboard
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-shade-30 hover:text-foreground hover:bg-overlay/5 transition-colors"
                      >
                        <LogOut size={15} className="text-shade-50" />
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <div className="md:hidden flex items-center gap-1">
            <ThemeToggle />
            <NotificationBell />
            <Sheet>
              <SheetTrigger asChild>
                <button
                  className="p-2 rounded-md text-shade-50 hover:text-foreground hover:bg-overlay/5 transition-colors"
                  aria-label="Open menu"
                >
                  <Menu size={20} />
                </button>
              </SheetTrigger>
              <SheetContent side="right" aria-describedby={undefined} className="w-72 p-0 flex flex-col">
                <SheetTitle className="sr-only">Admin navigation</SheetTitle>

                <nav className="flex flex-col gap-1 px-4 pt-8 pb-4">
                  {navItems.map((item) => (
                    <SheetClose asChild key={item.label}>
                      <Link href={item.href} className={linkCls(item.active)}>
                        <span className="relative inline-flex items-center">
                          {item.label}
                          {item.badge > 0 && (
                            <span
                              aria-label={`${item.badge} pending`}
                              className="ml-1.5 inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-neon-green/20 text-neon-green text-[10px] font-semibold px-1"
                            >
                              {item.badge > 99 ? "99+" : item.badge}
                            </span>
                          )}
                        </span>
                      </Link>
                    </SheetClose>
                  ))}
                </nav>

                <div className="mt-auto border-t border-border px-4 py-5 flex flex-col gap-1">
                  {user && (
                    <div className="flex items-center gap-2.5 px-3 py-2 mb-1">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neon-green/15 border border-neon-green/20 text-neon-green text-xs font-semibold">
                        {user.initials}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm text-shade-50 truncate">{user.email}</p>
                        {user.isSuperAdmin && (
                          <p className="text-[10px] uppercase tracking-wide text-neon-green">
                            Super admin
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                  <SheetClose asChild>
                    <Link
                      href="/dashboard"
                      className="flex items-center gap-2.5 px-3 py-2 text-sm text-shade-30 hover:text-foreground hover:bg-overlay/5 rounded-lg transition-colors"
                    >
                      Switch to dashboard
                    </Link>
                  </SheetClose>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2.5 px-3 py-2 text-sm text-shade-30 hover:text-foreground hover:bg-overlay/5 rounded-lg transition-colors"
                  >
                    <LogOut size={15} className="text-shade-50" />
                    Sign out
                  </button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}
