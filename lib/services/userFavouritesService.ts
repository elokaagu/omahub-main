import { createServerSupabaseClient } from "@/lib/supabase-unified";

export type FavouriteRow = {
  id: string;
  item_id: string;
  item_type: string;
  created_at?: string | null;
};

export type EnrichedFavourite = Record<string, unknown> & {
  id: string;
  item_type: "brand" | "catalogue" | "product";
  favourite_id: string;
};

type Supabase = Awaited<ReturnType<typeof createServerSupabaseClient>>;

const BRAND_FIELDS =
  "id, name, image, category, location, is_verified, rating" as const;
const CATALOGUE_FIELDS =
  "id, title, image, brand_id, description" as const;
const PRODUCT_FIELDS =
  "id, title, image, brand_id, price, sale_price, category, brand:brands(id, name, location, price_range, currency)" as const;

/**
 * Bulk-loads referenced entities and merges in favourites row order (no N+1 per row).
 */
export async function enrichUserFavourites(
  supabase: Supabase,
  rows: FavouriteRow[]
): Promise<EnrichedFavourite[]> {
  const brandIds = [
    ...new Set(
      rows.filter((r) => r.item_type === "brand").map((r) => r.item_id)
    ),
  ];
  const catalogueIds = [
    ...new Set(
      rows.filter((r) => r.item_type === "catalogue").map((r) => r.item_id)
    ),
  ];
  const productIds = [
    ...new Set(
      rows.filter((r) => r.item_type === "product").map((r) => r.item_id)
    ),
  ];

  const [brandsRes, cataloguesRes, productsRes] = await Promise.all([
    brandIds.length
      ? supabase.from("brands").select(BRAND_FIELDS).in("id", brandIds)
      : Promise.resolve({ data: [] as Record<string, unknown>[] }),
    catalogueIds.length
      ? supabase
          .from("catalogues")
          .select(CATALOGUE_FIELDS)
          .in("id", catalogueIds)
      : Promise.resolve({ data: [] as Record<string, unknown>[] }),
    productIds.length
      ? supabase.from("products").select(PRODUCT_FIELDS).in("id", productIds)
      : Promise.resolve({ data: [] as Record<string, unknown>[] }),
  ]);

  const brandMap = new Map(
    (brandsRes.data ?? []).map((b) => [String(b.id), b as Record<string, unknown>])
  );
  const catalogueMap = new Map(
    (cataloguesRes.data ?? []).map((c) => [
      String(c.id),
      c as Record<string, unknown>,
    ])
  );
  const productMap = new Map(
    (productsRes.data ?? []).map((p) => [String(p.id), p as Record<string, unknown>])
  );

  const out: EnrichedFavourite[] = [];

  for (const row of rows) {
    const favourite_id = row.id;
    switch (row.item_type) {
      case "brand": {
        const b = brandMap.get(row.item_id);
        if (b?.id == null) break;
        out.push({
          ...b,
          id: String(b.id),
          item_type: "brand",
          favourite_id,
        } as EnrichedFavourite);
        break;
      }
      case "catalogue": {
        const c = catalogueMap.get(row.item_id);
        if (c?.id == null) break;
        out.push({
          ...c,
          id: String(c.id),
          item_type: "catalogue",
          favourite_id,
        } as EnrichedFavourite);
        break;
      }
      case "product": {
        const p = productMap.get(row.item_id);
        if (p?.id == null) break;
        const sale = p.sale_price;
        const price = p.price;
        out.push({
          ...p,
          id: String(p.id),
          item_type: "product",
          favourite_id,
          price: sale ?? price,
        } as EnrichedFavourite);
        break;
      }
      default:
        break;
    }
  }

  return out;
}

export function partitionFavouritesByType(items: EnrichedFavourite[]) {
  const brands = items.filter((i) => i.item_type === "brand");
  const collections = items.filter((i) => i.item_type === "catalogue");
  const products = items.filter((i) => i.item_type === "product");
  return { brands, collections, products };
}

/** Best-effort cache refresh; RPC may not exist in all environments. */
export async function tryRefreshFavouritesCache(
  supabase: Supabase,
  userId: string
): Promise<void> {
  const { error } = await supabase.rpc("refresh_favourites_cache", {
    user_id: userId,
  });
  if (error) {
    // Expected when RPC is not deployed — avoid noisy logs.
  }
}
