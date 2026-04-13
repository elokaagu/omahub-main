import { z } from "zod";

export const adminReviewsListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(10_000).catch(1),
  limit: z.coerce.number().int().min(1).max(100).catch(20),
  brandId: z.string().trim().min(1).max(200).optional(),
});

export function parseAdminReviewsListQuery(searchParams: URLSearchParams) {
  const brandRaw = searchParams.get("brandId");
  return adminReviewsListQuerySchema.safeParse({
    page: searchParams.get("page") ?? undefined,
    limit: searchParams.get("limit") ?? undefined,
    brandId: brandRaw && brandRaw.trim() !== "" ? brandRaw : undefined,
  });
}

export const adminReviewDeleteQuerySchema = z.object({
  id: z.string().uuid(),
});

export function parseAdminReviewDeleteQuery(searchParams: URLSearchParams) {
  return adminReviewDeleteQuerySchema.safeParse({
    id: searchParams.get("id") ?? undefined,
  });
}
