import type { Catalogue, Product } from "@/lib/supabase";

/** Catalogue row + joined brand (API / DB naming: “catalogues”). */
export type CatalogueWithBrand = Catalogue & {
  brand: {
    name: string;
    id: string;
    location: string;
    is_verified: boolean;
    category: string;
  };
};

export type ProductWithBrand = Product & {
  brand: {
    name: string;
    id: string;
    location: string;
    is_verified: boolean;
    price_range?: string;
  };
};
