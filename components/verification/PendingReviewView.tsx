"use client";

import { motion, AnimatePresence, type Variants } from "motion/react";
import Link from "next/link";
import {
  ShieldCheck,
  Upload,
  Clock,
  AlertTriangle,
  Mail,
  GraduationCap,
} from "lucide-react";
import { IdDocumentUpload } from "@/components/verification/IdDocumentUpload";

type Mode = "awaiting" | "upload" | "rejected";

interface Props {
  mode: Mode;
  collegeName: string | null;
  maskedEmail: string | null;
  reviewerNotes: string | null;
  /** Hide reviewer notes once the user has re-submitted */
  showReviewerNotes: boolean;
}

const COPY: Record<Mode, { title: string; description: string }> = {
  awaiting: {
    title: "Under review",
    description:
      "We're reviewing your credentials. You'll receive an email when your account is approved — usually within 24 hours.",
  },
  upload: {
    title: "Upload your student ID",
    description:
      "To complete manual review, upload a clear photo or scan of your student ID card. Documents are deleted within 24 hours of a decision.",
  },
  rejected: {
    title: "Verification not approved",
    description:
      "Your previous submission wasn't approved. Upload a clearer photo or scan of your student ID below to start a new review.",
  },
};

function StatusBadge({ mode }: { mode: Mode }) {
  if (mode === "awaiting") {
    return (
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        className="inline-flex items-center gap-2 rounded-full border border-neon-green/30 bg-neon-green/10 px-3 py-1 text-xs font-medium text-neon-green"
      >
        <span className="relative flex h-2 w-2">
          <motion.span
            className="absolute inline-flex h-full w-full rounded-full bg-neon-green/60"
            animate={{ scale: [1, 2.2, 1], opacity: [0.7, 0, 0.7] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
          />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-neon-green" />
        </span>
        Awaiting review
      </motion.div>
    );
  }
  if (mode === "rejected") {
    return (
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        className="inline-flex items-center gap-1.5 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs font-medium text-red-300"
      >
        <AlertTriangle size={12} />
        Action required
      </motion.div>
    );
  }
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className="inline-flex items-center gap-1.5 rounded-full border border-overlay/15 bg-overlay/5 px-3 py-1 text-xs font-medium text-shade-30"
    >
      <Upload size={12} />
      Upload required
    </motion.div>
  );
}

function HeroIcon({ mode }: { mode: Mode }) {
  if (mode === "awaiting") {
    return (
      <div className="relative inline-flex h-14 w-14 items-center justify-center">
        <motion.span
          className="absolute inset-0 rounded-2xl border border-neon-green/30"
          animate={{ scale: [1, 1.25, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeOut" }}
        />
        <motion.span
          className="absolute inset-0 rounded-2xl border border-neon-green/20"
          animate={{ scale: [1, 1.45, 1], opacity: [0.35, 0, 0.35] }}
          transition={{
            duration: 2.4,
            repeat: Infinity,
            ease: "easeOut",
            delay: 0.6,
          }}
        />
        <span className="relative inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-neon-green/10 text-neon-green">
          <Clock size={26} />
        </span>
      </div>
    );
  }
  if (mode === "rejected") {
    return (
      <motion.span
        initial={{ rotate: -8, scale: 0.9 }}
        animate={{ rotate: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 220, damping: 16 }}
        className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 text-red-300"
      >
        <AlertTriangle size={26} />
      </motion.span>
    );
  }
  return (
    <motion.span
      initial={{ y: 6, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-overlay/5 border border-overlay/10 text-foreground"
    >
      <Upload size={26} />
    </motion.span>
  );
}

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
};

const stagger: Variants = {
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
};

export function PendingReviewView({
  mode,
  collegeName,
  maskedEmail,
  reviewerNotes,
  showReviewerNotes,
}: Props) {
  const copy = COPY[mode];
  const showUploader = mode === "upload" || mode === "rejected";

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={stagger}
      className="mx-auto w-full max-w-[680px]"
    >
      <motion.div
        variants={cardVariants}
        className="overflow-hidden rounded-2xl border border-overlay/10 bg-overlay/[0.02] backdrop-blur-sm"
      >
        {/* Header */}
        <div className="space-y-5 p-8 pb-6">
          <div className="flex items-start justify-between gap-4">
            <HeroIcon mode={mode} />
            <StatusBadge mode={mode} />
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
              className="space-y-3"
            >
              <h1 className="font-display text-[34px] font-[330] leading-[1.1] tracking-tight">
                {copy.title}
              </h1>
              <p className="text-base leading-7 text-shade-50">
                {copy.description}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Body */}
        <div className="space-y-6 px-8 pb-8">
          {/* Reviewer note (animated; auto-hides after re-submit) */}
          <AnimatePresence initial={false}>
            {showReviewerNotes && reviewerNotes && (
              <motion.div
                key="reviewer-note"
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{
                  opacity: 1,
                  height: "auto",
                  marginTop: 0,
                  transition: { duration: 0.3, ease: "easeOut" },
                }}
                exit={{
                  opacity: 0,
                  height: 0,
                  transition: { duration: 0.25, ease: "easeIn" },
                }}
                className="overflow-hidden"
              >
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-amber-200">
                  <p className="mb-1 text-xs font-medium uppercase tracking-wide text-amber-300/80">
                    {mode === "rejected" ? "Reason for rejection" : "Reviewer note"}
                  </p>
                  <p className="leading-6">{reviewerNotes}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submitted details */}
          <motion.div
            variants={cardVariants}
            className="space-y-3 rounded-xl border border-overlay/10 bg-overlay/[0.04] p-4"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-shade-50">
              Submitted details
            </p>
            <div className="space-y-2.5 text-sm">
              {collegeName && (
                <div className="flex items-center justify-between gap-4">
                  <span className="inline-flex items-center gap-2 text-shade-50">
                    <GraduationCap size={14} />
                    College
                  </span>
                  <span className="text-right font-medium text-foreground">
                    {collegeName}
                  </span>
                </div>
              )}
              {maskedEmail && (
                <div className="flex items-center justify-between gap-4">
                  <span className="inline-flex items-center gap-2 text-shade-50">
                    <Mail size={14} />
                    Email
                  </span>
                  <span className="font-medium text-foreground">
                    {maskedEmail}
                  </span>
                </div>
              )}
            </div>
          </motion.div>

          {/* Awaiting review progress strip */}
          {mode === "awaiting" && (
            <motion.div
              variants={cardVariants}
              className="rounded-xl border border-overlay/10 bg-overlay/[0.02] p-4"
            >
              <div className="mb-2 flex items-center justify-between">
                <p className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-shade-50">
                  <ShieldCheck size={12} />
                  Reviewer queue
                </p>
                <p className="text-xs text-shade-50">Usually &lt; 24 h</p>
              </div>
              <div className="relative h-1.5 overflow-hidden rounded-full bg-overlay/10">
                <motion.span
                  className="absolute inset-y-0 left-0 w-1/3 rounded-full bg-gradient-to-r from-transparent via-neon-green to-transparent"
                  animate={{ x: ["-100%", "300%"] }}
                  transition={{
                    duration: 2.2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              </div>
            </motion.div>
          )}

          {/* Uploader */}
          <AnimatePresence initial={false}>
            {showUploader && (
              <motion.div
                key="uploader"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.3 }}
              >
                <IdDocumentUpload hasExisting={false} />
              </motion.div>
            )}
          </AnimatePresence>

          {mode === "rejected" && (
            <motion.div
              variants={cardVariants}
              className="flex flex-col gap-3 sm:flex-row"
            >
              <Link
                href="/dashboard"
                className="inline-flex h-11 items-center justify-center rounded-full border border-overlay/20 px-5 text-sm text-foreground transition hover:bg-overlay/5 sm:flex-1"
              >
                Go to workspace
              </Link>
            </motion.div>
          )}

          <motion.p
            variants={cardVariants}
            className="text-xs text-shade-50"
          >
            Questions?{" "}
            <a
              href="mailto:support@peerhelp.app"
              className="text-foreground transition-colors hover:text-neon-green"
            >
              Contact support
            </a>
          </motion.p>
        </div>
      </motion.div>
    </motion.div>
  );
}
