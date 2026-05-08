"use client";

import { motion, useInView } from "motion/react";
import { useRef } from "react";
import {
  Banknote,
  ClipboardCheck,
  MapPin,
  ScanLine,
  ShieldCheck,
  Star,
} from "lucide-react";

const ease: [number, number, number, number] = [0.16, 1, 0.3, 1];

const features = [
  {
    icon: ShieldCheck,
    title: "Verified students only",
    description:
      "Every account is tied to a real college identity so the marketplace stays local, credible, and easier to trust.",
  },
  {
    icon: ScanLine,
    title: "ISBN-powered listing flow",
    description:
      "Scan a barcode and let the boring metadata fill itself. Less effort means more real listings instead of half-finished drafts.",
  },
  {
    icon: MapPin,
    title: "Location-aware discovery",
    description:
      "Find what is available near your block, department, or library route without wasting time on impossible handovers.",
  },
  {
    icon: ClipboardCheck,
    title: "Clear deal states",
    description:
      "Requests move from requested to accepted to done, so both sides know exactly where the handover stands.",
  },
  {
    icon: Banknote,
    title: "Zero commission",
    description:
      "The platform does not take a cut. Sellers keep the full amount and buyers avoid inflated pricing.",
  },
  {
    icon: Star,
    title: "Reputation that compounds",
    description:
      "Good sellers get repeat attention, dependable buyers get faster replies, and the network improves over time.",
  },
];

const cardVariants = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.58, ease },
  },
};

export function FeaturesSection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section ref={ref} className="mb-10 sm:mb-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.55, ease }}
        className="mb-10 sm:mb-12"
      >
        <p className="text-[11px] uppercase tracking-[0.22em] text-neon-green">
          Why it feels different
        </p>
        <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <h2 className="max-w-3xl font-display text-3xl tracking-[-0.04em] text-foreground sm:text-4xl md:text-5xl">
            The product is tuned for campus behavior, not retrofitted from generic commerce.
          </h2>
          <p className="max-w-lg text-sm leading-7 text-shade-50 sm:text-base">
            That means fewer vague listings, faster trust decisions, and less friction at the exact moment students need to buy or sell quickly.
          </p>
        </div>
      </motion.div>

      <div className="grid auto-rows-fr grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <motion.div
          variants={cardVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          whileHover={{ y: -4, borderColor: "rgba(255,255,255,0.2)", backgroundColor: "rgba(255,255,255,0.06)" }}
          className="overflow-hidden rounded-[30px] border border-overlay/10 bg-[linear-gradient(155deg,rgba(54,244,164,0.16),rgba(255,255,255,0.04))] p-6 sm:p-7 lg:col-span-2"
        >
          <div className="max-w-2xl">
            <p className="text-[11px] uppercase tracking-[0.22em] text-neon-green">
              Product principle
            </p>
            <h3 className="mt-3 font-display text-3xl tracking-[-0.04em] text-foreground sm:text-4xl">
              If a student can trust the listing in ten seconds, the marketplace works.
            </h3>
            <p className="mt-4 text-sm leading-7 text-shade-50 sm:text-base">
              PeerHelp focuses on the signals that matter most in a real campus transaction:
              who the seller is, where the handover will happen, what condition the item is in,
              and whether both sides can close the deal cleanly.
            </p>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-overlay/10 bg-overlay-inverse/20 p-4">
              <div className="text-[11px] uppercase tracking-[0.22em] text-shade-60">Trust</div>
              <div className="mt-2 text-sm text-foreground">Verified identity and ratings</div>
            </div>
            <div className="rounded-2xl border border-overlay/10 bg-overlay-inverse/20 p-4">
              <div className="text-[11px] uppercase tracking-[0.22em] text-shade-60">Speed</div>
              <div className="mt-2 text-sm text-foreground">Structured listing and pickup flow</div>
            </div>
            <div className="rounded-2xl border border-overlay/10 bg-overlay-inverse/20 p-4">
              <div className="text-[11px] uppercase tracking-[0.22em] text-shade-60">Fit</div>
              <div className="mt-2 text-sm text-foreground">Discovery shaped by campus context</div>
            </div>
          </div>
        </motion.div>

        {features.map(({ icon: Icon, title, description }, index) => (
          <motion.div
            key={title}
            variants={cardVariants}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            transition={{ delay: index * 0.06 }}
            className="rounded-[28px] border border-overlay/10 bg-overlay/[0.03] p-5 sm:p-6"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-neon-green/20 bg-neon-green/10">
              <Icon size={20} className="text-neon-green" />
            </div>
            <h3 className="mt-4 font-display text-2xl tracking-[-0.03em] text-foreground">
              {title}
            </h3>
            <p className="mt-3 text-sm leading-6 text-shade-50">{description}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
