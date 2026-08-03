import { getCollectionsWithBrands } from "@/lib/services/collectionService";
import { getCataloguesPubliclyVisible } from "@/lib/services/catalogueVisibilitySetting";
import CollectionsPageClient from "./CollectionsPageClient";
import type { CatalogueWithBrand } from "./collectionTypes";

export { metadata } from "./metadata";

export default async function CollectionsPage() {
  const cataloguesPubliclyVisible = await getCataloguesPubliclyVisible();
  let initialCollections: CatalogueWithBrand[] = [];
  let initialLoadError: string | null = null;

  if (cataloguesPubliclyVisible) {
    try {
      const data = await getCollectionsWithBrands();
      initialCollections = data as CatalogueWithBrand[];
    } catch (e) {
      console.error("Collections page: failed to load catalogues", e);
      initialLoadError = "Failed to load information";
    }
  }

  return (
    <CollectionsPageClient
      initialCollections={initialCollections}
      initialLoadError={initialLoadError}
      cataloguesPubliclyVisible={cataloguesPubliclyVisible}
    />
  );
}
