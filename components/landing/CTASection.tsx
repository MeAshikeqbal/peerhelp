"use client";

import { motion, useInView } from "motion/react";
import { useRef } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const ease: [number, number, number, number] = [0.16, 1, 0.3, 1];

export function CTASection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <motion.section
      ref={ref}
      initial={{ opacity: 0, y: 18 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, ease }}
      className="border-t border-border py-24 sm:py-32"
    >
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="font-display text-3xl tracking-[-0.04em] text-foreground sm:text-5xl">
          Ready to see what your campus is selling?
        </h2>
        <p className="mt-5 text-base leading-7 text-muted-foreground">
          Free account, college email verification, no fees. Setup takes about 30 seconds.
        </p>
        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button asChild size="lg" className="w-full sm:w-auto">
            <Link href="/auth/sign-up" className="inline-flex items-center gap-2">
              Create free account
              <ArrowRight size={16} />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
            <Link href="/marketplace">Browse marketplace</Link>
          </Button>
        </div>
      </div>
    </motion.section>
  );
}
