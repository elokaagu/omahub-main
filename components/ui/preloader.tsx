"use client";

import { useEffect } from "react";
import { performanceService } from "@/lib/services/performanceService";

interface PreloaderProps {
  children: React.ReactNode;
}

export function Preloader({ children }: PreloaderProps) {
  useEffect(() => {
    // Prefetch critical data on app load
    const prefetchData = async () => {
      try {
        // Start prefetching critical data
        await performanceService.prefetchCriticalData();

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

        // Preload critical fonts
        const criticalFonts = [
          "/fonts/Canela-Regular-Trial.otf",
          "/fonts/suisse-intl-regular.ttf",
          "/fonts/SuisseIntl-SemiBold.ttf",
        ];

        criticalFonts.forEach((src) => {
          const link = document.createElement("link");
          link.rel = "preload";
          link.as = "font";
          link.type = "font/otf";
          link.href = src;
          link.crossOrigin = "anonymous";
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

        console.log("✅ Critical resources preloaded");
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
