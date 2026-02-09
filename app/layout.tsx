import type { Metadata } from "next";
import "./globals.css";
import RootLayoutClient from "../components/layout/RootLayoutClient";
import { Preloader } from "@/components/ui/preloader";
import { suisseIntl, canela } from "./fonts";
import { Toaster } from "sonner";
import { Analytics } from "@vercel/analytics/react";
import GoogleAnalytics from "@/components/analytics/GoogleAnalytics";

export const metadata: Metadata = {
  title: {
    default: "OmaHub",
    template: "%s | OmaHub",
  },
  description:
    "Discover premium fashion brands, connect with expert tailors, and explore curated collections. Your gateway to luxury fashion and bespoke tailoring from Africa's finest designers.",
  keywords: [
    "fashion",
    "tailoring",
    "bespoke",
    "African fashion",
    "luxury fashion",
    "designer brands",
    "custom clothing",
    "fashion platform",
    "tailor services",
    "fashion collections",
  ],
  authors: [{ name: "OmaHub Team" }],
  creator: "OmaHub",
  publisher: "OmaHub",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://www.oma-hub.com"),
  alternates: {
    canonical: "https://www.oma-hub.com",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://www.oma-hub.com",
    title: "OmaHub",
    description:
      "Discover premium fashion brands, connect with expert tailors, and explore curated collections. Your gateway to luxury fashion and bespoke tailoring from Africa's finest designers.",
    siteName: "OmaHub",
    images: [
      {
        url: "/OmaHubBanner.png",
        width: 1200,
        height: 630,
        alt: "OmaHub",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "OmaHub",
    description:
      "Discover premium fashion brands, connect with expert tailors, and explore curated collections.",
    images: ["/OmaHubBanner.png"],
    creator: "@omahub",
    site: "@omahub",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "your-google-verification-code",
    yandex: "your-yandex-verification-code",
    yahoo: "your-yahoo-verification-code",
  },
  manifest: "/manifest.json",
  themeColor: "#2D1921",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "OmaHub",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${suisseIntl.variable} ${canela.variable}`}>
      <body>
        <Preloader>
          <RootLayoutClient>{children}</RootLayoutClient>
        </Preloader>
        <Toaster position="top-right" duration={2000} />
        <Analytics />
        <GoogleAnalytics />
      </body>
    </html>
  );
}
