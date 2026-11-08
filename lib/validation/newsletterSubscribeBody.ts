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
    // null allowed: older cached forms send null for a blank name.
    firstName: z.string().trim().max(120).nullish().transform((v) => v ?? undefined),
    lastName: z.string().trim().max(120).nullish().transform((v) => v ?? undefined),
    // An unknown source should never block a signup; record it as "other".
    source: newsletterSourceSchema.optional().default("website").catch("other"),
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

export type NewsletterSource = z.infer<typeof newsletterSourceSchema>;

/** The JSON body every newsletter form POSTs to /api/newsletter/subscribe. */
export function buildNewsletterSubscribePayload(input: {
  email: string;
  firstName?: string;
  lastName?: string;
  source: NewsletterSource;
  honeypot?: string;
}) {
  return {
    email: input.email.trim(),
    firstName: input.firstName?.trim() || undefined,
    lastName: input.lastName?.trim() || undefined,
    source: input.source,
    _newsletter_hp: input.honeypot ?? "",
  };
}
