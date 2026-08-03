"use client";

import { useEffect, useState } from "react";

/**
 * Whether brand catalogues and products are shown on the public site.
 * Defaults to false until Studio > Settings turns it on for a pop-up/edition.
 */
export function useCataloguesPubliclyVisible(): boolean {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/platform-settings");
        const data = await res.json();
        if (!cancelled && data.cataloguesPubliclyVisible === "true") {
          setVisible(true);
        }
      } catch (error) {
        console.error("Error fetching catalogue visibility setting:", error);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return visible;
}
