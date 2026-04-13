import type { SupabaseClient } from "@supabase/supabase-js";

export type FavouriteRow = {
  id: string;
  item_type: string;
  item_id: string;
  created_at: string;
};

export type EnrichedBrandFavourite = {
  item_type: "brand";
  favourite_id: string;
  id: string;
  name: string;
  image: string | null;
  category: string | null;
  location: string | null;
  is_verified: boolean | null;
  rating: number | null;
};

export type EnrichedCatalogueFavourite = {
  item_type: "catalogue";
  favourite_id: string;
  id: string;
  title: string;
  image: string | null;
  brand_id: string | null;
  description: string | null;
};

export type EnrichedProductFavourite = {
  item_type: "product";
  favourite_id: string;
  id: string;
  title: string;
  image: string | null;
  brand_id: string | null;
  /** Effective price (sale when present, else list). */
  price: number | null;
  sale_price: number | null;
  category: string | null;
  brand: {
    id: string;
    name: string;
    location: string | null;
    price_range: string | null;
    currency: string | null;
  } | null;
};

export type EnrichedFavourite =
  | EnrichedBrandFavourite
  | EnrichedCatalogueFavourite
  | EnrichedProductFavourite;

function uniqueIds(rows: FavouriteRow[], type: string): string[] {
  const set = new Set<string>();
  for (const r of rows) {
    if (r.item_type === type && r.item_id) set.add(r.item_id);
  }
  return [...set];
}

/**
 * Case-insensitive profile match (single row).
 */
export async function resolveTargetUserIdByEmail(
  adminDb: SupabaseClient,
  email: string
): Promise<{ id: string; email: string } | null> {
  const { data: rows, error } = await adminDb
    .from("profiles")
    .select("id, email")
    .ilike("email", email)
    .limit(1);

  if (error) {
    console.error(
      "adminUserFavourites: profile lookup failed:",
      error.code,
      error.message
    );
    return null;
  }

  const row = rows?.[0];
  if (!row?.id) return null;
  return { id: row.id, email: row.email ?? email };
}

/**
 * Load favourites and enrich with brands / catalogues / products in bulk (no N+1).
 */
export async function fetchEnrichedUserFavourites(
  adminDb: SupabaseClient,
  targetUserId: string
): Promise<{
  items: EnrichedFavourite[];
  error?: string;
}> {
  const { data: favourites, error: favouritesError } = await adminDb
    .from("favourites")
    .select("id, item_type, item_id, created_at")
    .eq("user_id", targetUserId)
    .order("created_at", { ascending: false });

  if (favouritesError) {
    console.error(
      "adminUserFavourites: favourites query failed:",
      favouritesError.code,
      favouritesError.message
    );
    return {
      items: [],
      error: favouritesError.message,
    };
  }

  const rows = (favourites ?? []) as FavouriteRow[];
  const brandIds = uniqueIds(rows, "brand");
  const catalogueIds = uniqueIds(rows, "catalogue");
  const productIds = uniqueIds(rows, "product");

  const brandsMap = new Map<string, Omit<EnrichedBrandFavourite, "item_type" | "favourite_id">>();
  const cataloguesMap = new Map<
    string,
    Omit<EnrichedCatalogueFavourite, "item_type" | "favourite_id">
  >();
  const productsMap = new Map<
    string,
    {
      id: string;
      title: string;
      image: string | null;
      brand_id: string | null;
      listPrice: number | null;
      sale_price: number | null;
      category: string | null;
      brand: EnrichedProductFavourite["brand"];
    }
  >();

  const empty = { data: [] as Record<string, unknown>[], error: null as null };

  const [brandsRes, cataloguesRes, productsRes] = await Promise.all([
    brandIds.length
      ? adminDb
          .from("brands")
          .select("id, name, image, category, location, is_verified, rating")
          .in("id", brandIds)
      : Promise.resolve(empty),
    catalogueIds.length
      ? adminDb
          .from("catalogues")
          .select("id, title, image, brand_id, description")
          .in("id", catalogueIds)
      : Promise.resolve(empty),
    productIds.length
      ? adminDb
          .from("products")
          .select(
            `
            id, title, image, brand_id, price, sale_price, category,
            brand:brands(id, name, location, price_range, currency)
          `
          )
          .in("id", productIds)
      : Promise.resolve(empty),
  ]);

  if (brandsRes.error) {
    console.error("adminUserFavourites: brands bulk fetch failed:", brandsRes.error);
  }
  if (cataloguesRes.error) {
    console.error(
      "adminUserFavourites: catalogues bulk fetch failed:",
      cataloguesRes.error
    );
  }
  if (productsRes.error) {
    console.error(
      "adminUserFavourites: products bulk fetch failed:",
      productsRes.error
    );
  }

  for (const b of brandsRes.data ?? []) {
    const id = b.id as string;
    brandsMap.set(id, {
      id,
      name: (b.name as string) ?? "",
      image: (b.image as string) ?? null,
      category: (b.category as string) ?? null,
      location: (b.location as string) ?? null,
      is_verified: (b.is_verified as boolean) ?? null,
      rating: (b.rating as number) ?? null,
    });
  }

  for (const c of cataloguesRes.data ?? []) {
    const id = c.id as string;
    cataloguesMap.set(id, {
      id,
      title: (c.title as string) ?? "",
      image: (c.image as string) ?? null,
      brand_id: (c.brand_id as string) ?? null,
      description: (c.description as string) ?? null,
    });
  }

  for (const p of productsRes.data ?? []) {
    const id = p.id as string;
    const brandRaw = p.brand;
    const brand =
      brandRaw && !Array.isArray(brandRaw)
        ? (brandRaw as EnrichedProductFavourite["brand"])
        : Array.isArray(brandRaw) && brandRaw[0]
          ? (brandRaw[0] as EnrichedProductFavourite["brand"])
          : null;

    productsMap.set(id, {
      id,
      title: (p.title as string) ?? "",
      image: (p.image as string) ?? null,
      brand_id: (p.brand_id as string) ?? null,
      listPrice: (p.price as number) ?? null,
      sale_price: (p.sale_price as number) ?? null,
      category: (p.category as string) ?? null,
      brand,
    });
  }

  const items: EnrichedFavourite[] = [];

  for (const fav of rows) {
    switch (fav.item_type) {
      case "brand": {
        const b = brandsMap.get(fav.item_id);
        if (b) {
          items.push({
            item_type: "brand",
            favourite_id: fav.id,
            ...b,
          });
        }
        break;
      }
      case "catalogue": {
        const c = cataloguesMap.get(fav.item_id);
        if (c) {
          items.push({
            item_type: "catalogue",
            favourite_id: fav.id,
            ...c,
          });
        }
        break;
      }
      case "product": {
        const p = productsMap.get(fav.item_id);
        if (p) {
          const effectivePrice =
            p.sale_price != null && p.sale_price > 0
              ? p.sale_price
              : p.listPrice ?? null;
          items.push({
            item_type: "product",
            favourite_id: fav.id,
            id: p.id,
            title: p.title,
            image: p.image,
            brand_id: p.brand_id,
            price: effectivePrice,
            sale_price: p.sale_price,
            category: p.category,
            brand: p.brand,
          });
        }
        break;
      }
      default:
        break;
    }
  }

  return { items };
}

export function groupFavouritesByType(items: EnrichedFavourite[]) {
  const brands = items.filter(
    (i): i is EnrichedBrandFavourite => i.item_type === "brand"
  );
  const collections = items.filter(
    (i): i is EnrichedCatalogueFavourite => i.item_type === "catalogue"
  );
  const products = items.filter(
    (i): i is EnrichedProductFavourite => i.item_type === "product"
  );
  return { brands, collections, products };
}
