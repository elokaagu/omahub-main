import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import GoogleAnalytics from "@/components/analytics/GoogleAnalytics";

export const revalidate = 0;

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "OmaHub - Luxury Fashion & Design",
  description:
    "Discover and connect with the world's finest fashion designers, tailors, and luxury brands. Experience bespoke fashion and exceptional craftsmanship.",
  keywords: [
    "luxury fashion",
    "bespoke tailoring",
    "designer clothes",
    "fashion brands",
    "tailors",
    "custom clothing",
  ],
  authors: [{ name: "OmaHub" }],
  creator: "OmaHub",
  publisher: "OmaHub",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://omahub.com"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "OmaHub - Luxury Fashion & Design",
    description:
      "Discover and connect with the world's finest fashion designers, tailors, and luxury brands.",
    url: "https://omahub.com",
    siteName: "OmaHub",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "OmaHub - Luxury Fashion & Design",
      },
    ],
    locale: "en_GB",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "OmaHub - Luxury Fashion & Design",
    description:
      "Discover and connect with the world's finest fashion designers, tailors, and luxury brands.",
    images: ["/og-image.jpg"],
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
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <Toaster />
        <GoogleAnalytics />
      </body>
    </html>
  );
}
