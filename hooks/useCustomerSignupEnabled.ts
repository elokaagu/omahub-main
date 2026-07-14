"use client";

import { useEffect, useState } from "react";

/**
 * Whether new customer self-signup is currently offered. OmaHub isn't
 * selling directly through the site yet, so this defaults to (and starts
 * as) false until Studio > Settings turns it on for the next edition's
 * preorders. Designer/admin sign-in is unaffected either way.
 */
export function useCustomerSignupEnabled(): boolean {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/platform-settings");
        const data = await res.json();
        if (!cancelled && data.customerSignupEnabled === "true") {
          setEnabled(true);
        }
      } catch (error) {
        console.error("Error fetching customer signup setting:", error);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return enabled;
}
