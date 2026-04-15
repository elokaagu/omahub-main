import type { BrandProfileData } from "./types";
import type { Brand } from "@/lib/supabase";
import { brandIsListedInPublicDirectory } from "@/lib/brands/directoryListingImage";

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
  brand_images?: Array<{ storage_path?: string | null }>;
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
  const asBrand = brand as Brand;
  const listed = brandIsListedInPublicDirectory(asBrand);

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
    image: brand.brand_images?.[0]?.storage_path
      ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/brand-assets/${brand.brand_images[0].storage_path}`
      : undefined,
    showDirectoryImageNotice: !listed,
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
