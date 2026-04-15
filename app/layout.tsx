import type { Metadata, Viewport } from "next";
import "./globals.css";
import RootLayoutClient from "../components/layout/RootLayoutClient";
import { Preloader } from "@/components/ui/preloader";
import { fontSans, fontDisplay } from "./fonts";
import { Toaster } from "sonner";
import { Analytics } from "@vercel/analytics/react";
import GoogleAnalytics from "@/components/analytics/GoogleAnalytics";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.oma-hub.com";
const SITE_DESCRIPTION =
  "Discover curated African fashion brands, bespoke tailors, and occasion-ready collections on OmaHub.";

export const metadata: Metadata = {
  title: {
    default: "OmaHub",
    template: "%s | OmaHub",
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "African fashion platform",
    "curated fashion brands",
    "bespoke tailors",
    "custom tailoring",
    "occasion wear",
    "bridal fashion",
    "ready to wear",
    "luxury African designers",
    "made to measure",
    "OmaHub",
    "African fashion",
  ],
  authors: [{ name: "OmaHub Team" }],
  creator: "OmaHub",
  publisher: "OmaHub",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    title: "OmaHub | Curated African Fashion & Bespoke Tailoring",
    description: SITE_DESCRIPTION,
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
    title: "OmaHub | Curated African Fashion & Bespoke Tailoring",
    description: SITE_DESCRIPTION,
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
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "OmaHub",
  },
};

export const viewport: Viewport = {
  themeColor: "#2D1921",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${fontSans.variable} ${fontDisplay.variable}`}
    >
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
