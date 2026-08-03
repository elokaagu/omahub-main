import type { BrandProfileData } from "./types";
import {
  DIRECTORY_LISTING_FALLBACK_LOGO,
  isUsableBrandCardImageUrl,
  resolveBrandDirectoryCardImageUrl,
} from "@/lib/brands/directoryListingImage";

type BrandRecord = {
  id: string;
  name: string;
  description?: string | null;
  long_description?: string | null;
  location?: string | null;
  price_range?: string | null;
  currency?: string | null;
  category?: string | null;
  rating?: number | null;
  is_verified?: boolean | null;
  website?: string | null;
  instagram?: string | null;
  whatsapp?: string | null;
  contact_email?: string | null;
  /** Legacy / API-resolved column when present on `brands` row */
  image?: string | null;
  logo_url?: string | null;
  video_thumbnail?: string | null;
  brand_images?: Array<{ storage_path?: string | null; role?: string | null }>;
};

type CollectionRecord = {
  id: string | number;
  title: string;
  image: string;
  description?: string | null;
};

export function mapBrandToProfileData(
  brand: BrandRecord,
  collections: CollectionRecord[]
): BrandProfileData {
  const resolvedImage = resolveBrandDirectoryCardImageUrl(brand as any);
  const profileImage =
    isUsableBrandCardImageUrl(resolvedImage) &&
    resolvedImage !== DIRECTORY_LISTING_FALLBACK_LOGO
      ? resolvedImage
      : isUsableBrandCardImageUrl(brand.video_thumbnail)
        ? brand.video_thumbnail!.trim()
        : undefined;

  return {
    id: brand.id,
    name: brand.name,
    description: brand.description || "",
    longDescription: brand.long_description,
    location: brand.location || undefined,
    priceRange: brand.price_range || undefined,
    currency: brand.currency || undefined,
    category: brand.category || undefined,
    rating: brand.rating || undefined,
    isVerified: brand.is_verified || undefined,
    image: profileImage,
    website: brand.website,
    instagram: brand.instagram || undefined,
    whatsapp: brand.whatsapp || undefined,
    contact_email: brand.contact_email || undefined,
    collections: collections.map((catalogue) => ({
      id: catalogue.id,
      title: catalogue.title,
      image: catalogue.image,
      description: catalogue.description || "",
    })),
  };
}
