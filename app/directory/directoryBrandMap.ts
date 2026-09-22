import type { Brand } from "@/lib/supabase";
import {
  brandIsListedInPublicDirectory,
  resolveBrandDirectoryCardImageUrl,
} from "@/lib/brands/directoryListingImage";

export interface BrandDisplay {
  id: string;
  name: string;
  image: string;
  category: string;
  categories?: string[];
  location: string;
  isVerified: boolean;
}

/** Maps API brand → card model. Skips rows without a stable id or a published listing image. */
export function mapBrandToDisplay(brand: Brand): BrandDisplay | null {
  const id = brand.id?.trim();
  if (!id) return null;
  if (!brandIsListedInPublicDirectory(brand)) return null;

  return {
    id,
    name: brand.name?.trim() || "Unnamed Brand",
    image: resolveBrandDirectoryCardImageUrl(brand),
    category: brand.category || "",
    categories: brand.categories || [],
    location: brand.location
      ? brand.location.split(",")[0].trim() || "Unknown"
      : "Unknown",
    isVerified: Boolean(brand.is_verified),
  };
}

export function mapBrandsToDisplay(brands: Brand[]): BrandDisplay[] {
  const out: BrandDisplay[] = [];
  for (const b of brands) {
    const row = mapBrandToDisplay(b);
    if (row) out.push(row);
  }
  return out;
}
