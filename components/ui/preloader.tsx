"use client";

import { useEffect } from "react";

interface PreloaderProps {
  children: React.ReactNode;
}

export function Preloader({ children }: PreloaderProps) {
  useEffect(() => {
    // Prefetch critical data on app load
    const prefetchData = async () => {
      try {
        // Warm server cache + run admin-only filtering on the server — never import
        // performanceService/getAdminClient in the browser bundle.
        await fetch("/api/home/bootstrap", {
          credentials: "same-origin",
        }).catch(() => {});

        // Preload critical images
        const criticalImages = [
          "/lovable-uploads/827fb8c0-e5da-4520-a979-6fc054eefc6e.png",
          "/lovable-uploads/bb152c0b-6378-419b-a0e6-eafce44631b2.png",
          "/placeholder-image.jpg",
        ];

        criticalImages.forEach((src) => {
          const link = document.createElement("link");
          link.rel = "preload";
          link.as = "image";
          link.href = src;
          document.head.appendChild(link);
        });

        // Prefetch critical routes
        const criticalRoutes = ["/directory", "/collections", "/tailors"];

        criticalRoutes.forEach((route) => {
          const link = document.createElement("link");
          link.rel = "prefetch";
          link.href = route;
          document.head.appendChild(link);
        });

        if (process.env.NODE_ENV === "development") {
          console.log("✅ Critical resources preloaded");
        }
      } catch (error) {
        console.error("❌ Error preloading resources:", error);
      }
    };

    // Use requestIdleCallback for better performance
    if (typeof window !== "undefined") {
      if ("requestIdleCallback" in window) {
        requestIdleCallback(prefetchData);
      } else {
        // Fallback for browsers without requestIdleCallback
        setTimeout(prefetchData, 1000);
      }
    }
  }, []);

  return <>{children}</>;
}
