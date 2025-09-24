import { Metadata } from "next";
import { generateSEOMetadata } from "@/lib/seo";

export const metadata: Metadata = generateSEOMetadata({
  title: "Expert Tailors - Premium Tailoring Services",
  description:
    "Connect with expert tailors and seamstresses for bespoke clothing, alterations, and custom fashion pieces. Find verified tailoring professionals for all your fashion needs.",
  keywords: [
    "expert tailors",
    "tailoring services",
    "bespoke clothing",
    "custom tailoring",
    "alterations",
    "seamstresses",
    "fashion tailoring",
    "custom clothing",
    "professional tailors",
    "tailoring experts",
  ],
  url: "/tailors",
  type: "website",
  author: "OmaHub",
  section: "Tailors",
  tags: ["tailors", "tailoring", "bespoke", "custom", "alterations"],
});
