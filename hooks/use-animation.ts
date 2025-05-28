"use client";

import { useEffect, useRef } from "react";
import { useAnimation } from "framer-motion";
import { useInView } from "framer-motion";

export function useAnimateOnScroll(options = {}) {
  const { once = true, amount = 0.2 } = options;

  const controls = useAnimation();
  const ref = useRef(null);
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

export const slideLeft = {
  hidden: { opacity: 0, x: 30 },
  visible: { opacity: 1, x: 0 },
};

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1 },
};
