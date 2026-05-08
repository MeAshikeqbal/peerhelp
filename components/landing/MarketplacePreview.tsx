"use client";

import { motion, useInView } from "motion/react";
import { useRef } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, Calculator, FileText, FlaskConical } from "lucide-react";
import { GlowingEffect } from "@/components/ui/glowing-effect";

const ease: [number, number, number, number] = [0.16, 1, 0.3, 1];

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.55, ease },
  },
};

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

export function MarketplacePreview() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="border-t border-border py-20 sm:py-28">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.22em] text-neon-green">
            What students trade
          </p>
          <h2 className="mt-3 max-w-xl font-display text-3xl tracking-[-0.035em] text-foreground sm:text-4xl">
            Everything you need for the next semester
          </h2>
        </div>
        <Link
          href="/marketplace"
          className="mt-2 inline-flex shrink-0 items-center gap-2 text-sm text-foreground transition-colors hover:text-neon-green sm:mt-0"
        >
          Explore marketplace
          <ArrowRight size={15} />
        </Link>
      </div>

      <motion.div
        className="mt-12 grid auto-rows-[minmax(160px,auto)] grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
        variants={containerVariants}
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
      >
        {/* Textbooks — featured wide card */}
        <motion.div variants={itemVariants} className="sm:col-span-2 lg:col-span-2">
          <div className="relative h-full rounded-2xl border border-border p-2">
            <GlowingEffect spread={40} glow={false} disabled={false} proximity={64} inactiveZone={0.01} />
            <Link
              href="/marketplace?type=book"
              className="group relative flex h-full flex-col overflow-hidden rounded-xl bg-card p-7"
            >
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    "radial-gradient(ellipse at 90% 110%, rgba(74,222,128,0.07) 0%, transparent 55%)",
                }}
              />
              <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-neon-green/10 text-neon-green">
                <BookOpen size={18} />
              </div>
              <div className="relative mt-auto">
                <h3 className="font-display text-2xl tracking-[-0.03em] text-foreground">
                  Textbooks
                </h3>
                <p className="mt-2 max-w-xs text-sm leading-6 text-muted-foreground">
                  Course books, reference editions &amp; exam prep, sourced from students one year ahead.
                </p>
                <span className="mt-5 inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors group-hover:text-foreground">
                  Browse <ArrowRight size={13} />
                </span>
              </div>
            </Link>
          </div>
        </motion.div>

        {/* Notes & PYQs */}
        <motion.div variants={itemVariants}>
          <div className="relative h-full rounded-2xl border border-border p-2">
            <GlowingEffect spread={40} glow={false} disabled={false} proximity={64} inactiveZone={0.01} />
            <Link
              href="/marketplace?type=notes"
              className="group flex h-full flex-col rounded-xl bg-card p-6"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neon-green/10 text-neon-green">
                <FileText size={18} />
              </div>
              <h3 className="mt-5 font-display text-lg tracking-[-0.02em] text-foreground">
                Notes &amp; PYQs
              </h3>
              <p className="mt-2 flex-1 text-sm leading-6 text-muted-foreground">
                Hand-written notes, organised PYQs, lecture summaries.
              </p>
              <span className="mt-5 inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors group-hover:text-foreground">
                Browse <ArrowRight size={13} />
              </span>
            </Link>
          </div>
        </motion.div>

        {/* Lab gear */}
        <motion.div variants={itemVariants}>
          <div className="relative h-full rounded-2xl border border-border p-2">
            <GlowingEffect spread={40} glow={false} disabled={false} proximity={64} inactiveZone={0.01} />
            <Link
              href="/marketplace?type=other"
              className="group flex h-full flex-col rounded-xl bg-card p-6"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neon-green/10 text-neon-green">
                <FlaskConical size={18} />
              </div>
              <h3 className="mt-5 font-display text-lg tracking-[-0.02em] text-foreground">
                Lab gear
              </h3>
              <p className="mt-2 flex-1 text-sm leading-6 text-muted-foreground">
                Coats, kits, aprons and instruments passed down a year.
              </p>
              <span className="mt-5 inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors group-hover:text-foreground">
                Browse <ArrowRight size={13} />
              </span>
            </Link>
          </div>
        </motion.div>

        {/* Calculators & tools — featured wide card */}
        <motion.div variants={itemVariants} className="sm:col-span-2 lg:col-span-2">
          <div className="relative h-full rounded-2xl border border-border p-2">
            <GlowingEffect spread={40} glow={false} disabled={false} proximity={64} inactiveZone={0.01} />
            <Link
              href="/marketplace?type=other"
              className="group relative flex h-full flex-col overflow-hidden rounded-xl bg-card p-7"
            >
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    "radial-gradient(ellipse at 10% -10%, rgba(74,222,128,0.06) 0%, transparent 55%)",
                }}
              />
              <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-neon-green/10 text-neon-green">
                <Calculator size={18} />
              </div>
              <div className="relative mt-auto">
                <h3 className="font-display text-2xl tracking-[-0.03em] text-foreground">
                  Calculators &amp; tools
                </h3>
                <p className="mt-2 max-w-xs text-sm leading-6 text-muted-foreground">
                  Drafters, scientific calculators, drawing kits and more.
                </p>
                <span className="mt-5 inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors group-hover:text-foreground">
                  Browse <ArrowRight size={13} />
                </span>
              </div>
            </Link>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
