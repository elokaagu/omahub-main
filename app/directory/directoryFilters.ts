import { mapLegacyToUnified } from "@/lib/data/unified-categories";
import type { BrandDisplay } from "./directoryBrandMap";

export function filterDirectoryBrands(
  brands: BrandDisplay[],
  searchTerm: string,
  selectedCategory: string,
  selectedLocation: string
): BrandDisplay[] {
  let filtered = brands;

  if (searchTerm.trim()) {
    const q = searchTerm.toLowerCase();
    filtered = filtered.filter((b) => b.name.toLowerCase().includes(q));
  }

  if (selectedCategory !== "All Categories") {
    const selectedUnifiedId = mapLegacyToUnified(selectedCategory);
    filtered = filtered.filter((brand) => {
      const allCategories = [brand.category, ...(brand.categories || [])].filter(
        Boolean
      );
      return allCategories.some(
        (cat) => mapLegacyToUnified(cat) === selectedUnifiedId
      );
    });
  }

  if (selectedLocation !== "All Locations") {
    filtered = filtered.filter((b) => b.location === selectedLocation);
  }

  return filtered;
}
