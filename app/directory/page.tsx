import { Suspense } from "react";
import { AnimatedSectionHeader } from "@/components/ui/animated-section-header";
import { JsonLd } from "@/components/seo/JsonLd";
import { generateItemListStructuredData, generateWebPageStructuredData } from "@/lib/seo";
import { getAllBrands } from "@/lib/services/brandService";
import ClientWrapper from "./ClientWrapper";

export { metadata } from "./metadata";

function DirectoryInteractiveFallback() {
  return (
    <div className="mt-8">
      <div className="text-center py-12">
        <p className="text-oma-cocoa text-lg">
          Please wait while we load designer data...
        </p>
        <div className="mx-auto mt-4 h-2 w-36 overflow-hidden rounded-full bg-oma-plum/20">
          <div className="h-full w-1/2 animate-pulse rounded-full bg-oma-plum/60" />
        </div>
      </div>
    </div>
  );
}

export default async function DirectoryPage() {
  let brands: Awaited<ReturnType<typeof getAllBrands>> = [];
  try {
    brands = await getAllBrands(false, false);
  } catch (e) {
    console.error("directory_seo_brands_error", e);
  }

  const verifiedBrands = brands.filter((b) => b.is_verified).slice(0, 50);

  return (
    <div className="min-h-screen bg-gradient-to-b from-oma-beige/30 to-white">
      <JsonLd
        data={[
          generateWebPageStructuredData({
            name: "OmaHub Brand Directory",
            description:
              "Curated directory of verified African fashion designers and ateliers from Lagos, Accra, Nairobi, London and the diaspora.",
            url: "/directory",
            speakableText: "true",
          }),
          ...(verifiedBrands.length > 0
            ? [
                generateItemListStructuredData(
                  "Verified African Fashion Designers on OmaHub",
                  "Taste-led directory of designers verified in person at OmaHub editions.",
                  verifiedBrands.map((brand) => ({
                    name: brand.name,
                    url: `/brand/${brand.id}`,
                    image: brand.image || undefined,
                  })),
                ),
              ]
            : []),
        ]}
      />
      <div className="max-w-7xl mx-auto px-6 py-8">
        <AnimatedSectionHeader
          title="Brand Directory"
          subtitle="Discover talented designers and artisans"
          centered={true}
          titleClassName="font-canela text-3xl md:text-4xl"
          subtitleClassName="text-oma-cocoa/80"
        />

        <Suspense fallback={<DirectoryInteractiveFallback />}>
          <ClientWrapper />
        </Suspense>
      </div>
    </div>
  );
}
