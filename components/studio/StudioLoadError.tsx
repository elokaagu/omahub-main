"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

/**
 * Error state for server-rendered Studio pages. "Try again" re-runs the
 * page's server render instead of reloading the whole app.
 */
export function StudioLoadError({ message }: { message: string }) {
  const router = useRouter();
  const [retrying, startRetry] = useTransition();

  return (
    <div className="flex items-center justify-center min-h-[60vh] px-4">
      <div className="text-center max-w-md">
        <h3 className="text-lg font-semibold text-gray-900">
          Something went wrong
        </h3>
        <p className="mt-2 text-gray-600">{message}</p>
        <Button
          className="mt-6"
          variant="outline"
          disabled={retrying}
          onClick={() => startRetry(() => router.refresh())}
        >
          {retrying ? "Retrying…" : "Try again"}
        </Button>
      </div>
    </div>
  );
}
