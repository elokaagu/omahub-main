"use client";

import { useCallback, useEffect, useState } from "react";

const DEFAULT_OPTIONS: IntersectionObserverInit = {
  root: null,
  rootMargin: "-20% 0px -20% 0px",
  threshold: 0.1,
};

/**
 * Callback ref + IntersectionObserver: when the section enters view, `isVisible` becomes true
 * and the observer disconnects. Re-renders stay local to this component.
 */
export function useSectionReveal() {
  const [node, setNode] = useState<HTMLElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  const setRef = useCallback((el: HTMLElement | null) => {
    setNode(el);
  }, []);

  useEffect(() => {
    if (!node || isVisible) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) {
        setIsVisible(true);
        observer.disconnect();
      }
    }, DEFAULT_OPTIONS);

    observer.observe(node);
    return () => observer.disconnect();
  }, [node, isVisible]);

  return { ref: setRef, isVisible };
}
