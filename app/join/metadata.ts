import { Metadata } from "next";
import { generateSEOMetadata } from "@/lib/seo";

export const metadata: Metadata = generateSEOMetadata({
  title: "Join OmaHub as a Designer | Apply to Our Curated Directory",
  description:
    "Apply to join OmaHub's curated community of fashion designers. Share your brand story, portfolio, and category—we review every application and guide approved brands through onboarding.",
  keywords: [
    "join OmaHub",
    "designer application OmaHub",
    "African fashion designers apply",
    "curated fashion directory",
    "OmaHub designer onboarding",
    "list fashion brand OmaHub",
  ],
  url: "/join",
  type: "website",
  author: "OmaHub",
  section: "Designers",
  tags: ["join", "designers", "application", "directory"],
});
