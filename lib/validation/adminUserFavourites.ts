import { z } from "zod";

export const adminUserFavouritesQuerySchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .max(320)
    .email("Invalid email")
    .transform((s) => s.trim().toLowerCase()),
});

export function parseAdminUserFavouritesQuery(searchParams: URLSearchParams) {
  return adminUserFavouritesQuerySchema.safeParse({
    email: searchParams.get("email") ?? "",
  });
}
