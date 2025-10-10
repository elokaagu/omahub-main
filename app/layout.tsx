import type { Metadata } from "next";
import "./globals.css";
import RootLayoutClient from "../components/layout/RootLayoutClient";
import { Preloader } from "@/components/ui/preloader";
import { suisseIntl, canela } from "./fonts";
import { Toaster } from "sonner";
import { Analytics } from "@vercel/analytics/react";
import Head from "next/head";
import GoogleAnalytics from "@/components/analytics/GoogleAnalytics";

export const metadata: Metadata = {
  title: {
    default: "OmaHub - Premium Fashion & Tailoring Platform",
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
    title: "OmaHub - Premium Fashion & Tailoring Platform",
    description:
      "Discover premium fashion brands, connect with expert tailors, and explore curated collections. Your gateway to luxury fashion and bespoke tailoring from Africa's finest designers.",
    siteName: "OmaHub",
    images: [
      {
        url: "/OmaHubBanner.png",
        width: 1200,
        height: 630,
        alt: "OmaHub - Premium Fashion & Tailoring Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "OmaHub - Premium Fashion & Tailoring Platform",
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
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${suisseIntl.variable} ${canela.variable}`}>
      <Head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#2D1921" />
        <link rel="apple-touch-icon" href="/favicon.png" />
      </Head>
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
