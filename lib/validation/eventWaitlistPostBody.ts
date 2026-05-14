import { z } from "zod";

/** First line of `leads.notes` for sitewide event preorder signups; used to filter in Studio. */
export const EVENT_WAITLIST_LEAD_NOTES_MARKER =
  "EVENT PREORDER / WAITLIST (sitewide)" as const;

export const eventWaitlistPostBodySchema = z
  .object({
    name: z.string().trim().min(1).max(500),
    email: z.string().trim().email().max(500),
    phone: z.string().trim().max(100).optional(),
    requestedBrand: z.string().trim().min(1).max(500),
    itemDescription: z.string().trim().min(1).max(2000),
    size: z.string().trim().min(1).max(200),
    colour: z.string().trim().max(500).optional(),
    additionalNotes: z.string().trim().max(5000).optional(),
  })
  .strict();

export type EventWaitlistPostBody = z.infer<typeof eventWaitlistPostBodySchema>;

export function isEventWaitlistHoneypotTriggered(raw: unknown): boolean {
  if (typeof raw !== "object" || raw === null) return false;
  const hp = (raw as Record<string, unknown>)["_evt_hp"];
  return typeof hp === "string" && hp.trim().length > 0;
}

/** Remove honeypot before Zod `.strict()` parsing. */
export function stripEventWaitlistHoneypotFields(raw: unknown): unknown {
  if (typeof raw !== "object" || raw === null) return raw;
  const { _evt_hp: _h, ...rest } = raw as Record<string, unknown>;
  return rest;
}

export function buildEventWaitlistLeadNotes(p: EventWaitlistPostBody): string {
  const lines = [
    EVENT_WAITLIST_LEAD_NOTES_MARKER,
    `Designer / brand requested: ${p.requestedBrand}`,
    `Item / style: ${p.itemDescription}`,
    `Size: ${p.size}`,
  ];
  if (p.colour?.trim()) lines.push(`Colour / variant: ${p.colour.trim()}`);
  if (p.additionalNotes?.trim()) {
    lines.push(`Additional notes: ${p.additionalNotes.trim()}`);
  }
  if (p.phone?.trim()) lines.push(`Phone: ${p.phone.trim()}`);
  return lines.join("\n");
}
