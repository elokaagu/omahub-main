"use client";

import { SectionHeader } from "@/components/ui/section-header";
import { AnimateOnScroll } from "@/components/ui/animate-on-scroll";
import type { ComponentProps } from "react";

type AnimatedSectionHeaderProps = ComponentProps<typeof SectionHeader> & {
  animation?: "slideUp" | "slideInFromRight" | "fadeIn";
  delay?: number;
  duration?: number;
};

export function AnimatedSectionHeader({
  animation = "slideUp",
  delay = 0,
  duration = 0.65,
  ...props
}: AnimatedSectionHeaderProps) {
  return (
    <AnimateOnScroll animation={animation} delay={delay} duration={duration}>
      <SectionHeader {...props} />
    </AnimateOnScroll>
  );
}
