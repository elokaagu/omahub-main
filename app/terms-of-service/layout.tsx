import type { Metadata } from "next";
import { generateSEOMetadata } from "@/lib/seo";

export const metadata: Metadata = generateSEOMetadata({
  title: "Terms of Service | OmaHub",
  description:
    "Terms and conditions for using OmaHub — the curated African fashion platform for verified designers, shoppers, and tailors.",
  keywords: ["OmaHub terms", "terms of service", "fashion platform terms"],
  url: "/terms-of-service",
  type: "website",
});

export default function TermsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
