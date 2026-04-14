import { getCollectionsWithBrands } from "@/lib/services/collectionService";
import CollectionsPageClient from "./CollectionsPageClient";
import type { CatalogueWithBrand } from "./collectionTypes";

export { metadata } from "./metadata";

export default async function CollectionsPage() {
  let initialCollections: CatalogueWithBrand[] = [];
  let initialLoadError: string | null = null;

  try {
    const data = await getCollectionsWithBrands();
    initialCollections = data as CatalogueWithBrand[];
  } catch (e) {
    console.error("Collections page: failed to load catalogues", e);
    initialLoadError = "Failed to load information";
  }

  return (
    <CollectionsPageClient
      initialCollections={initialCollections}
      initialLoadError={initialLoadError}
    />
  );
}
