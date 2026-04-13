import { z } from "zod";

const emptyToNull = (s: string | undefined) => {
  if (s == null) return null;
  const t = s.trim();
  return t.length === 0 ? null : t;
};

/** Empty or omitted → null; otherwise normalized http(s) URL or validation error. */
const optionalWebsite = z
  .string()
  .max(500)
  .optional()
  .transform((raw) => {
    const t = emptyToNull(raw);
    if (t == null) return null;
    const withProto = /^https?:\/\//i.test(t) ? t : `https://${t}`;
    try {
      return new URL(withProto).href.slice(0, 500);
    } catch {
      return "__invalid_url__";
    }
  })
  .refine((v) => v !== "__invalid_url__", {
    message: "Invalid website URL",
  });

/** POST /api/designer-application JSON body (matches app/join/page.tsx field names). */
export const designerApplicationBodySchema = z
  .object({
    brandName: z.string().trim().min(1).max(200),
    designerName: z.string().trim().min(1).max(200),
    email: z.string().trim().email().max(320),
    phone: z
      .union([z.string(), z.null()])
      .optional()
      .transform((v) => (v == null ? null : emptyToNull(v))),
    website: optionalWebsite,
    instagram: z
      .union([z.string(), z.null()])
      .optional()
      .transform((s) => {
        if (s == null) return null;
        const t = emptyToNull(s);
        if (t == null) return null;
        return t.replace(/^@+/, "").slice(0, 100);
      }),
    location: z.string().trim().min(1).max(300),
    category: z.string().trim().min(1).max(120),
    description: z.string().trim().min(1).max(20_000),
    yearFounded: z
      .union([z.string(), z.null()])
      .optional()
      .transform((v) => (v == null ? null : emptyToNull(v))),
  })
  .strip();

export type DesignerApplicationBody = z.infer<typeof designerApplicationBodySchema>;

export function parseYearFounded(yearFounded: string | null): number | null {
  if (yearFounded == null) return null;
  const parsed = parseInt(yearFounded, 10);
  if (Number.isNaN(parsed) || parsed < 1 || parsed > 9999) return null;
  return parsed;
}
