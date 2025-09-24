import { Metadata } from "next";
import { generateSEOMetadata } from "@/lib/seo";

export const metadata: Metadata = generateSEOMetadata({
  title: "Fashion Brand Directory - Discover Premium African Designers",
  description:
    "Browse our curated directory of premium African fashion brands and designers. Discover unique styles, connect with verified brands, and explore the finest in contemporary African fashion.",
  keywords: [
    "fashion brand directory",
    "African fashion brands",
    "designer directory",
    "premium fashion",
    "verified brands",
    "fashion designers",
    "African designers",
    "luxury fashion",
    "contemporary fashion",
    "brand showcase",
  ],
  url: "/directory",
  type: "website",
  author: "OmaHub",
  section: "Directory",
  tags: ["directory", "brands", "designers", "African fashion", "premium"],
});
