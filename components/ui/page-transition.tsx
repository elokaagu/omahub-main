"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Material-style “standard” easing — snappier than linear / default ease. */
export const MOTION_EASE = [0.4, 0, 0.2, 1] as const;

type PageTransitionProps = {
  /** Typically `usePathname()` so route changes re-run enter animation. */
  routeKey: string;
  children: ReactNode;
  className?: string;
  /** Slightly subtler motion for dense studio UIs. */
  variant?: "marketing" | "studio";
};

export function PageTransition({
  routeKey,
  children,
  className,
  variant = "marketing",
}: PageTransitionProps) {
  const reduce = useReducedMotion();
  const y = variant === "studio" ? 8 : 12;

  return (
    <motion.div
      key={routeKey}
      className={cn(className)}
      initial={reduce ? false : { opacity: 0, y }}
      animate={{ opacity: 1, y: 0 }}
      transition={
        reduce
          ? { duration: 0 }
          : {
              duration: variant === "studio" ? 0.28 : 0.34,
              ease: MOTION_EASE,
            }
      }
    >
      {children}
    </motion.div>
  );
}
