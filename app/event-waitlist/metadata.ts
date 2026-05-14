import { Metadata } from "next";
import { generateSEOMetadata } from "@/lib/seo";

export const metadata: Metadata = generateSEOMetadata({
  title: "Event Preorder & Waitlist | OmaHub",
  description:
    "Reserve interest for Saturday event pieces - tell us the designer, item, and size. One simple form; OmaHub coordinates with the brand on your behalf.",
  keywords: [
    "OmaHub preorder",
    "designer waitlist",
    "event fashion preorder",
    "Africa fashion marketplace",
  ],
  url: "/event-waitlist",
  type: "website",
  author: "OmaHub Team",
  section: "Preorder",
  tags: ["preorder", "waitlist", "event"],
});
