"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
} from "react";
import { usePathname, useRouter } from "next/navigation";

interface NavigationContextType {
  isNavigating: boolean;
  setIsNavigating: (loading: boolean) => void;
  forceReset: () => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(
  undefined
);

export function NavigationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isNavigating, setIsNavigating] = useState(false);
  const pathname = usePathname();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const navigationStartRef = useRef<number | null>(null);

  // Force reset function for emergency cases
  const forceReset = () => {
    console.log("🔄 Navigation: Force reset triggered");
    setIsNavigating(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    navigationStartRef.current = null;
  };

  // Reset navigation loading when pathname changes
  useEffect(() => {
    if (isNavigating) {
      console.log(
        "✅ Navigation: Pathname changed, resetting navigation state"
      );
    }
    setIsNavigating(false);

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    navigationStartRef.current = null;
  }, [pathname]);

  // Enhanced timeout handling with debugging
  useEffect(() => {
    if (isNavigating) {
      navigationStartRef.current = Date.now();
      console.log("🚀 Navigation: Started at", new Date().toISOString());

      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Set a timeout to prevent stuck states
      timeoutRef.current = setTimeout(() => {
        const duration = navigationStartRef.current
          ? Date.now() - navigationStartRef.current
          : 0;

        console.warn("⚠️ Navigation: Timeout reached after", duration, "ms");
        console.warn("⚠️ Navigation: Current pathname:", pathname);
        console.warn("⚠️ Navigation: Force resetting navigation state");

        setIsNavigating(false);
        navigationStartRef.current = null;
        timeoutRef.current = null;
      }, 3000); // Reduced to 3 seconds for better UX
    } else {
      // Clear timeout when navigation completes normally
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      if (navigationStartRef.current) {
        const duration = Date.now() - navigationStartRef.current;
        console.log("✅ Navigation: Completed in", duration, "ms");
        navigationStartRef.current = null;
      }
    }

    // Cleanup function
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [isNavigating, pathname]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const value = {
    isNavigating,
    setIsNavigating,
    forceReset,
  };

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error("useNavigation must be used within a NavigationProvider");
  }
  return context;
}
