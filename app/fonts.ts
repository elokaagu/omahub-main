import localFont from "next/font/local";

/** Paths stay under `public/fonts` so `/fonts/...` preloads remain valid. */
export const suisseIntl = localFont({
  src: [
    {
      path: "../public/fonts/suisse-intl-regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/SuisseIntl-SemiBold.ttf",
      weight: "600",
      style: "normal",
    },
  ],
  variable: "--font-suisse",
  display: "swap",
  fallback: [
    "system-ui",
    "-apple-system",
    "BlinkMacSystemFont",
    "Segoe UI",
    "Roboto",
    "Helvetica Neue",
    "Arial",
    "sans-serif",
  ],
  adjustFontFallback: "Arial",
});

export const canela = localFont({
  src: [
    {
      path: "../public/fonts/Canela-Regular-Trial.otf",
      weight: "400",
      style: "normal",
    },
  ],
  variable: "--font-canela",
  display: "swap",
  fallback: [
    "Georgia",
    "Cambria",
    "Times New Roman",
    "Times",
    "serif",
  ],
  adjustFontFallback: "Times New Roman",
});

export const fontSans = suisseIntl;
export const fontDisplay = canela;
