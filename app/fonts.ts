import localFont from "next/font/local";

export const suisseIntl = localFont({
  src: [
    {
      path: "../public/fonts/suisse-intl-regular.ttf",
      weight: "400",
      style: "normal",
    },
  ],
  variable: "--font-suisse",
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
});
