import { Metadata } from "next";
import { generateSEOMetadata } from "@/lib/seo";

export const metadata: Metadata = generateSEOMetadata({
  title: "OmaHub Collections — Discover Africa's Next Generation of Designers",
  description:
    "Explore curated collections from emerging and established African designers. Seasonal edits, limited drops, and pieces from verified studios you won't find on generic marketplaces.",
  keywords: [
    "OmaHub",
    "African designers",
    "fashion collections",
    "curated fashion",
    "emerging designers",
    "bespoke fashion",
  ],
  url: "/collections",
  type: "website",
  author: "OmaHub",
  section: "Collections",
  tags: [
    "OmaHub",
    "African fashion",
    "designer collections",
    "curated",
    "discovery",
  ],
});
