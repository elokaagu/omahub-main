"use client";

interface LoadingSpinnerProps {
  size?: number;
  className?: string;
}

/** Full-viewport placeholder without a rotating spinner (legacy name kept for imports). */
export default function LoadingSpinner({
  size = 24,
  className = "",
}: LoadingSpinnerProps) {
  const s = Math.max(16, size);
  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <div
        className={`rounded-full border-2 border-oma-plum/35 bg-oma-plum/10 animate-pulse ${className}`}
        style={{ width: s, height: s }}
        aria-hidden
      />
    </div>
  );
}
