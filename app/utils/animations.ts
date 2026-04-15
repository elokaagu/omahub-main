import type { Transition, Variants } from "framer-motion";

/** Default entrance timing — shared so tweaks stay consistent app-wide. */
export const baseTransition: Transition = {
  duration: 0.5,
  ease: "easeOut",
};

/** Slightly quicker exit for `AnimatePresence` unmounts. */
export const exitTransition: Transition = {
  duration: 0.3,
  ease: "easeOut",
};

/** Tunable motion tokens (durations, stagger) for future breakpoints or themes. */
export const motionTokens = {
  staggerChildren: 0.2,
} as const;

export const fadeIn: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: baseTransition,
  },
  exit: {
    opacity: 0,
    y: 10,
    transition: exitTransition,
  },
};

export const staggerChildren: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: motionTokens.staggerChildren,
    },
  },
  exit: {
    opacity: 0,
    transition: exitTransition,
  },
};

export function slideInFrom(
  direction: "left" | "right" | "up" | "down"
): Variants {
  const offset =
    direction === "left"
      ? { x: -20, y: 0 }
      : direction === "right"
        ? { x: 20, y: 0 }
        : direction === "up"
          ? { x: 0, y: -20 }
          : { x: 0, y: 20 };

  return {
    hidden: { opacity: 0, ...offset },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: baseTransition,
    },
    exit: {
      opacity: 0,
      ...offset,
      transition: exitTransition,
    },
  };
}

/** Horizontal slide from the left (same behavior as before this refactor). */
export const slideIn: Variants = slideInFrom("left");

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: baseTransition,
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: exitTransition,
  },
};

/** Container variant for staggered lists — alias of `staggerChildren` for clearer parent/child pairing. */
export const staggerContainer: Variants = staggerChildren;

/** Default child variant to pair with `staggerContainer` / `staggerChildren`. */
export const staggerItem: Variants = fadeIn;

/** Semantic aliases — use these when naming by intent rather than mechanics. */
export const sectionReveal: Variants = fadeIn;
export const cardEntrance: Variants = scaleIn;
export const modalFade: Variants = fadeIn;
export const pageEnter: Variants = fadeIn;
