import { Metadata } from "next";
import { generateSEOMetadata } from "@/lib/seo";

export const metadata: Metadata = generateSEOMetadata({
  title: "Privacy Policy | OmaHub",
  description:
    "How OmaHub collects, uses, stores, and protects your personal information when you use our curated African fashion marketplace.",
  keywords: [
    "OmaHub privacy policy",
    "data protection OmaHub",
    "privacy African fashion marketplace",
    "OmaHub GDPR",
    "personal data OmaHub",
  ],
  url: "/privacy-policy",
  type: "website",
  author: "OmaHub",
  section: "Legal",
  tags: ["privacy", "legal", "data", "policy"],
});
