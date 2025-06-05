"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback,
} from "react";
import { usePathname } from "next/navigation";

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
  const [isNavigating, setIsNavigatingState] = useState(false);
  const pathname = usePathname();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const navigationStartRef = useRef<number | null>(null);
  const isResettingRef = useRef(false);

  // Improved setIsNavigating with better state management
  const setIsNavigating = useCallback((loading: boolean) => {
    // Prevent rapid state changes
    if (isResettingRef.current) return;

    console.log(`🔄 Navigation: Setting isNavigating to ${loading}`);
    setIsNavigatingState(loading);

    if (loading) {
      navigationStartRef.current = Date.now();
    } else {
      if (navigationStartRef.current) {
        const duration = Date.now() - navigationStartRef.current;
        console.log(`✅ Navigation: Completed in ${duration}ms`);
      }
      navigationStartRef.current = null;
    }
  }, []);

  // Improved force reset function
  const forceReset = useCallback(() => {
    console.log("🔄 Navigation: Force reset triggered");
    isResettingRef.current = true;

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    setIsNavigatingState(false);
    navigationStartRef.current = null;

    // Reset the resetting flag after a brief delay
    setTimeout(() => {
      isResettingRef.current = false;
    }, 100);
  }, []);

  // Reset navigation loading when pathname changes
  useEffect(() => {
    if (isNavigating) {
      console.log(
        "✅ Navigation: Pathname changed, resetting navigation state"
      );
      forceReset();
    }
  }, [pathname, isNavigating, forceReset]);

  // Timeout handling for stuck navigation states
  useEffect(() => {
    if (isNavigating && !isResettingRef.current) {
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Set a timeout to prevent stuck states
      timeoutRef.current = setTimeout(() => {
        const duration = navigationStartRef.current
          ? Date.now() - navigationStartRef.current
          : 0;

        console.warn(`⚠️ Navigation: Timeout reached after ${duration}ms`);
        console.warn(`⚠️ Navigation: Current pathname: ${pathname}`);
        console.warn("⚠️ Navigation: Auto-resetting stuck navigation state");

        forceReset();
      }, 2500); // Reduced timeout for better UX
    } else {
      // Clear timeout when navigation completes
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    }

    // Cleanup function
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [isNavigating, pathname, forceReset]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Emergency reset on window focus (helps with stuck states)
  useEffect(() => {
    const handleFocus = () => {
      if (isNavigating && navigationStartRef.current) {
        const duration = Date.now() - navigationStartRef.current;
        if (duration > 5000) {
          console.warn(
            "⚠️ Navigation: Long-running navigation detected on focus, resetting"
          );
          forceReset();
        }
      }
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [isNavigating, forceReset]);

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
