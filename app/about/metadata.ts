import type { Metadata } from "next";
import { generateSEOMetadata } from "@/lib/seo";
import { ABOUT_DESCRIPTION } from "./seo-copy";

export const metadata: Metadata = generateSEOMetadata({
  title: "About OmaHub — Our Mission & Vision",
  description: ABOUT_DESCRIPTION,
  // Path only; canonical + openGraph.url are built in generateSEOMetadata (baseUrl + url).
  url: "/about",
  type: "article",
  author: "OmaHub Team",
  section: "Company",
  tags: ["African fashion", "designers", "platform"],
});
