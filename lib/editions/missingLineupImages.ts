import { brandIsListedInPublicDirectory } from "@/lib/brands/directoryListingImage";
import type { Brand } from "@/lib/supabase";
import type { EditionLineupBrand } from "@/lib/services/editionLineupService";

export type MissingLineupImage = {
  editionSlug: string;
  brandId: string;
  brandName: string;
};

export function findMissingLineupImages(
  lineupRows: EditionLineupBrand[],
  brands: Brand[],
): MissingLineupImage[] {
  const byId = new Map(brands.map((brand) => [brand.id, brand]));
  const missing: MissingLineupImage[] = [];

  for (const row of lineupRows) {
    const brand = byId.get(row.brand_id);
    if (!brand) continue;
    if (brandIsListedInPublicDirectory(brand)) continue;
    missing.push({
      editionSlug: row.edition_slug,
      brandId: brand.id,
      brandName: brand.name,
    });
  }

  return missing;
}
