"use client";

import { useRef, type ReactNode } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { TableRow } from "@/components/ui/table";

import { BLUR_IN_EASE } from "./blurTiming";

export { BLUR_IN_EASE, blurStagger } from "./blurTiming";

const MotionTableRow = motion(TableRow);

type BlurInProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
};

export function BlurIn({
  children,
  className,
  delay = 0,
  duration = 0.65,
}: BlurInProps) {
  const reduceMotion = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, {
    once: true,
    amount: 0.12,
    margin: "80px 0px",
  });
  const skip = reduceMotion === true;

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={skip ? false : { opacity: 0, filter: "blur(16px)", y: 10 }}
      animate={
        skip || inView
          ? { opacity: 1, filter: "blur(0px)", y: 0 }
          : { opacity: 0.4, filter: "blur(16px)", y: 10 }
      }
      transition={{
        duration: skip ? 0 : duration,
        delay: skip || !inView ? 0 : delay,
        ease: BLUR_IN_EASE,
      }}
    >
      {children}
    </motion.div>
  );
}

type BlurInTableRowProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  onClick?: () => void;
};

export function BlurInTableRow({
  children,
  className,
  delay = 0,
  onClick,
}: BlurInTableRowProps) {
  const reduceMotion = useReducedMotion();
  const ref = useRef<HTMLTableRowElement>(null);
  const inView = useInView(ref, {
    once: true,
    amount: 0.2,
    margin: "140px 0px",
  });
  const skip = reduceMotion === true;

  return (
    <MotionTableRow
      ref={ref}
      className={className}
      onClick={onClick}
      initial={skip ? false : { opacity: 0, filter: "blur(14px)" }}
      animate={
        skip || inView
          ? { opacity: 1, filter: "blur(0px)" }
          : { opacity: 0.35, filter: "blur(14px)" }
      }
      transition={{
        duration: skip ? 0 : 0.55,
        delay: skip || !inView ? 0 : delay,
        ease: BLUR_IN_EASE,
      }}
    >
      {children}
    </MotionTableRow>
  );
}

type BlurInLiProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
};

export function BlurInLi({ children, className, delay = 0 }: BlurInLiProps) {
  const reduceMotion = useReducedMotion();
  const ref = useRef<HTMLLIElement>(null);
  const inView = useInView(ref, {
    once: true,
    amount: 0.2,
    margin: "140px 0px",
  });
  const skip = reduceMotion === true;

  return (
    <motion.li
      ref={ref}
      className={className}
      initial={skip ? false : { opacity: 0, filter: "blur(14px)" }}
      animate={
        skip || inView
          ? { opacity: 1, filter: "blur(0px)" }
          : { opacity: 0.35, filter: "blur(14px)" }
      }
      transition={{
        duration: skip ? 0 : 0.55,
        delay: skip || !inView ? 0 : delay,
        ease: BLUR_IN_EASE,
      }}
    >
      {children}
    </motion.li>
  );
}
