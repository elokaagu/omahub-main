import { z } from "zod";

const hpIssue = { message: "Invalid request", path: ["_contact_hp"] };

/** Designer contact (modal) — `_contact_hp` must stay empty (hidden field). */
export const brandContactBodySchema = z
  .object({
    name: z.string().trim().min(1).max(200),
    email: z.string().trim().email().max(320),
    message: z.string().trim().min(1).max(20_000),
    brandId: z.string().uuid("Invalid brand"),
    brandName: z.string().trim().min(1).max(300),
    _contact_hp: z.string().optional(),
  })
  .strip()
  .refine(
    (data) => !(data._contact_hp && data._contact_hp.trim().length > 0),
    hpIssue
  );

/** General /contact page — message min length aligned with client validation. */
export const generalContactBodySchema = z
  .object({
    name: z.string().trim().min(1).max(200),
    email: z.string().trim().email().max(320),
    subject: z.string().trim().min(1).max(500),
    message: z.string().trim().min(10).max(20_000),
    _contact_hp: z.string().optional(),
  })
  .strip()
  .refine(
    (data) => !(data._contact_hp && data._contact_hp.trim().length > 0),
    hpIssue
  );

export type BrandContactParsed = z.infer<typeof brandContactBodySchema>;
export type GeneralContactParsed = z.infer<typeof generalContactBodySchema>;

export type ContactParseResult =
  | { ok: true; kind: "brand"; data: BrandContactParsed }
  | { ok: true; kind: "general"; data: GeneralContactParsed }
  | { ok: false; error: z.ZodError };

const notObjectError = new z.ZodError([
  {
    code: z.ZodIssueCode.custom,
    message: "Expected a JSON object",
    path: [],
  },
]);

export function parseContactPostBody(raw: unknown): ContactParseResult {
  if (typeof raw !== "object" || raw === null) {
    return { ok: false, error: notObjectError };
  }

  const o = raw as Record<string, unknown>;
  const looksBrand =
    typeof o.brandId === "string" &&
    o.brandId.length > 0 &&
    typeof o.brandName === "string" &&
    o.brandName.trim().length > 0;

  if (looksBrand) {
    const r = brandContactBodySchema.safeParse(raw);
    return r.success
      ? { ok: true, kind: "brand", data: r.data }
      : { ok: false, error: r.error };
  }

  const r = generalContactBodySchema.safeParse(raw);
  return r.success
    ? { ok: true, kind: "general", data: r.data }
    : { ok: false, error: r.error };
}
