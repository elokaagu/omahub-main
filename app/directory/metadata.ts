import { Metadata } from "next";
import { generateSEOMetadata } from "@/lib/seo";

export const metadata: Metadata = generateSEOMetadata({
  title:
    "Find African Fashion Designers & Curated Brands | OmaHub Directory",
  description:
    "Taste-led African fashion discovery on OmaHub: verified designers and ateliers from Lagos, Accra, Nairobi and beyond. For shoppers and stylists who want real craft—not generic listings—explore collections and connect when you are ready to buy or commission.",
  keywords: [
    "find African fashion designers",
    "hire African designer brands",
    "African bridal designers directory",
    "Lagos fashion designers directory",
    "Accra fashion brands",
    "Nairobi designers African fashion",
    "curated African fashion platform",
    "emerging African fashion designers",
    "commission African designer",
    "African luxury fashion discovery",
    "verified African fashion brands",
    "contemporary African fashion directory",
    "shop African designers online",
    "African fashion talent hub",
  ],
  url: "/directory",
  type: "website",
  author: "OmaHub",
  section: "Directory",
  tags: [
    "directory",
    "African fashion",
    "curated designers",
    "Lagos",
    "Accra",
    "Nairobi",
    "discovery",
  ],
});
