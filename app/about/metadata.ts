import { Metadata } from "next";
import { generateMetadata } from "@/lib/seo";

export const metadata: Metadata = generateMetadata({
  title: "About OmaHub - Our Mission & Vision",
  description:
    "Learn about OmaHub's mission to connect Africa's innovative fashion talent with a global audience. Discover how we're revolutionizing the fashion industry by bridging cultures and creating opportunities for African designers worldwide.",
  keywords: [
    "about omahub",
    "African fashion",
    "fashion platform",
    "designer showcase",
    "fashion mission",
    "global fashion",
    "African designers",
    "fashion innovation",
  ],
  url: "/about",
  type: "article",
  author: "OmaHub Team",
  section: "Company",
  tags: ["about", "mission", "vision", "African fashion", "platform"],
});
