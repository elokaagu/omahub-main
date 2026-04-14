import { toast as sonnerToast } from "sonner";

export type AppToastSeverity = "success" | "error" | "info" | "warning";

export interface ShowToastInput {
  /** Primary line (Sonner title). */
  message: string;
  type?: AppToastSeverity;
  /** Overrides the default duration for this severity. */
  duration?: number;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const DEFAULT_DURATION_MS: Record<AppToastSeverity, number> = {
  success: 3000,
  error: 5500,
  info: 3500,
  warning: 4500,
};

function toSonnerOptions(
  type: AppToastSeverity,
  duration: number | undefined,
  description?: string,
  action?: ShowToastInput["action"]
) {
  const ms = duration ?? DEFAULT_DURATION_MS[type];
  return {
    duration: ms,
    ...(description ? { description } : {}),
    ...(action
      ? {
          action: {
            label: action.label,
            onClick: () => {
              action.onClick();
            },
          },
        }
      : {}),
  };
}

/**
 * App-wide Sonner helper: stable module function (not a React hook), typed severities,
 * distinct warning/error/success/info styling, and defaults per severity.
 *
 * For raw Sonner APIs (`toast.promise`, etc.), import `toast` from `"sonner"` in that file only.
 */
export function showToast({
  message,
  type = "info",
  duration,
  description,
  action,
}: ShowToastInput): string | number {
  const opts = toSonnerOptions(type, duration, description, action);

  switch (type) {
    case "success":
      return sonnerToast.success(message, opts);
    case "error":
      return sonnerToast.error(message, opts);
    case "warning":
      return sonnerToast.warning(message, opts);
    case "info":
      return sonnerToast.info(message, opts);
    default:
      return sonnerToast.info(message, opts);
  }
}

/**
 * @deprecated Prefer `showToast` — this is not a hook (no state/effects). Kept for any legacy imports.
 */
export function useToast() {
  return { toast: showToast };
}
