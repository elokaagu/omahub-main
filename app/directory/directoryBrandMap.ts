import type { Brand } from "@/lib/supabase";

export interface BrandDisplay {
  id: string;
  name: string;
  image: string;
  category: string;
  categories?: string[];
  location: string;
  isVerified: boolean;
}

/** Paths that are not real assets in `public/` (LazyImage would 404 → "Image Coming Soon"). */
const BROKEN_IMAGE_FALLBACKS = new Set([
  "",
  "/placeholder.jpg",
  "/placeholder-image.jpg",
  "/placeholder.png",
  "/placeholder.svg",
]);

/**
 * Prefer `brand.image` from the API (already a full Supabase URL on the server).
 * `/api/brands/public?refresh=1` maps rows without embedding `brand_images` in JSON,
 * so relying only on `brand_images` here broke the directory grid for every refresh.
 */
function brandImageUrl(brand: Brand): string {
  const fromApi = brand.image?.trim() ?? "";
  if (fromApi && !BROKEN_IMAGE_FALLBACKS.has(fromApi)) {
    return fromApi;
  }

  const path = brand.brand_images?.[0]?.storage_path;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  if (path && base) {
    return `${base}/storage/v1/object/public/brand-assets/${path}`;
  }

  return "/brand/omahub-logo.png";
}

/** Maps API brand → card model. Skips rows without a stable id. */
export function mapBrandToDisplay(brand: Brand): BrandDisplay | null {
  const id = brand.id?.trim();
  if (!id) return null;

  return {
    id,
    name: brand.name?.trim() || "Unnamed Brand",
    image: brandImageUrl(brand),
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

/** Sample rows for local dev when the API returns an empty list (not used in production). */
export const DIRECTORY_DEV_FALLBACK_BRANDS: BrandDisplay[] = [
  {
    id: "fallback-1",
    name: "Adiree",
    image: "/lovable-uploads/4a7c7e86-6cde-4d07-a246-a5aa4cb6fa51.png",
    category: "Ready to Wear",
    location: "Lagos",
    isVerified: true,
  },
  {
    id: "fallback-2",
    name: "Imad Eduso",
    image: "/lovable-uploads/57cc6a40-0f0d-4a7d-8786-41f15832ebfb.png",
    category: "Bridal",
    location: "Lagos",
    isVerified: true,
  },
  {
    id: "fallback-3",
    name: "Emmy Kasbit",
    image: "/lovable-uploads/99ca757a-bed8-422e-b155-0b9d365b58e0.png",
    category: "Ready to Wear",
    location: "Accra",
    isVerified: true,
  },
  {
    id: "fallback-4",
    name: "Shekudo",
    image: "/lovable-uploads/25c3fe26-3fc4-43ef-83ac-6931a74468c0.png",
    category: "Accessories",
    location: "Nairobi",
    isVerified: true,
  },
];
