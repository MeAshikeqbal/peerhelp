"use client";

import { motion } from "motion/react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

const BackgroundBoxes = dynamic(
  () => import("@/components/ui/background-boxes").then((m) => m.BackgroundBoxes),
  { ssr: false }
);

const ease: [number, number, number, number] = [0.16, 1, 0.3, 1];

const trustPills = [
  "College email verified",
  "No platform fees",
  "Meet on campus",
];

export function HeroSection() {
  return (
    <section className="relative flex flex-1 items-center overflow-hidden py-20 sm:py-28 lg:py-36">
      {/* Interactive grid background */}
      <BackgroundBoxes />

      {/* Radial mask — wider ellipse so more of the grid shows through */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-10 bg-background"
        style={{ maskImage: "radial-gradient(ellipse 85% 75% at 50% 50%, transparent 30%, white 72%)" }}
      />

      {/* Neon-green glow bloom behind the hero text */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[15] flex items-center justify-center"
      >
        <div className="h-64 w-full max-w-[40rem] rounded-full bg-neon-green/[0.07] blur-3xl" />
      </div>

      <div className="relative z-20 mx-auto w-full max-w-3xl px-4 sm:px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease }}
          className="inline-flex items-center gap-2 rounded-full border border-neon-green/20 bg-neon-green/5 px-4 py-1.5 text-xs text-neon-green/80 backdrop-blur-sm"
        >
          <span className="inline-flex h-1.5 w-1.5 rounded-full bg-neon-green animate-pulse" />
          Student-only campus marketplace
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease, delay: 0.05 }}
          className="mt-6 font-display text-[clamp(2.75rem,7vw,5.5rem)] font-[330] leading-[0.95] tracking-[-0.045em] text-foreground"
        >
          Buy from{" "}
          <span className="text-neon-green">seniors.</span>
          <br />
          Sell to{" "}
          <span className="text-neon-green">juniors.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease, delay: 0.12 }}
          className="mx-auto mt-6 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg"
        >
          Textbooks, notes, lab gear, and exam essentials &mdash;
          exchanged on campus, with people you can actually find.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease, delay: 0.18 }}
          className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row"
        >
          <Button asChild size="lg" className="w-full sm:w-auto shadow-[0_0_24px_0px] shadow-neon-green/25">
            <Link href="/auth/sign-up" className="inline-flex items-center gap-2">
              Create free account
              <ArrowRight size={16} />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="w-full sm:w-auto border-border/60 backdrop-blur-sm hover:border-neon-green/40">
            <Link href="/marketplace">Browse marketplace</Link>
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, ease, delay: 0.28 }}
          className="mt-8 flex flex-wrap items-center justify-center gap-x-4 gap-y-2.5 text-xs text-muted-foreground"
        >
          {trustPills.map((pill) => (
            <span key={pill} className="inline-flex items-center gap-1.5">
              <ShieldCheck size={13} className="text-neon-green" />
              {pill}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
