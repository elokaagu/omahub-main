import type { Catalogue, Product } from "@/lib/supabase";

export type CollectionBrandSummary = {
  name: string;
  id: string;
  location: string;
  is_verified: boolean;
  category: string;
  rating: number;
  long_description?: string | null;
  price_range?: string;
  currency?: string;
};

export type CatalogueWithBrandForPage = Catalogue & {
  brand: CollectionBrandSummary;
  created_at?: string;
};

export type CollectionProduct = Product & {
  brand: {
    name: string;
    id: string;
    location: string;
    is_verified: boolean;
    price_range?: string;
    currency?: string;
  };
};

export type RecommendedProduct = Product & {
  brand: { price_range?: string; currency?: string; location?: string };
};
