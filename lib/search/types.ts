export type SearchHitType =
  | "brand"
  | "collection"
  | "product"
  | "edition"
  | "page";

export type SearchHit = {
  id: string;
  type: SearchHitType;
  title: string;
  /** Secondary line, e.g. "Womenswear · Lagos" or the brand name. */
  subtitle?: string;
  url: string;
  image?: string;
  verified?: boolean;
};

export type SearchGroup = {
  type: SearchHitType;
  label: string;
  hits: SearchHit[];
};

export type SearchResponse = {
  query: string;
  /** Non-empty groups only, in display order. */
  groups: SearchGroup[];
};

export const SEARCH_GROUP_LABELS: Record<SearchHitType, string> = {
  brand: "Designers",
  collection: "Collections",
  product: "Products",
  edition: "Editions",
  page: "Pages",
};
