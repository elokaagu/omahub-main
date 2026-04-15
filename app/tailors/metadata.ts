import { Metadata } from "next";
import { generateSEOMetadata } from "@/lib/seo";

export const metadata: Metadata = generateSEOMetadata({
  title: "Verified Tailors for Custom Fashion | OmaHub",
  description:
    "Discover verified African tailors on OmaHub for bespoke clothing, bridal and occasion wear, alterations, and made-to-measure pieces tailored to your style and fit.",
  keywords: [
    "verified tailors",
    "african tailors",
    "bespoke clothing",
    "custom fashion",
    "made to measure clothing",
    "bridal tailoring",
    "occasion wear tailoring",
    "alterations",
    "seamstress near me",
    "omahub tailors",
    "custom clothing",
  ],
  url: "/tailors",
  type: "website",
  author: "OmaHub",
  section: "Tailors",
  tags: ["tailors", "tailoring", "bespoke", "custom", "alterations"],
});
