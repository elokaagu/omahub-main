import type { Metadata } from "next";
import { generateSEOMetadata } from "@/lib/seo";

export const metadata: Metadata = generateSEOMetadata({
  title: "How OmaHub Works | For Designers, Shoppers & Tailors",
  description:
    "How OmaHub connects verified African fashion designers with a global audience — curated editions, a taste-led directory, and bespoke tailoring. For brands, clients, and stylists.",
  keywords: [
    "how OmaHub works",
    "join OmaHub as designer",
    "African fashion platform",
    "verified fashion directory",
    "fashion pop-up editions",
    "commission African designer",
    "curated fashion discovery",
  ],
  url: "/how-it-works",
  type: "website",
  section: "How It Works",
  tags: ["how it works", "designers", "shoppers", "tailors"],
});

export default function HowItWorksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
