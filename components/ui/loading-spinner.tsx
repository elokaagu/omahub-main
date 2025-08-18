"use client";

import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  size?: number;
  className?: string;
}

export default function LoadingSpinner({ size = 24, className = "" }: LoadingSpinnerProps) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 
        className={`animate-spin text-oma-plum ${className}`} 
        size={size} 
      />
    </div>
  );
}
