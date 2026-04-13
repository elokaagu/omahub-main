import { z } from "zod";

/** Dashboard-style recent signups: optional window and page size. */
export const recentAccountsQuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(90).optional().default(7),
  limit: z.coerce.number().int().min(1).max(50).optional().default(10),
});

export type RecentAccountsQuery = z.infer<typeof recentAccountsQuerySchema>;
