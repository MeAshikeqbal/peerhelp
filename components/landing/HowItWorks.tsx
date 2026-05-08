"use client";

import { motion, useInView } from "motion/react";
import { useRef } from "react";
import { Handshake, MailCheck, ScanLine } from "lucide-react";

const ease: [number, number, number, number] = [0.16, 1, 0.3, 1];

const steps = [
  {
    icon: MailCheck,
    number: "01",
    title: "Verify with your college email",
    description:
      "One-time check ties every account to a real campus identity. No outsiders, no random meetups.",
  },
  {
    icon: ScanLine,
    number: "02",
    title: "Publish a listing in under a minute",
    description:
      "Scan an ISBN, snap a photo, set your price. Structured enough to feel trustworthy without slowing you down.",
  },
  {
    icon: Handshake,
    number: "03",
    title: "Meet on campus and close the deal",
    description:
      "Hostels, library steps, department blocks. Clear deal states keep both sides aligned from request to handover.",
  },
];

const headingVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease },
  },
};

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.14, delayChildren: 0.15 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease },
  },
};

export function HowItWorks() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="border-t border-border py-20 sm:py-28">
      <motion.div
        variants={headingVariants}
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
        className="mx-auto max-w-2xl text-center"
      >
        <p className="text-[11px] uppercase tracking-[0.22em] text-neon-green">
          How it works
        </p>
        <h2 className="mt-4 font-display text-3xl tracking-[-0.035em] text-foreground sm:text-4xl">
          Three steps from sign-up to handover
        </h2>
      </motion.div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
        className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-border bg-border md:grid-cols-3"
      >
        {steps.map(({ icon: Icon, number, title, description }) => (
          <motion.div
            key={number}
            variants={cardVariants}
            className="bg-card p-6 sm:p-7 md:p-8"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neon-green/10 text-neon-green">
                <Icon size={18} />
              </div>
              <span className="font-display text-xs tracking-[0.2em] text-muted-foreground">
                {number}
              </span>
            </div>
            <h3 className="mt-6 font-display text-xl tracking-[-0.02em] text-foreground">
              {title}
            </h3>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {description}
            </p>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
