import type { Metadata } from "next";
import "./globals.css";
import RootLayoutClient from "../components/layout/RootLayoutClient";
import { suisseIntl, canela } from "./fonts";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: {
    default: "OmaHub | Personalized Luxury Fashion",
    template: "%s | OmaHub",
  },
  description:
    "Discover personalized luxury fashion, expertly crafted for your unique style. From ready-to-wear collections to bespoke tailoring, find the perfect fit for every occasion.",
  keywords: [
    "personalized fashion",
    "luxury fashion",
    "bespoke tailoring",
    "made to measure",
    "designer collections",
    "custom clothing",
    "fashion technology",
    "sustainable fashion",
    "global fashion",
    "craftsmanship",
  ],
  openGraph: {
    title: "OmaHub | Personalized Luxury Fashion",
    description:
      "Experience fashion that's crafted just for you. Discover designers who blend artistry with innovation.",
    url: "https://omahub.com",
    siteName: "OmaHub",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "OmaHub | Personalized Luxury Fashion",
    description:
      "Experience fashion that's crafted just for you. Discover designers who blend artistry with innovation.",
    images: ["/og-image.jpg"],
    creator: "@omahub",
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
        <RootLayoutClient>{children}</RootLayoutClient>
        <Toaster />
      </body>
    </html>
  );
}
