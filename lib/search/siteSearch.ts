import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getAllEditions } from "@/lib/data/editions";
import { filterUnapprovedBrands } from "@/lib/services/brandService";
import { brandAssetsPublicUrl } from "@/lib/brands/applicationBrandImages";
import { CATALOGUES_PUBLICLY_VISIBLE_KEY } from "@/lib/services/catalogueVisibilitySetting";
import { matchesAllTerms, sortByRelevance } from "./searchQuery";
import { searchSitePages } from "./searchPages";
import {
  SEARCH_GROUP_LABELS,
  type SearchGroup,
  type SearchHit,
  type SearchHitType,
  type SearchResponse,
} from "./types";

const LIMITS: Record<SearchHitType, number> = {
  brand: 6,
  collection: 4,
  product: 6,
  edition: 3,
  page: 3,
};

/** Fetch a few extra rows so unapproved brands can be filtered out. */
const OVERFETCH = 3;

type BrandRef = { id: string; name: string; contact_email: string | null };

type BrandRow = BrandRef & {
  category: string | null;
  location: string | null;
  is_verified: boolean | null;
  image: string | null;
  brand_images: { role: string | null; storage_path: string | null }[] | null;
};

type CatalogueRow = {
  id: string;
  title: string;
  image: string | null;
  brand: BrandRef | null;
};

type ProductRow = CatalogueRow & { category: string | null };

let anonClient: SupabaseClient | null = null;

/** Signed-out client: search only ever returns public data. */
function publicClient(): SupabaseClient {
  if (!anonClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) throw new Error("Supabase environment is not configured");
    anonClient = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return anonClient;
}

function brandCover(brand: BrandRow): string | undefined {
  const images = brand.brand_images ?? [];
  const cover = images.find((img) => img.role === "cover") ?? images[0];
  if (cover?.storage_path) return brandAssetsPublicUrl(cover.storage_path);
  return brand.image || undefined;
}

function joinParts(...parts: (string | null | undefined)[]): string | undefined {
  const text = parts.filter(Boolean).join(" · ");
  return text || undefined;
}

async function cataloguesArePublic(db: SupabaseClient): Promise<boolean> {
  const { data, error } = await db
    .from("platform_settings")
    .select("value")
    .eq("key", CATALOGUES_PUBLICLY_VISIBLE_KEY)
    .maybeSingle();
  if (error) {
    console.error("[search] catalogue visibility:", error.message);
    return false; // Fail closed: hidden catalogues stay hidden.
  }
  return data?.value === "true";
}

/** Ids of the approved brands among those given. */
async function approvedBrandIds(brands: BrandRef[]): Promise<Set<string>> {
  const unique = [...new Map(brands.map((b) => [b.id, b])).values()];
  const approved = await filterUnapprovedBrands(unique);
  return new Set(approved.map((b) => b.id));
}

async function searchBrands(db: SupabaseClient, query: string): Promise<SearchHit[]> {
  const pattern = `%${query}%`;
  const { data, error } = await db
    .from("brands")
    .select(
      "id, name, contact_email, category, location, is_verified, image, brand_images(role, storage_path)",
    )
    .or(`name.ilike.${pattern},category.ilike.${pattern},location.ilike.${pattern}`)
    .order("name")
    .limit(LIMITS.brand * OVERFETCH);
  if (error) throw new Error(`brands: ${error.message}`);

  const approved = await filterUnapprovedBrands((data ?? []) as unknown as BrandRow[]);
  return sortByRelevance(approved, query, (b) => b.name)
    .slice(0, LIMITS.brand)
    .map((brand) => ({
      id: brand.id,
      type: "brand",
      title: brand.name,
      subtitle: joinParts(brand.category, brand.location),
      url: `/brand/${brand.id}`,
      image: brandCover(brand),
      verified: Boolean(brand.is_verified),
    }));
}

async function searchCatalogueItems(
  db: SupabaseClient,
  query: string,
): Promise<{ collections: SearchHit[]; products: SearchHit[] }> {
  const pattern = `%${query}%`;
  const brandSelect = "brand:brands(id, name, contact_email)";

  const [catalogues, products] = await Promise.all([
    db
      .from("catalogues")
      .select(`id, title, image, ${brandSelect}`)
      .ilike("title", pattern)
      .limit(LIMITS.collection * OVERFETCH),
    db
      .from("products")
      .select(`id, title, image, category, ${brandSelect}`)
      .or(`title.ilike.${pattern},category.ilike.${pattern}`)
      .limit(LIMITS.product * OVERFETCH),
  ]);
  if (catalogues.error) throw new Error(`catalogues: ${catalogues.error.message}`);
  if (products.error) throw new Error(`products: ${products.error.message}`);

  const catalogueRows = (catalogues.data ?? []) as unknown as CatalogueRow[];
  const productRows = (products.data ?? []) as unknown as ProductRow[];
  const allowed = await approvedBrandIds(
    [...catalogueRows, ...productRows]
      .map((row) => row.brand)
      .filter((brand): brand is BrandRef => Boolean(brand)),
  );
  const isPublic = (row: CatalogueRow) => !!row.brand && allowed.has(row.brand.id);

  return {
    collections: sortByRelevance(catalogueRows.filter(isPublic), query, (c) => c.title)
      .slice(0, LIMITS.collection)
      .map((c) => ({
        id: c.id,
        type: "collection",
        title: c.title,
        subtitle: c.brand?.name,
        url: `/collection/${c.id}`,
        image: c.image || undefined,
      })),
    products: sortByRelevance(productRows.filter(isPublic), query, (p) => p.title)
      .slice(0, LIMITS.product)
      .map((p) => ({
        id: p.id,
        type: "product",
        title: p.title,
        subtitle: joinParts(p.brand?.name, p.category),
        url: `/product/${p.id}`,
        image: p.image || undefined,
      })),
  };
}

function searchEditions(query: string): SearchHit[] {
  const matches = getAllEditions().filter((edition) =>
    matchesAllTerms(
      `${edition.title} edition ${edition.number} ${edition.city} ${edition.country} ${edition.venue ?? ""}`,
      query,
    ),
  );
  return sortByRelevance(matches, query, (e) => e.title)
    .slice(0, LIMITS.edition)
    .map((edition) => ({
      id: edition.slug,
      type: "edition",
      title: edition.title,
      subtitle: joinParts(edition.dateLabel, edition.city),
      url: `/editions/${edition.slug}`,
      image: edition.coverImage || undefined,
    }));
}

/**
 * Search everything a visitor can see. Collections and products are only
 * searched while catalogues are publicly visible (Studio > Settings), and
 * anything from a brand whose application isn't approved is left out.
 * A failing source is logged and skipped rather than failing the search.
 */
export async function searchSite(query: string): Promise<SearchResponse> {
  const db = publicClient();

  const [brands, catalogueItems] = await Promise.allSettled([
    searchBrands(db, query),
    cataloguesArePublic(db).then((visible) =>
      visible
        ? searchCatalogueItems(db, query)
        : { collections: [], products: [] },
    ),
  ]);

  const settled = <T,>(result: PromiseSettledResult<T>, fallback: T): T => {
    if (result.status === "fulfilled") return result.value;
    console.error("[search]", result.reason);
    return fallback;
  };
  const { collections, products } = settled(catalogueItems, {
    collections: [],
    products: [],
  });

  const ordered: [SearchHitType, SearchHit[]][] = [
    ["brand", settled(brands, [])],
    ["collection", collections],
    ["product", products],
    ["edition", searchEditions(query)],
    ["page", searchSitePages(query, LIMITS.page)],
  ];

  const groups: SearchGroup[] = ordered
    .filter(([, hits]) => hits.length > 0)
    .map(([type, hits]) => ({ type, label: SEARCH_GROUP_LABELS[type], hits }));

  return { query, groups };
}
