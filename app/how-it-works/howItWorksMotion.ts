import type { CSSProperties } from "react";

export function sectionEnterStyle(visible: boolean): CSSProperties {
  return {
    transform: `translateY(${visible ? 0 : 50}px)`,
    opacity: visible ? 1 : 0,
    transition:
      "transform 0.8s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
  };
}

export function textStaggerStyle(
  visible: boolean,
  delaySec: number
): CSSProperties {
  return {
    transform: `translateY(${visible ? 0 : 40}px)`,
    opacity: visible ? 1 : 0,
    transition: `transform 1s cubic-bezier(0.25, 0.46, 0.45, 0.94) ${delaySec}s, opacity 1s cubic-bezier(0.25, 0.46, 0.45, 0.94) ${delaySec}s`,
  };
}

/** Fade/slide heading reveal (avoids width/nowrap typewriter fragility). */
export function headingRevealStyle(visible: boolean): CSSProperties {
  return textStaggerStyle(visible, 0);
}
