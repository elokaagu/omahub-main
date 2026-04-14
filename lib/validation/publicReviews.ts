import { z } from "zod";

export const publicReviewPostSchema = z
  .object({
    brandId: z.string().trim().min(1).max(200),
    comment: z.string().trim().min(3).max(5000),
    rating: z.coerce.number().min(1).max(5),
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
    author: z.string().trim().max(200).optional(),
  })
  .strict();

export const publicReviewGetQuerySchema = z.object({
  brandId: z.string().trim().min(1).max(200),
});

export function parsePublicReviewPost(raw: unknown) {
  return publicReviewPostSchema.safeParse(raw);
}

export function parsePublicReviewGet(searchParams: URLSearchParams) {
  return publicReviewGetQuerySchema.safeParse({
    brandId: searchParams.get("brandId") ?? undefined,
  });
}
