import type { PointerEvent } from "react";

/**
 * cmdk `onSelect` often does not fire on iOS Safari touch. Run the action on
 * touch `pointerdown` (before the popover blurs) and keep `onSelect` for keyboard.
 */
export function cmdkSelectHandlers(run: () => void) {
  return {
    onSelect: () => run(),
    onPointerDown: (e: PointerEvent) => {
      if (e.pointerType === "touch") {
        e.preventDefault();
        run();
      }
    },
  };
}
