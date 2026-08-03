import { JsonLd } from "@/components/seo/JsonLd";
import { generateStructuredData, SITE_DESCRIPTION } from "@/lib/seo";

/** Site-wide Organization + WebSite JSON-LD injected once in the root layout. */
export function GlobalSiteJsonLd() {
  return (
    <JsonLd
      data={[
        generateStructuredData("organization", {
          description: SITE_DESCRIPTION,
        }),
        generateStructuredData("website", {}),
      ]}
    />
  );
}
