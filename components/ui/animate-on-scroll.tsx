"use client";

import { ReactNode, useEffect, useRef } from "react";
import { motion, useInView, useAnimation, useReducedMotion } from "framer-motion";

export type ScrollAnimation =
  | "fadeIn"
  | "slideUp"
  | "slideLeft"
  | "slideRight"
  | "slideInFromRight"
  | "scale";

const SCROLL_VARIANTS = {
  fadeIn: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  },
  slideUp: {
    hidden: { opacity: 0, y: 32 },
    visible: { opacity: 1, y: 0 },
  },
  slideLeft: {
    hidden: { opacity: 0, x: 40 },
    visible: { opacity: 1, x: 0 },
  },
  slideRight: {
    hidden: { opacity: 0, x: -40 },
    visible: { opacity: 1, x: 0 },
  },
  slideInFromRight: {
    hidden: { opacity: 0, x: 56 },
    visible: { opacity: 1, x: 0 },
  },
  scale: {
    hidden: { opacity: 0, scale: 0.92 },
    visible: { opacity: 1, scale: 1 },
  },
} as const;

const SCROLL_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

interface AnimateOnScrollProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
  animation?: ScrollAnimation;
  className?: string;
  once?: boolean;
}

export function AnimateOnScroll({
  children,
  delay = 0,
  duration = 0.6,
  animation = "fadeIn",
  className = "",
  once = true,
}: AnimateOnScrollProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once, amount: 0.2, margin: "0px 0px -8% 0px" });
  const controls = useAnimation();
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (isInView) {
      controls.start("visible");
    } else if (!once) {
      controls.start("hidden");
    }
  }, [isInView, controls, once]);

  const selectedVariant = SCROLL_VARIANTS[animation];

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={controls}
      variants={selectedVariant}
      transition={{ duration, delay, ease: SCROLL_EASE }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

type StaggerOnScrollProps = {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
  delay?: number;
  once?: boolean;
};

/** Stagger child `StaggerOnScrollItem` elements when the container enters view. */
export function StaggerOnScroll({
  children,
  className = "",
  staggerDelay = 0.1,
  delay = 0,
  once = true,
}: StaggerOnScrollProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once, amount: 0.15, margin: "0px 0px -8% 0px" });
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: staggerDelay,
            delayChildren: delay,
          },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

type StaggerOnScrollItemProps = {
  children: ReactNode;
  animation?: ScrollAnimation;
  duration?: number;
  className?: string;
};

export function StaggerOnScrollItem({
  children,
  animation = "slideUp",
  duration = 0.6,
  className = "",
}: StaggerOnScrollItemProps) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      variants={SCROLL_VARIANTS[animation]}
      transition={{ duration, ease: SCROLL_EASE }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
