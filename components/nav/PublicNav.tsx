"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { createClient } from "@/lib/supabase/client";

const ease: [number, number, number, number] = [0.16, 1, 0.3, 1];

const navLinks = [
  { href: "/marketplace", label: "Browse marketplace" },
  { href: "/tutors", label: "Find a tutor" },
];

export function PublicNav() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setIsLoggedIn(!!data.user);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session?.user);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  return (
    <motion.header
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease }}
      className="sticky top-0 z-40 border-b border-overlay/[0.06] bg-background/80 backdrop-blur-md safe-area-top"
    >
      <div className="mx-auto flex max-w-[1280px] items-center justify-between px-6 h-16 md:px-10 lg:px-16">
        <Logo href="/" className="text-lg" />

        {/* Desktop nav */}
        <nav className="hidden sm:flex items-center gap-2">
          <ThemeToggle />
          <Button asChild variant="ghost" size="sm">
            <Link href="/marketplace">Browse</Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href="/tutors">Find a tutor</Link>
          </Button>
          {isLoggedIn ? (
            <Button asChild variant="default" size="sm">
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/auth/login">Login</Link>
              </Button>
              <Button asChild variant="default" size="sm">
                <Link href="/auth/sign-up">Sign up</Link>
              </Button>
            </>
          )}
        </nav>

        {/* Mobile nav */}
        <div className="flex items-center gap-2 sm:hidden">
          <ThemeToggle />
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Open menu">
                <Menu size={20} />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" aria-describedby={undefined} className="w-72 p-0 flex flex-col">
              <SheetTitle className="sr-only">Navigation menu</SheetTitle>

              <nav className="flex flex-col gap-1 px-4 py-5 pt-8">
                {navLinks.map(({ href, label }) => (
                  <SheetClose asChild key={href}>
                    <Link
                      href={href}
                      className="rounded-lg px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                    >
                      {label}
                    </Link>
                  </SheetClose>
                ))}
              </nav>

              <div className="mt-auto flex flex-col gap-2 border-t border-border px-4 pt-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
                {isLoggedIn ? (
                  <SheetClose asChild>
                    <Button asChild variant="default" className="w-full">
                      <Link href="/dashboard">Go to Dashboard</Link>
                    </Button>
                  </SheetClose>
                ) : (
                  <>
                    <SheetClose asChild>
                      <Button asChild variant="outline" className="w-full">
                        <Link href="/auth/login">Login</Link>
                      </Button>
                    </SheetClose>
                    <SheetClose asChild>
                      <Button asChild variant="default" className="w-full">
                        <Link href="/auth/sign-up">Sign up</Link>
                      </Button>
                    </SheetClose>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </motion.header>
  );
}
