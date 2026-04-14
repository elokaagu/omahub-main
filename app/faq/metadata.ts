import { Metadata } from "next";
import { generateSEOMetadata } from "@/lib/seo";

export const metadata: Metadata = generateSEOMetadata({
  title: "How OmaHub Works | Answers for Shoppers, Stylists & Designers",
  description:
    "Straight answers on discovering curated African fashion, contacting designers, commissions, tailoring, and getting started—whether you are buying, styling, or building a brand on OmaHub.",
  keywords: [
    "how OmaHub works",
    "how to find African fashion designers",
    "how to contact designers on OmaHub",
    "OmaHub for designers",
    "join OmaHub as a brand",
    "African fashion platform FAQ",
    "commission African designer",
    "OmaHub tailoring services",
    "curated fashion marketplace help",
    "OmaHub buyer guide",
    "verified designers Africa",
    "OmaHub account and orders",
    "African fashion discovery questions",
  ],
  url: "/faq",
  type: "website",
  author: "OmaHub",
  section: "FAQ",
  tags: [
    "faq",
    "onboarding",
    "how it works",
    "designers",
    "shoppers",
    "trust",
  ],
});
