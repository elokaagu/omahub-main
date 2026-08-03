import { notFound } from "next/navigation";
import { getCollectionWithBrand } from "@/lib/services/collectionService";
import { getProductsByCatalogueWithBrand } from "@/lib/services/productService";
import { getCataloguesPubliclyVisible } from "@/lib/services/catalogueVisibilitySetting";
import ClientCollectionPage from "./ClientCollectionPage";
import { isPostgrestNoRowsError } from "./collectionPageUtils";
import type { CatalogueWithBrandForPage, CollectionProduct } from "./types";

interface CollectionPageProps {
  params: { id: string };
}

export default async function CollectionPage({ params }: CollectionPageProps) {
  if (!(await getCataloguesPubliclyVisible())) {
    notFound();
  }

  let catalogue: CatalogueWithBrandForPage | null = null;

  try {
    const data = await getCollectionWithBrand(params.id);
    catalogue = data as CatalogueWithBrandForPage | null;
  } catch (e) {
    if (isPostgrestNoRowsError(e)) {
      notFound();
    }
    throw e;
  }

  if (!catalogue) {
    notFound();
  }

  const products = (await getProductsByCatalogueWithBrand(
    params.id
  )) as CollectionProduct[];

  return (
    <ClientCollectionPage
      key={params.id}
      catalogue={catalogue}
      products={products}
    />
  );
}
