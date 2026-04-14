import { Metadata } from "next";
import { generateSEOMetadata } from "@/lib/seo";

export const metadata: Metadata = generateSEOMetadata({
  title: "Contact OmaHub | Support, Partnerships & Inquiries",
  description:
    "Reach out to the OmaHub team for partnerships, customer support, or general enquiries. Connect with Africa's leading fashion marketplace and collaborate with curated designers and brands.",
  keywords: [
    "contact OmaHub",
    "OmaHub support",
    "OmaHub partnerships",
    "customer support OmaHub",
    "business inquiries",
    "fashion platform contact",
  ],
  url: "/contact",
  type: "website",
  author: "OmaHub Team",
  section: "Contact",
  tags: ["contact", "support", "partnerships", "inquiries"],
});
