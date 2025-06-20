import React from "react";
import { cn } from "@/lib/utils";

interface LoadingProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  variant?: "spinner" | "dots" | "pulse" | "skeleton";
  className?: string;
  text?: string;
  fullScreen?: boolean;
}

const sizeClasses = {
  xs: "h-3 w-3",
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-8 w-8",
  xl: "h-12 w-12",
};

const LoadingSpinner = ({
  size = "md",
  className = "",
}: {
  size: LoadingProps["size"];
  className?: string;
}) => (
  <div
    className={cn(
      "animate-spin rounded-full border-2 border-gray-300 border-t-oma-plum",
      sizeClasses[size!],
      className
    )}
  />
);

const LoadingDotsComponent = ({
  size = "md",
  className = "",
}: {
  size: LoadingProps["size"];
  className?: string;
}) => {
  const dotSize =
    size === "xs"
      ? "h-1 w-1"
      : size === "sm"
        ? "h-1.5 w-1.5"
        : size === "md"
          ? "h-2 w-2"
          : size === "lg"
            ? "h-2.5 w-2.5"
            : "h-3 w-3";

  return (
    <div className={cn("flex space-x-1", className)}>
      <div
        className={cn("bg-oma-plum rounded-full animate-bounce", dotSize)}
        style={{ animationDelay: "0ms" }}
      />
      <div
        className={cn("bg-oma-plum rounded-full animate-bounce", dotSize)}
        style={{ animationDelay: "150ms" }}
      />
      <div
        className={cn("bg-oma-plum rounded-full animate-bounce", dotSize)}
        style={{ animationDelay: "300ms" }}
      />
    </div>
  );
};

const LoadingPulse = ({
  size = "md",
  className = "",
}: {
  size: LoadingProps["size"];
  className?: string;
}) => (
  <div
    className={cn(
      "animate-pulse bg-oma-plum/20 rounded-full",
      sizeClasses[size!],
      className
    )}
  />
);

const LoadingSkeleton = ({ className = "" }: { className?: string }) => (
  <div className={cn("animate-pulse bg-gray-200 rounded", className)} />
);

export function Loading({
  size = "md",
  variant = "spinner",
  className = "",
  text,
  fullScreen = false,
}: LoadingProps) {
  const loadingElement = () => {
    switch (variant) {
      case "dots":
        return <LoadingDotsComponent size={size} className={className} />;
      case "pulse":
        return <LoadingPulse size={size} className={className} />;
      case "skeleton":
        return <LoadingSkeleton className={className} />;
      default:
        return <LoadingSpinner size={size} className={className} />;
    }
  };

  const content = (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2",
        text && "space-y-2"
      )}
    >
      {loadingElement()}
      {text && (
        <p className="text-sm text-oma-cocoa/70 animate-pulse">{text}</p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
        {content}
      </div>
    );
  }

  return content;
}

// Convenience components for common use cases
export const LoadingSpinnerComponent = ({
  size = "md",
  className = "",
}: LoadingProps) => (
  <Loading size={size} variant="spinner" className={className} />
);

export const LoadingButton = ({
  size = "sm",
  className = "",
}: LoadingProps) => (
  <Loading size={size} variant="spinner" className={cn("mr-2", className)} />
);

export const LoadingPage = ({ text = "Loading..." }: { text?: string }) => (
  <Loading size="lg" variant="spinner" text={text} fullScreen />
);

export const LoadingCard = ({ className = "" }: { className?: string }) => (
  <Loading variant="skeleton" className={cn("h-48 w-full", className)} />
);

export const LoadingText = ({ className = "" }: { className?: string }) => (
  <Loading variant="skeleton" className={cn("h-4 w-3/4", className)} />
);

export const LoadingDots = LoadingDotsComponent;

// Legacy exports for backward compatibility
export { LoadingSpinnerComponent as LoadingSpinner };

export default Loading;
