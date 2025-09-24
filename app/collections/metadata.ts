import { Metadata } from "next";
import { generateMetadata } from "@/lib/seo";

export const metadata: Metadata = generateMetadata({
  title: "Fashion Collections - Curated Premium Collections",
  description:
    "Explore curated fashion collections from Africa's finest designers. Discover seasonal collections, limited editions, and exclusive pieces from verified premium brands.",
  keywords: [
    "fashion collections",
    "curated collections",
    "premium fashion",
    "African fashion collections",
    "seasonal fashion",
    "limited edition",
    "exclusive fashion",
    "designer collections",
    "luxury collections",
    "contemporary fashion",
  ],
  url: "/collections",
  type: "website",
  author: "OmaHub",
  section: "Collections",
  tags: ["collections", "fashion", "curated", "premium", "exclusive"],
});
