import { z } from "zod";

const roleSchema = z.enum([
  "user",
  "brand_admin",
  "super_admin",
  "brand_owner",
]);

export const adminUsersListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(10_000).catch(1),
  limit: z.coerce.number().int().min(1).max(500).catch(100),
  search: z.string().trim().max(200).optional(),
  role: roleSchema.optional(),
});

export function parseAdminUsersListQuery(searchParams: URLSearchParams) {
  const roleRaw = searchParams.get("role");
  return adminUsersListQuerySchema.safeParse({
    page: searchParams.get("page") ?? undefined,
    limit: searchParams.get("limit") ?? undefined,
    search: searchParams.get("search") ?? undefined,
    role: roleRaw && roleRaw !== "" ? roleRaw : undefined,
  });
}

const brandIdSchema = z.string().min(1).max(200);

export const adminUserUpsertBodySchema = z
  .object({
    email: z
      .string()
      .trim()
      .email()
      .max(320)
      .transform((s) => s.toLowerCase()),
    role: roleSchema,
    owned_brands: z.array(brandIdSchema).max(500).optional().default([]),
  })
  .transform((d) => ({
    ...d,
    role: d.role === "brand_owner" ? ("brand_admin" as const) : d.role,
  }));

export type AdminUserUpsertBody = z.infer<typeof adminUserUpsertBodySchema>;

export const adminUserDeleteQuerySchema = z.object({
  id: z.string().uuid(),
});

export function parseAdminUserDeleteQuery(searchParams: URLSearchParams) {
  return adminUserDeleteQuerySchema.safeParse({
    id: searchParams.get("id") ?? undefined,
  });
}

/** Escape `%` and `_` for PostgREST `ilike` patterns. */
export function sanitizeIlikeSearch(raw: string): string {
  return raw.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}
