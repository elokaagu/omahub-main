"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

interface NavigationContextType {
  isNavigating: boolean;
  setIsNavigating: (loading: boolean) => void;
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

  // Reset navigation loading when pathname changes
  useEffect(() => {
    setIsNavigating(false);
  }, [pathname]);

  // Auto-reset navigation loading after a timeout to prevent stuck states
  useEffect(() => {
    if (isNavigating) {
      const timeout = setTimeout(() => {
        setIsNavigating(false);
      }, 5000); // 5 second timeout

      return () => clearTimeout(timeout);
    }
  }, [isNavigating]);

  const value = {
    isNavigating,
    setIsNavigating,
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
