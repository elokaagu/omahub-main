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

  // Only show in development
  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  const navigationDuration = navigationStartTime
    ? Date.now() - navigationStartTime
    : 0;
  const isStuck = isNavigating && navigationDuration > 2000; // Consider stuck after 2 seconds

  return (
    <div
      className={`fixed bottom-4 right-4 bg-black text-white p-4 rounded-lg text-xs max-w-sm z-[9999] opacity-90 ${isStuck ? "border-2 border-red-500" : ""}`}
    >
      <div className="font-bold mb-2 flex items-center justify-between">
        Navigation Debug
        {isStuck && (
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
      <div>User Email: {user?.email || "None"}</div>
      <div>User Role: {user?.role || "None"}</div>
      <div>Auth Loading: {loading ? "Yes" : "No"}</div>
      <div className={`${isNavigating ? "text-yellow-300" : "text-green-300"}`}>
        Navigation: {isNavigating ? "Loading" : "Idle"}
      </div>
      {isNavigating && navigationDuration > 0 && (
        <div className={`${isStuck ? "text-red-300" : "text-yellow-300"}`}>
          Duration: {Math.round(navigationDuration / 100) / 10}s
          {isStuck && " (STUCK!)"}
        </div>
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
      <div className="flex gap-1 mt-2">
        <button
          onClick={() => {
            console.log("🔍 Navigation Debug Info:", {
              pathname,
              user,
              loading,
              isNavigating,
              navigationDuration,
              isStuck,
              navigationHistory,
              userAgent: navigator.userAgent,
              cookies: document.cookie,
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
      </div>
    </div>
  );
}
