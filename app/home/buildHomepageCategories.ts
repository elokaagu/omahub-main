import {
  UNIFIED_CATEGORIES,
  mapLegacyToUnified,
} from "@/lib/data/unified-categories";
import { isUsableBrandCardImageUrl } from "@/lib/brands/directoryListingImage";
import type { BrandDisplay, CategoryWithBrands } from "./homeTypes";
import { shuffleArray } from "./homepageData";
import { devLog } from "./devLog";

type CategoryProductBundle = {
  categoryId: string;
  products: { brand_id?: string }[];
};

function mapBrandToDisplay(brand: {
  id: string;
  name: string;
  image?: string | null;
  brand_images?: { storage_path: string }[];
  location?: string;
  rating: number;
  is_verified?: boolean;
  category: string;
  video_url?: string | null;
  video_thumbnail?: string | null;
}): BrandDisplay {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const fromStorage = brand.brand_images?.[0]?.storage_path
    ? `${base}/storage/v1/object/public/brand-assets/${brand.brand_images[0].storage_path}`
    : null;
  const fromLegacy = isUsableBrandCardImageUrl(brand.image)
    ? brand.image!.trim()
    : null;
  const resolvedImage = fromStorage || fromLegacy || "/placeholder-image.jpg";

  return {
    id: brand.id,
    name: brand.name,
    image: resolvedImage,
    location: brand.location?.split(",")[0] || "Unknown",
    rating: brand.rating,
    isVerified: brand.is_verified || false,
    category: brand.category,
    video_url:
      brand.video_url && brand.video_url.trim() !== ""
        ? brand.video_url
        : undefined,
    video_thumbnail:
      brand.video_thumbnail && brand.video_thumbnail.trim() !== ""
        ? brand.video_thumbnail
        : undefined,
  };
}

export function buildHomepageCategoriesFromBrands(
  brandsData: Array<{
    id: string;
    name: string;
    image?: string | null;
    category: string;
    categories?: string[];
    brand_images?: { storage_path: string }[];
    location?: string;
    rating: number;
    is_verified?: boolean;
    video_url?: string | null;
    video_thumbnail?: string | null;
  }>,
  categoryProducts: CategoryProductBundle[]
): CategoryWithBrands[] {
  return UNIFIED_CATEGORIES.map((category, index) => {
    const categoryProductData = categoryProducts[index];
    const categoryProductIds = new Set(
      categoryProductData?.products?.map((p) => p.brand_id).filter(Boolean) || []
    );

    const categoryBrands = shuffleArray(
      brandsData.filter((brand) => {
        const allCategories = [
          brand.category,
          ...(brand.categories || []),
        ].filter(Boolean);

        const brandMatchesCategory = allCategories.some(
          (cat) => mapLegacyToUnified(cat) === category.id
        );

        const brandHasMatchingProducts = categoryProductIds.has(brand.id);

        const hasGallery =
          brand.brand_images && brand.brand_images.length > 0;
        const hasLegacyImage = isUsableBrandCardImageUrl(brand.image);
        const hasVideo =
          Boolean(brand.video_url && brand.video_url.trim() !== "");
        const hasMedia = Boolean(hasGallery || hasLegacyImage || hasVideo);

        return (
          (brandMatchesCategory || brandHasMatchingProducts) && hasMedia
        );
      })
    )
      .slice(0, 8)
      .map((brand) => {
        if (brand.video_url && process.env.NODE_ENV === "development") {
          devLog("Brand with video:", brand.name, brand.video_url);
        }
        return mapBrandToDisplay(brand);
      });

    if (process.env.NODE_ENV === "development" && category.id === "streetwear-urban") {
      devLog("Streetwear brands:", categoryBrands.map((b) => b.name));
    }

    return {
      title: category.displayName,
      image: category.homepageImage!,
      href: `/directory?category=${encodeURIComponent(category.displayName)}`,
      customCta: category.homepageCta!,
      brands: categoryBrands,
    };
  });
}
