"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigation } from "@/contexts/NavigationContext";
import { usePathname, useRouter } from "next/navigation";

export function NavigationDebug() {
  const { user, loading } = useAuth();
  const { isNavigating, forceReset } = useNavigation();
  const pathname = usePathname();
  const router = useRouter();
  const [navigationHistory, setNavigationHistory] = useState<string[]>([]);
  const [navigationStartTime, setNavigationStartTime] = useState<number | null>(
    null
  );
  const [errorCount, setErrorCount] = useState(0);

  useEffect(() => {
    setNavigationHistory((prev) => [...prev, pathname].slice(-5)); // Keep last 5 paths
  }, [pathname]);

  useEffect(() => {
    if (isNavigating && !navigationStartTime) {
      setNavigationStartTime(Date.now());
    } else if (!isNavigating && navigationStartTime) {
      setNavigationStartTime(null);
    }
  }, [isNavigating, navigationStartTime]);

  // Monitor for errors
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      if (
        event.message.includes("navigation") ||
        event.message.includes("router")
      ) {
        setErrorCount((prev) => prev + 1);
        console.error("Navigation-related error detected:", event.error);
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (
        event.reason?.message?.includes("navigation") ||
        event.reason?.message?.includes("router")
      ) {
        setErrorCount((prev) => prev + 1);
        console.error("Navigation-related promise rejection:", event.reason);
      }
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener(
        "unhandledrejection",
        handleUnhandledRejection
      );
    };
  }, []);

  // Only show in development
  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  const navigationDuration = navigationStartTime
    ? Date.now() - navigationStartTime
    : 0;
  const isStuck = isNavigating && navigationDuration > 2000;
  const isVeryStuck = isNavigating && navigationDuration > 5000;

  return (
    <div
      className={`fixed bottom-4 right-4 bg-black text-white p-4 rounded-lg text-xs max-w-sm z-[9999] opacity-90 ${
        isVeryStuck
          ? "border-2 border-red-500 animate-pulse"
          : isStuck
            ? "border-2 border-yellow-500"
            : ""
      }`}
    >
      <div className="font-bold mb-2 flex items-center justify-between">
        Navigation Debug
        {(isStuck || errorCount > 0) && (
          <button
            onClick={forceReset}
            className="bg-red-600 hover:bg-red-700 px-2 py-1 rounded text-xs ml-2"
            title="Force reset stuck navigation"
          >
            Reset
          </button>
        )}
      </div>

      <div>Current Path: {pathname}</div>
      <div>User ID: {user?.id || "None"}</div>
      <div>User Role: {user?.role || "None"}</div>
      <div>Auth Loading: {loading ? "Yes" : "No"}</div>

      <div className={`${isNavigating ? "text-yellow-300" : "text-green-300"}`}>
        Navigation: {isNavigating ? "Loading" : "Idle"}
      </div>

      {isNavigating && navigationDuration > 0 && (
        <div
          className={`${
            isVeryStuck
              ? "text-red-300 font-bold"
              : isStuck
                ? "text-orange-300"
                : "text-yellow-300"
          }`}
        >
          Duration: {Math.round(navigationDuration / 100) / 10}s
          {isVeryStuck && " (VERY STUCK!)"}
          {isStuck && !isVeryStuck && " (STUCK!)"}
        </div>
      )}

      {errorCount > 0 && (
        <div className="text-red-300">Navigation Errors: {errorCount}</div>
      )}

      <div>Is Studio: {pathname?.startsWith("/studio") ? "Yes" : "No"}</div>

      <div className="mt-2">
        <div className="font-bold">Recent Paths:</div>
        {navigationHistory.map((path, index) => (
          <div key={index} className="text-gray-300">
            {index + 1}. {path}
          </div>
        ))}
      </div>

      <div className="flex gap-1 mt-2 flex-wrap">
        <button
          onClick={() => {
            console.log("🔍 Navigation Debug Info:", {
              pathname,
              user,
              loading,
              isNavigating,
              navigationDuration,
              isStuck,
              isVeryStuck,
              navigationHistory,
              errorCount,
              userAgent: navigator.userAgent,
              timestamp: new Date().toISOString(),
            });
          }}
          className="bg-blue-600 px-2 py-1 rounded text-xs"
        >
          Log Debug
        </button>

        {isNavigating && (
          <button
            onClick={forceReset}
            className="bg-orange-600 hover:bg-orange-700 px-2 py-1 rounded text-xs"
          >
            Force Reset
          </button>
        )}

        <button
          onClick={() => {
            setErrorCount(0);
            setNavigationHistory([pathname]);
          }}
          className="bg-gray-600 hover:bg-gray-700 px-2 py-1 rounded text-xs"
        >
          Clear
        </button>

        {isVeryStuck && (
          <button
            onClick={() => {
              console.log("🚨 Emergency page reload triggered");
              window.location.reload();
            }}
            className="bg-red-600 hover:bg-red-700 px-2 py-1 rounded text-xs"
          >
            Reload Page
          </button>
        )}
      </div>

      {isStuck && (
        <div className="mt-2 text-xs text-yellow-200">
          💡 Press Escape key to force reset navigation
        </div>
      )}
    </div>
  );
}
