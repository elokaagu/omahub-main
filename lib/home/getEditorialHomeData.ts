import { unstable_cache } from "next/cache";
import {
  brandIsListedInPublicDirectory,
  resolveBrandDirectoryCardImageUrl,
} from "@/lib/brands/directoryListingImage";
import { getAllBrands } from "@/lib/services/brandService";
import type { Brand } from "@/lib/supabase";
import type { WorkedWithBrand } from "@/app/home/editorial/WorkedWithSection";

function toWorkedWithBrand(brand: Brand): WorkedWithBrand {
  return {
    id: brand.id,
    name: brand.name,
    image: resolveBrandDirectoryCardImageUrl(brand),
    category: brand.category,
    location: brand.location,
    rating: brand.rating,
    isVerified: brand.is_verified,
    video_url: brand.video_url || undefined,
    video_thumbnail: brand.video_thumbnail || undefined,
    brand_images: brand.brand_images,
  };
}

async function buildEditorialHomeBrands(): Promise<WorkedWithBrand[]> {
  const brands = await getAllBrands(false, false);
  const verified = brands.filter(
    (brand) => brand.is_verified && brandIsListedInPublicDirectory(brand),
  );
  const withVideo = verified.filter((brand) => brand.video_url);
  const withImage = verified.filter((brand) => !brand.video_url);
  return [...withVideo, ...withImage].slice(0, 14).map(toWorkedWithBrand);
}

/**
 * Verified brands for the "Brands we've worked with" homepage row.
 * Cached alongside the page's 120s ISR window.
 */
export const getEditorialHomeBrands = unstable_cache(
  buildEditorialHomeBrands,
  ["editorial-home-brands-v2"],
  { revalidate: 120, tags: ["home-bootstrap"] }
);

/**
 * Match an edition's brand lineup (by directory name) to live brand records
 * so edition pages can show the lineup in motion. Names that don't match are
 * simply omitted.
 */
export async function getBrandsByNames(
  names: string[]
): Promise<WorkedWithBrand[]> {
  if (names.length === 0) return [];
  const wanted = new Set(names.map((n) => n.trim().toLowerCase()));
  const brands = await getAllBrands(false, false);
  return brands
    .filter((brand) => wanted.has(brand.name.trim().toLowerCase()))
    .filter(brandIsListedInPublicDirectory)
    .map(toWorkedWithBrand);
}

/**
 * Resolve studio-managed lineup brand IDs to live brand cards, preserving
 * the order saved in edition_lineup_brands.
 */
export async function getBrandsByIds(
  ids: string[],
): Promise<WorkedWithBrand[]> {
  if (ids.length === 0) return [];

  const brands = await getAllBrands(false, false);
  const byId = new Map(brands.map((brand) => [brand.id, brand]));

  return ids
    .map((id) => byId.get(id))
    .filter((brand): brand is Brand => Boolean(brand))
    .filter(brandIsListedInPublicDirectory)
    .map(toWorkedWithBrand);
}
