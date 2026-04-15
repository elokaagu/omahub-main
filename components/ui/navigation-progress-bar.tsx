"use client";

import { cn } from "@/lib/utils";

type NavigationProgressBarProps = {
  visible: boolean;
  className?: string;
};

/**
 * Non-blocking indeterminate bar at the top of the viewport while
 * `NavigationContext` reports `isNavigating` (e.g. after in-app link clicks).
 */
export function NavigationProgressBar({
  visible,
  className,
}: NavigationProgressBarProps) {
  if (!visible) return null;

  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-x-0 top-0 z-[1010] h-[3px] overflow-hidden bg-black/[0.06]",
        className
      )}
      role="progressbar"
      aria-busy="true"
      aria-valuetext="Loading next page"
    >
      <div
        className={cn(
          "navigation-progress-strip h-full w-[38%] rounded-r-full bg-oma-plum",
          "shadow-[0_0_12px_rgba(58,30,45,0.35)]"
        )}
      />
    </div>
  );
}
