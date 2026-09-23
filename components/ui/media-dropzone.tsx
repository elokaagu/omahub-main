"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type MediaDropzoneProps = {
  icon: LucideIcon;
  /** Line above the format hint, e.g. "Click to upload an image". */
  title: string;
  /** Formats and size limit. One line or two must not change the height. */
  hint: string;
  /** Upload buttons. */
  children?: React.ReactNode;
  /** A shorter box for tight spaces, e.g. inside a table row. */
  compact?: boolean;
  onClick?: () => void;
  className?: string;
};

/**
 * The empty state every upload field shares.
 *
 * The fixed minimum height is the point of it: two of these sit side by side
 * often enough (a video next to its thumbnail) that letting a one-line hint
 * wrap to two lines leave the boxes different heights was breaking the
 * rhythm of the page. Anything taller than the floor still grows.
 */
export function MediaDropzone({
  icon: Icon,
  title,
  hint,
  children,
  compact = false,
  onClick,
  className,
}: MediaDropzoneProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 text-center transition-colors",
        compact ? "min-h-[9rem] p-4" : "min-h-[13.5rem] p-8",
        onClick && "cursor-pointer hover:bg-gray-50",
        className
      )}
    >
      <Icon
        className={cn("text-gray-400", compact ? "h-7 w-7" : "h-10 w-10")}
        aria-hidden
      />
      <p
        className={cn(
          "font-medium text-gray-900",
          compact ? "mt-2 text-sm" : "mt-3 text-sm"
        )}
      >
        {title}
      </p>
      <p className="mt-1 text-xs text-gray-500">{hint}</p>
      {children && (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          {children}
        </div>
      )}
    </div>
  );
}
