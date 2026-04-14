/**
 * Normalised favourite row for UI (enriched GET / optimistic add).
 * Always use `item_type` to distinguish brand / catalogue / product — do not infer from optional fields.
 */
export type FavouriteItem = {
  id: string;
  item_type: "brand" | "catalogue" | "product";
  /** `favourites` table row id when persisted. */
  favourite_id?: string;
  name?: string;
  title?: string;
  image?: string;
  category?: string;
  location?: string;
  price?: string | number;
  brand_id?: string;
  created_at?: string;
};
