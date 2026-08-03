"use client";

import { cn } from "@/lib/utils";
import type { AutosaveStatus } from "@/lib/hooks/useAutosave";
import { Check, CloudOff, Loader2 } from "lucide-react";

type AutosaveIndicatorProps = {
  status: AutosaveStatus;
  lastSavedAt?: Date | null;
  className?: string;
};

function formatSavedTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export function AutosaveIndicator({
  status,
  lastSavedAt,
  className,
}: AutosaveIndicatorProps) {
  if (status === "idle" && !lastSavedAt) return null;

  const label =
    status === "pending"
      ? "Unsaved changes…"
      : status === "saving"
        ? "Saving…"
        : status === "saved"
          ? lastSavedAt
            ? `Saved ${formatSavedTime(lastSavedAt)}`
            : "Saved"
          : status === "error"
            ? "Save failed — retry by editing"
            : lastSavedAt
              ? `Saved ${formatSavedTime(lastSavedAt)}`
              : null;

  if (!label) return null;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium",
        status === "error"
          ? "bg-red-50 text-red-700 ring-1 ring-red-200"
          : status === "pending"
            ? "bg-amber-50 text-amber-800 ring-1 ring-amber-200"
            : "bg-oma-cream/80 text-oma-cocoa ring-1 ring-oma-cocoa/10",
        className,
      )}
      aria-live="polite"
    >
      {status === "saving" ? (
        <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
      ) : status === "error" ? (
        <CloudOff className="h-3 w-3" aria-hidden />
      ) : status === "saved" || (status === "idle" && lastSavedAt) ? (
        <Check className="h-3 w-3 text-emerald-600" aria-hidden />
      ) : null}
      <span>{label}</span>
    </div>
  );
}
