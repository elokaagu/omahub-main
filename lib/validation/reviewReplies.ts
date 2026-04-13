import { z } from "zod";

const uuid = z.string().uuid();

export const reviewReplyCreateSchema = z.object({
  reviewId: uuid,
  replyText: z.string().trim().min(1).max(8000),
});

export const reviewReplyUpdateSchema = z.object({
  replyId: uuid,
  replyText: z.string().trim().min(1).max(8000),
});

export const reviewReplyDeleteQuerySchema = z.object({
  id: uuid,
});

export function parseReviewReplyDeleteQuery(searchParams: URLSearchParams) {
  return reviewReplyDeleteQuerySchema.safeParse({
    id: searchParams.get("id") ?? undefined,
  });
}
