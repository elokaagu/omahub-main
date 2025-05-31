"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { usePathname, useRouter } from "next/navigation";

export function NavigationDebug() {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [navigationHistory, setNavigationHistory] = useState<string[]>([]);

  useEffect(() => {
    setNavigationHistory((prev) => [...prev, pathname].slice(-5)); // Keep last 5 paths
  }, [pathname]);

  // Only show in development
  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black text-white p-4 rounded-lg text-xs max-w-sm z-[9999] opacity-80">
      <div className="font-bold mb-2">Navigation Debug</div>
      <div>Current Path: {pathname}</div>
      <div>User ID: {user?.id || "None"}</div>
      <div>User Email: {user?.email || "None"}</div>
      <div>User Role: {user?.role || "None"}</div>
      <div>Auth Loading: {loading ? "Yes" : "No"}</div>
      <div>Is Studio: {pathname?.startsWith("/studio") ? "Yes" : "No"}</div>
      <div className="mt-2">
        <div className="font-bold">Recent Paths:</div>
        {navigationHistory.map((path, index) => (
          <div key={index} className="text-gray-300">
            {index + 1}. {path}
          </div>
        ))}
      </div>
      <button
        onClick={() => {
          console.log("🔍 Navigation Debug Info:", {
            pathname,
            user,
            loading,
            navigationHistory,
            userAgent: navigator.userAgent,
            cookies: document.cookie,
          });
        }}
        className="mt-2 bg-blue-600 px-2 py-1 rounded text-xs"
      >
        Log Debug Info
      </button>
    </div>
  );
}
