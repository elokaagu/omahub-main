"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { Transition } from "framer-motion";
import type { ReactNode } from "react";

/** `useReducedMotion()` can be `null` until the client has resolved the preference. */
function instantIfReduced(reduce: boolean | null, transition: Transition) {
  return reduce === true ? { duration: 0 } : transition;
}

const EASE_STANDARD: [number, number, number, number] = [0.4, 0, 0.2, 1];

type MotionWrapperProps = {
  children: ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
};

// Basic page transition
export function PageFade({ children }: { children: ReactNode }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduce ? undefined : { opacity: 0, y: -4 }}
      transition={instantIfReduced(reduce, {
        duration: 0.34,
        ease: EASE_STANDARD,
      })}
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
}: MotionWrapperProps) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={instantIfReduced(reduce, {
        duration,
        delay,
        ease: EASE_STANDARD,
      })}
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
}: MotionWrapperProps) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={instantIfReduced(reduce, {
        duration,
        delay,
        ease: EASE_STANDARD,
      })}
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
}: MotionWrapperProps) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={instantIfReduced(reduce, {
        duration,
        delay,
        ease: EASE_STANDARD,
      })}
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
  if (reduce === true) {
    return <div className={className}>{children}</div>;
  }

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay,
        delayChildren: delay,
        ease: EASE_STANDARD,
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
  if (reduce === true) {
    return <div className={className}>{children}</div>;
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: {
      opacity: 1,
      y: 0,
      transition: instantIfReduced(reduce, {
        duration: 0.42,
        ease: EASE_STANDARD,
      }),
    },
  };

  return (
    <motion.div variants={item} className={className}>
      {children}
    </motion.div>
  );
}
