import React from "react";

interface LoadingProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export function Loading({ size = "md", className = "" }: LoadingProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
    xl: "h-16 w-16",
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div
        className={`${sizeClasses[size]} border-4 border-gray-200 border-t-oma-plum rounded-full animate-spin`}
        style={{
          animation: "spin 1s linear infinite",
        }}
      />
    </div>
  );
}

export function LoadingSpinner({ size = "md", className = "" }: LoadingProps) {
  return <Loading size={size} className={className} />;
}

export function LoadingPage() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loading size="lg" />
    </div>
  );
}

export function LoadingButton() {
  return <Loading size="sm" className="mr-2" />;
}
