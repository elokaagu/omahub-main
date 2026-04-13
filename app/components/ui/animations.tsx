"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

function instantIfReduced(reduce: boolean, transition: Record<string, unknown>) {
  return reduce ? { duration: 0 } : transition;
}

// Basic page transition
export function PageFade({ children }: { children: ReactNode }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={reduce ? undefined : { opacity: 0 }}
      transition={instantIfReduced(reduce, { duration: 0.3 })}
    >
      {children}
    </motion.div>
  );
}

// Fade in animation
export function FadeIn({
  children,
  delay = 0,
  duration = 0.5,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={instantIfReduced(reduce, { duration, delay })}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Slide up animation
export function SlideUp({
  children,
  delay = 0,
  duration = 0.5,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={instantIfReduced(reduce, { duration, delay })}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Scale in animation
export function ScaleIn({
  children,
  delay = 0,
  duration = 0.5,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={instantIfReduced(reduce, { duration, delay })}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Staggered children animation container
export function StaggerContainer({
  children,
  delay = 0.1,
  staggerDelay = 0.1,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  staggerDelay?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const container = {
    hidden: { opacity: reduce ? 1 : 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: reduce ? 0 : staggerDelay,
        delayChildren: reduce ? 0 : delay,
      },
    },
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Stagger item
export function StaggerItem({
  children,
  index: _index = 0,
  className = "",
}: {
  children: ReactNode;
  /** Reserved for future per-item timing; stagger order follows DOM order. */
  index?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const item = {
    hidden: { opacity: reduce ? 1 : 0, y: reduce ? 0 : 20 },
    show: {
      opacity: 1,
      y: 0,
      transition: instantIfReduced(reduce, {
        duration: 0.5,
        ease: "easeOut",
      }),
    },
  };

  return (
    <motion.div variants={item} className={className}>
      {children}
    </motion.div>
  );
}
