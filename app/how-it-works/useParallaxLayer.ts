"use client";

import { useEffect, type RefObject } from "react";

/**
 * Updates `transform: translateY(...)` on a DOM node via rAF — no React state on scroll.
 */
export function useParallaxLayer(
  ref: RefObject<HTMLElement | null>,
  factor = 0.08,
  maxOffsetPx = 100
) {
  useEffect(() => {
    let raf = 0;

    const tick = () => {
      const y = Math.min(window.scrollY * factor, maxOffsetPx);
      const node = ref.current;
      if (node) {
        node.style.transform = `translateY(${y}px)`;
      }
    };

    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    tick();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
    };
  }, [ref, factor, maxOffsetPx]);
}
