import Script from "next/script";
import { GA_MEASUREMENT_ID } from "@/lib/config/analytics";

/**
 * Google Analytics 4 — direct gtag.js integration.
 * Loads after the page is interactive so it never blocks rendering.
 * Measurement ID is read from NEXT_PUBLIC_GA_ID env var,
 * falling back to the value in lib/config/analytics.ts.
 */
export default function GoogleAnalytics() {
  if (!GA_MEASUREMENT_ID) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script
        id="ga4-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}', {
              page_path: window.location.pathname,
            });
          `,
        }}
      />
    </>
  );
}
