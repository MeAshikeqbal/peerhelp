"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, LogOut, UserCircle2, ChevronDown } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationBell } from "@/components/nav/NotificationBell";
import { UserAvatar, getInitials } from "@/components/ui/user-avatar";
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
  avatarUrl: string | null;
}

export function AppNav({ pendingDealsCount = 0, pendingTutorRequestsCount = 0, unreadMessagesCount = 0 }: { pendingDealsCount?: number; pendingTutorRequestsCount?: number; unreadMessagesCount?: number }) {
  const [user, setUser] = useState<NavUser | null>(null);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const avatarRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user: u } }) => {
      if (!u?.email) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("avatar_url")
        .eq("id", u.id)
        .maybeSingle();
      setUser({
        email: u.email,
        initials: getInitials(null, u.email),
        avatarUrl: profile?.avatar_url ?? null,
      });
    });
  }, []);

  useEffect(() => { setAvatarOpen(false); }, [pathname]);

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
    { href: "/dashboard", label: "Dashboard", active: pathname === "/dashboard", badge: 0 },
    { href: "/dashboard/listings", label: "Marketplace", active: pathname?.startsWith("/dashboard/listings") ?? false, badge: 0 },
    { href: "/dashboard/my-listings", label: "My Listings", active: pathname === "/dashboard/my-listings", badge: 0 },
    { href: "/dashboard/deals", label: "Deals", active: pathname === "/dashboard/deals", badge: pendingDealsCount },
    { href: "/dashboard/tutoring", label: "Tutoring", active: pathname?.startsWith("/dashboard/tutoring") ?? false, badge: pendingTutorRequestsCount },
    { href: "/dashboard/messages", label: "Messages", active: pathname?.startsWith("/dashboard/messages") ?? false, badge: unreadMessagesCount },
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
          <Logo className="text-lg" />

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className={linkCls(item.active)}>
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
                  <UserAvatar
                    size="sm"
                    src={user.avatarUrl}
                    email={user.email}
                    className="border border-neon-green/20"
                  />
                  <ChevronDown
                    size={14}
                    className={`text-shade-50 transition-transform duration-200 ${avatarOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {avatarOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-xl border border-overlay/[0.08] bg-deep-teal shadow-card-elevated py-1.5 overflow-hidden">
                    <div className="px-4 py-2.5 border-b border-overlay/[0.06]">
                      <p className="text-xs text-shade-50 truncate">{user.email}</p>
                    </div>
                    <div className="py-1">
                      <Link
                        href="/dashboard/profile"
                        onClick={() => setAvatarOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-sm text-shade-30 hover:text-foreground hover:bg-overlay/5 transition-colors"
                      >
                        <UserCircle2 size={15} className="text-shade-50" />
                        Profile
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
                <SheetTitle className="sr-only">Navigation menu</SheetTitle>

                {/* Nav links */}
                <nav className="flex flex-col gap-1 px-4 pt-8 pb-4">
                  {navItems.map((item) => (
                    <SheetClose asChild key={item.href}>
                      <Link
                        href={item.href}
                        className={linkCls(item.active)}
                      >
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

                {/* User section pinned to bottom */}
                <div className="mt-auto border-t border-border px-4 py-5 flex flex-col gap-1">
                  {user && (
                    <div className="flex items-center gap-2.5 px-3 py-2 mb-1">
                      <UserAvatar
                        size="sm"
                        src={user.avatarUrl}
                        email={user.email}
                        className="shrink-0 border border-neon-green/20"
                      />
                      <span className="text-sm text-shade-50 truncate">{user.email}</span>
                    </div>
                  )}
                  <SheetClose asChild>
                    <Link
                      href="/dashboard/profile"
                      className="flex items-center gap-2.5 px-3 py-2 text-sm text-shade-30 hover:text-foreground hover:bg-overlay/5 rounded-lg transition-colors"
                    >
                      <UserCircle2 size={15} className="text-shade-50" />
                      Profile
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
