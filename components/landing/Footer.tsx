import Link from "next/link";
import { Heart } from "lucide-react";
import { Logo } from "@/components/logo";
import { CopyrightYear } from "@/components/landing/CopyrightYear";

const NAV_LINKS = [
  {
    heading: "Product",
    links: [
      { label: "Marketplace", href: "/marketplace" },
      { label: "How it works", href: "/#how-it-works" },
    ],
  },
  {
    heading: "Account",
    links: [
      { label: "Sign up", href: "/auth/sign-up" },
      { label: "Log in", href: "/auth/login" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto w-full max-w-[1200px] px-6 md:px-10 lg:px-16">

        {/* Top row */}
        <div className="flex flex-col gap-10 py-12 sm:flex-row sm:gap-16">
          {/* Brand column */}
          <div className="flex-1 space-y-4">
            <Logo asLink={false} className="text-base" />
            <p className="max-w-[260px] text-sm leading-relaxed text-muted-foreground">
              The campus marketplace for students. Buy and sell books &amp; study materials with verified peers.
            </p>
          </div>

          {/* Nav columns */}
          <div className="flex gap-12 sm:gap-16">
            {NAV_LINKS.map((group) => (
              <div key={group.heading} className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground/60">
                  {group.heading}
                </p>
                <ul className="space-y-2.5">
                  {group.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col items-center justify-between gap-2 border-t border-border py-6 text-xs text-muted-foreground sm:flex-row">
          <p>&copy; <CopyrightYear /> PeerHelp. All rights reserved.</p>
          <p className="flex items-center gap-1.5">
            Made with{" "}
            <Heart
              size={12}
              className="fill-neon-green text-neon-green"
              aria-hidden="true"
            />{" "}
            by <span className="font-medium text-foreground">Vision Devs</span>
          </p>
        </div>

      </div>
    </footer>
  );
}
