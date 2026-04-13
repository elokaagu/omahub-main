import { z } from "zod";
import {
  leadPrioritySchema,
  leadSourceSchema,
  leadTypeSchema,
} from "@/lib/validation/adminLeads";

export const publicLeadPostBodySchema = z
  .object({
    brandId: z.string().min(1).max(200),
    name: z.string().trim().min(1).max(500),
    email: z.string().trim().email().max(500),
    phone: z.string().trim().max(100).optional(),
    source: leadSourceSchema,
    leadType: leadTypeSchema,
    notes: z.string().max(50_000).optional(),
    estimatedValue: z.number().nonnegative().optional(),
    priority: leadPrioritySchema.optional().default("normal"),
  })
  .strict();

export type PublicLeadPostBody = z.infer<typeof publicLeadPostBodySchema>;

export function isPublicLeadHoneypotTriggered(raw: unknown): boolean {
  if (typeof raw !== "object" || raw === null) return false;
  const hp = (raw as Record<string, unknown>)["_lead_hp"];
  return typeof hp === "string" && hp.trim().length > 0;
}

/** Remove honeypot before Zod `.strict()` parsing. */
export function stripPublicLeadHoneypotFields(raw: unknown): unknown {
  if (typeof raw !== "object" || raw === null) return raw;
  const { _lead_hp: _h, ...rest } = raw as Record<string, unknown>;
  return rest;
}
