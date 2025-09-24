import { Metadata } from "next";
import { generateMetadata } from "@/lib/seo";

export const metadata: Metadata = generateMetadata({
  title: "Frequently Asked Questions - OmaHub Support",
  description:
    "Find answers to common questions about OmaHub, our fashion platform, brand partnerships, tailoring services, and how to get started with premium African fashion.",
  keywords: [
    "FAQ",
    "frequently asked questions",
    "OmaHub help",
    "fashion platform",
    "brand partnerships",
    "tailoring services",
    "customer support",
    "African fashion",
    "help center",
  ],
  url: "/faq",
  type: "article",
  author: "OmaHub Support Team",
  section: "Support",
  tags: ["faq", "help", "support", "questions"],
});
