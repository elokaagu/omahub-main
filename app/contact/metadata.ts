import { Metadata } from "next";
import { generateSEOMetadata } from "@/lib/seo";

export const metadata: Metadata = generateSEOMetadata({
  title: "Contact Us - Get in Touch with OmaHub",
  description:
    "Contact OmaHub for brand partnerships, customer support, or general inquiries. We're here to help you connect with Africa's finest fashion designers and tailors.",
  keywords: [
    "contact OmaHub",
    "customer service",
    "brand partnerships",
    "fashion platform support",
    "African fashion",
    "designer contact",
    "tailor services",
    "business inquiries",
  ],
  url: "/contact",
  type: "article",
  author: "OmaHub Team",
  section: "Contact",
  tags: ["contact", "support", "partnerships", "inquiries"],
});
