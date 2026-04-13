import { z } from "zod";

export const favouriteItemTypeSchema = z.enum(["brand", "catalogue", "product"]);

export const favouriteItemIdSchema = z.string().trim().min(1).max(128);

export type FavouriteItemType = z.infer<typeof favouriteItemTypeSchema>;

const postNormalizedSchema = z.object({
  item_id: favouriteItemIdSchema,
  item_type: favouriteItemTypeSchema,
});

export function parseFavouritePostBody(raw: unknown) {
  if (raw == null || typeof raw !== "object") {
    return {
      success: false as const,
      error: new z.ZodError([
        {
          code: z.ZodIssueCode.custom,
          message: "Expected object body",
          path: [],
        },
      ]),
    };
  }
  const o = raw as Record<string, unknown>;
  const item_id =
    typeof o.item_id === "string"
      ? o.item_id
      : typeof o.itemId === "string"
        ? o.itemId
        : undefined;
  const item_type =
    typeof o.item_type === "string"
      ? o.item_type
      : typeof o.itemType === "string"
        ? o.itemType
        : undefined;

  return postNormalizedSchema.safeParse({ item_id, item_type });
}

export function parseFavouriteDeleteQuery(searchParams: URLSearchParams) {
  const item_id =
    searchParams.get("itemId") || searchParams.get("item_id") || undefined;
  const item_type =
    searchParams.get("itemType") || searchParams.get("item_type") || undefined;

  return postNormalizedSchema.safeParse({ item_id, item_type });
}
