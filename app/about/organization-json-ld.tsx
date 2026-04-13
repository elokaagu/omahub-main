import { generateStructuredData } from "@/lib/seo";
import { ABOUT_DESCRIPTION } from "./seo-copy";

/** Server-rendered Organization JSON-LD for /about (About page is client-only). */
export function AboutOrganizationJsonLd() {
  const jsonLd = generateStructuredData("organization", {
    description: ABOUT_DESCRIPTION,
  });
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
