import { mapLegacyToUnified } from "@/lib/data/unified-categories";
import { mapOccasionToCategory } from "@/lib/data/directory";
import type { BrandDisplay } from "./directoryBrandMap";

export const ALL_CATEGORIES = "All Categories";
export const ALL_LOCATIONS = "All Locations";
/** Brands rendered before "Show more". */
export const PAGE_SIZE = 24;

export const SORT_OPTIONS = [
  { value: "featured", label: "Featured" },
  { value: "name", label: "Name A–Z" },
  { value: "rating", label: "Highest rated" },
] as const;

export type SortValue = (typeof SORT_OPTIONS)[number]["value"];

export type DirectoryBrand = BrandDisplay & { rating?: number };

export type DirectoryQuery = {
  q: string;
  category: string;
  location: string;
  sort: SortValue;
  view: "grid" | "list";
  limit: number;
};

type RawParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
}

/**
 * Read the directory state out of the URL. Legacy `occasion` and
 * `subcategory` links still resolve to a category.
 */
export function parseDirectoryQuery(params: RawParams): DirectoryQuery {
  const occasion = first(params.occasion);
  const subcategory = first(params.subcategory).replace(/\+/g, " ");
  const category =
    (occasion && mapOccasionToCategory(occasion)) ||
    subcategory ||
    first(params.category) ||
    ALL_CATEGORIES;

  const sortRaw = first(params.sort) as SortValue;
  const limitRaw = Number.parseInt(first(params.limit), 10);

  return {
    q: first(params.q).slice(0, 80),
    category,
    location: first(params.location) || ALL_LOCATIONS,
    sort: SORT_OPTIONS.some((option) => option.value === sortRaw)
      ? sortRaw
      : "featured",
    view: first(params.view) === "list" ? "list" : "grid",
    limit:
      Number.isFinite(limitRaw) && limitRaw > 0
        ? Math.min(limitRaw, 500)
        : PAGE_SIZE,
  };
}

/** URL for the directory with some of the query replaced. */
export function directoryHref(
  query: DirectoryQuery,
  changes: Partial<DirectoryQuery>,
): string {
  const next = { ...query, ...changes };
  const params = new URLSearchParams();
  if (next.q) params.set("q", next.q);
  if (next.category !== ALL_CATEGORIES) params.set("category", next.category);
  if (next.location !== ALL_LOCATIONS) params.set("location", next.location);
  if (next.sort !== "featured") params.set("sort", next.sort);
  if (next.view !== "grid") params.set("view", next.view);
  // A new filter always starts from the first page.
  if (next.limit !== PAGE_SIZE && changes.limit !== undefined) {
    params.set("limit", String(next.limit));
  }
  const search = params.toString();
  return search ? `/directory?${search}` : "/directory";
}

export function matchesCategory(brand: DirectoryBrand, category: string): boolean {
  if (category === ALL_CATEGORIES) return true;
  const wanted = mapLegacyToUnified(category);
  return [brand.category, ...(brand.categories ?? [])]
    .filter(Boolean)
    .some((value) => mapLegacyToUnified(value) === wanted);
}

export function filterDirectoryBrands(
  brands: DirectoryBrand[],
  query: Pick<DirectoryQuery, "q" | "category" | "location">,
): DirectoryBrand[] {
  const term = query.q.trim().toLowerCase();
  return brands.filter((brand) => {
    if (
      term &&
      !`${brand.name} ${brand.category} ${brand.location}`
        .toLowerCase()
        .includes(term)
    ) {
      return false;
    }
    if (!matchesCategory(brand, query.category)) return false;
    if (query.location !== ALL_LOCATIONS && brand.location !== query.location) {
      return false;
    }
    return true;
  });
}

export function sortDirectoryBrands(
  brands: DirectoryBrand[],
  sort: SortValue,
): DirectoryBrand[] {
  const byName = (a: DirectoryBrand, b: DirectoryBrand) =>
    a.name.localeCompare(b.name);
  const copy = [...brands];

  if (sort === "name") return copy.sort(byName);
  if (sort === "rating") {
    return copy.sort(
      (a, b) => (b.rating ?? 0) - (a.rating ?? 0) || byName(a, b),
    );
  }
  // Featured: verified designers first, then alphabetical.
  return copy.sort(
    (a, b) => Number(b.isVerified) - Number(a.isVerified) || byName(a, b),
  );
}

export type FilterChip = { label: string; clear: Partial<DirectoryQuery> };

/** The active filters, as removable chips. */
export function activeFilterChips(query: DirectoryQuery): FilterChip[] {
  const chips: FilterChip[] = [];
  if (query.q) chips.push({ label: `“${query.q}”`, clear: { q: "" } });
  if (query.category !== ALL_CATEGORIES) {
    chips.push({ label: query.category, clear: { category: ALL_CATEGORIES } });
  }
  if (query.location !== ALL_LOCATIONS) {
    chips.push({ label: query.location, clear: { location: ALL_LOCATIONS } });
  }
  return chips;
}
