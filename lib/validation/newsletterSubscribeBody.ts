import { z } from "zod";

export const newsletterSourceSchema = z.enum([
  "website",
  "contact_page",
  "footer",
  "modal",
  "studio",
  "other",
]);

export const newsletterSubscribeBodySchema = z
  .object({
    email: z.string().trim().email().max(320),
    firstName: z.string().trim().max(120).optional(),
    lastName: z.string().trim().max(120).optional(),
    source: newsletterSourceSchema.optional().default("website"),
    _newsletter_hp: z.string().optional(),
  })
  .strip();

export type NewsletterSubscribeBody = z.infer<typeof newsletterSubscribeBodySchema>;

export function parseNewsletterSubscribeBody(raw: unknown) {
  return newsletterSubscribeBodySchema.safeParse(raw);
}

export function isNewsletterHoneypotTriggered(raw: unknown): boolean {
  if (typeof raw !== "object" || raw === null) return false;
  const hp = (raw as Record<string, unknown>)["_newsletter_hp"];
  return typeof hp === "string" && hp.trim().length > 0;
}
