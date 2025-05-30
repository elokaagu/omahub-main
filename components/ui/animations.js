"use client";

import { motion } from "framer-motion";
import React from "react";

// Basic page transition
export const PageFade = ({ children }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.3 }}
  >
    {children}
  </motion.div>
);

// Fade in animation
export const FadeIn = ({ children, delay = 0, duration = 0.5 }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration, delay }}
  >
    {children}
  </motion.div>
);

// Slide up animation
export const SlideUp = ({ children, delay = 0, duration = 0.5 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration, delay }}
  >
    {children}
  </motion.div>
);

// Scale animation
export const ScaleIn = ({ children, delay = 0, duration = 0.5 }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration, delay }}
  >
    {children}
  </motion.div>
);

// Staggered children animation container
export const StaggerContainer = ({
  children,
  delay = 0.1,
  staggerDelay = 0.1,
}) => {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay,
        delayChildren: delay,
      },
    },
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show">
      {children}
    </motion.div>
  );
};

// Staggered child item
export const StaggerItem = ({ children }) => {
  const item = {
    hidden: { opacity: 0, y: 20 },
    show: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 300, damping: 24 },
    },
  };

  return <motion.div variants={item}>{children}</motion.div>;
};
