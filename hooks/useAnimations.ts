"use client";

import { useEffect } from "react";
import { useAnimation } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef, RefObject } from "react";

export function useAnimateOnScroll<T extends HTMLElement = HTMLDivElement>(
  options: {
    once?: boolean;
    amount?: number | "some" | "all";
    delay?: number;
    threshold?: number;
  } = {}
) {
  const { once = true, amount = 0.2, delay = 0, threshold = 0.2 } = options;

  const controls = useAnimation();
  const ref = useRef<T>(null);
  const isInView = useInView(ref, { once, amount });

  useEffect(() => {
    if (isInView) {
      controls.start("visible");
    } else if (!once) {
      controls.start("hidden");
    }
  }, [isInView, controls, once]);

  return { ref, controls, isInView };
}

// Common animation variants
export const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

export const slideUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

export const slideRight = {
  hidden: { opacity: 0, x: -30 },
  visible: { opacity: 1, x: 0 },
};

export const slideLeft = {
  hidden: { opacity: 0, x: 30 },
  visible: { opacity: 1, x: 0 },
};

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1 },
};

export const staggerContainer = (staggerChildren = 0.1, delayChildren = 0) => ({
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren,
      delayChildren,
    },
  },
});
