import { Metadata } from "next";
import { generateSEOMetadata } from "@/lib/seo";

export const metadata: Metadata = generateSEOMetadata({
  title: "Product Preorder & Waitlist | OmaHub",
  description:
    "Reserve interest in designer pieces: tell us the designer, item, and size. For a custom request, reach us at info@oma-hub.com. OmaHub coordinates with the brand on your behalf.",
  keywords: [
    "OmaHub preorder",
    "designer waitlist",
    "product preorder",
    "Africa fashion marketplace",
  ],
  url: "/event-waitlist",
  type: "website",
  author: "OmaHub Team",
  section: "Preorder",
  tags: ["preorder", "waitlist", "product"],
});
