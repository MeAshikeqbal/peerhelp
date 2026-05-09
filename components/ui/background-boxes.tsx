"use client";

import React, { memo, useEffect, useState } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

// Theme-matched accent colours (neon-green family + forest fills)
const COLORS = [
  "#36F4A4", // neon-green
  "#C1FBD4", // aloe
  "#D4F9E0", // pistachio
  "#061A1C", // dark-forest
  "#102620", // forest
  "#1a3a2e", // deep forest
  "#0d2e28", // midnight forest
];

const getRandomColor = () => COLORS[Math.floor(Math.random() * COLORS.length)];

const BackgroundBoxesCore = ({ className }: { className?: string }) => {
  const [isMobile, setIsMobile] = useState(true);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Skip entirely on mobile — even 2 400 motion.div elements kills perf on phones
  if (isMobile) return null;

  // Reduced from 150×100 (15 000) to 60×40 (2 400) for desktop
  const rows = new Array(60).fill(1);
  const cols = new Array(40).fill(1);

  return (
    <div
      aria-hidden
      style={{
        transform:
          "translate(-40%,-60%) skewX(-48deg) skewY(14deg) scale(0.675) rotate(0deg) translateZ(0)",
      }}
      className={cn(
        "absolute -top-1/4 left-1/4 z-0 flex h-full w-full -translate-x-1/2 -translate-y-1/2 p-4",
        className
      )}
    >
      {rows.map((_, i) => (
        <motion.div
          key={`row-${i}`}
          className="relative h-8 w-16 border-l border-white/[0.07]"
        >
          {cols.map((_, j) => (
            <motion.div
              key={`col-${j}`}
              whileHover={{
                backgroundColor: getRandomColor(),
                transition: { duration: 0 },
              }}
              animate={{ transition: { duration: 2 } }}
              className="relative h-8 w-16 border-t border-r border-white/[0.07]"
            >
              {j % 2 === 0 && i % 2 === 0 && (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                  className="pointer-events-none absolute -top-[14px] -left-[22px] h-6 w-10 stroke-[1px] text-white/[0.05]"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 6v12m6-6H6"
                  />
                </svg>
              )}
            </motion.div>
          ))}
        </motion.div>
      ))}
    </div>
  );
};

export const BackgroundBoxes = memo(BackgroundBoxesCore);
