import { z } from "zod";

const uuid = z.string().uuid();

/** When present, must be exactly 3 letters (normalized to uppercase). */
export const iso4217CurrencySchema = z
  .string()
  .trim()
  .regex(/^[A-Za-z]{3}$/, "Currency must be exactly 3 letters (ISO 4217)")
  .transform((c) => c.toUpperCase());

export const leadSourceSchema = z.enum([
  "website",
  "whatsapp",
  "instagram",
  "email",
  "phone",
  "referral",
  "direct",
]);

export const leadTypeSchema = z.enum([
  "inquiry",
  "quote_request",
  "booking_intent",
  "consultation",
  "product_interest",
]);

export const leadStatusSchema = z.enum([
  "new",
  "contacted",
  "qualified",
  "converted",
  "lost",
  "closed",
]);

export const leadPrioritySchema = z.enum(["low", "normal", "high", "urgent"]);

export const bookingTypeSchema = z.enum([
  "custom_order",
  "ready_to_wear",
  "consultation",
  "fitting",
  "alteration",
  "rental",
]);

export const bookingStatusSchema = z.enum([
  "confirmed",
  "in_progress",
  "completed",
  "cancelled",
  "refunded",
]);

const pageSchema = z.coerce.number().int().min(1).max(10_000).catch(1);
const limitSchema = z.coerce.number().int().min(1).max(100).catch(20);

/** GET /api/admin/leads (list only; analytics lives under /api/admin/leads/analytics). */
export const leadsListQuerySchema = z.object({
  page: pageSchema.optional(),
  limit: limitSchema.optional(),
  status: leadStatusSchema.optional(),
  source: leadSourceSchema.optional(),
  priority: leadPrioritySchema.optional(),
  brandId: z.string().min(1).max(200).optional(),
  search: z.string().optional(),
});

export function parseLeadsListQuery(searchParams: URLSearchParams) {
  const raw = {
    page: searchParams.get("page") ?? undefined,
    limit: searchParams.get("limit") ?? undefined,
    status: searchParams.get("status") ?? undefined,
    source: searchParams.get("source") ?? undefined,
    priority: searchParams.get("priority") ?? undefined,
    brandId: searchParams.get("brandId") ?? undefined,
    search: searchParams.get("search") ?? undefined,
  };
  return leadsListQuerySchema.safeParse(raw);
}

/**
 * Sanitize free-text for PostgREST `.or()` ilike clauses: commas split OR branches;
 * % and _ are LIKE wildcards.
 */
export function sanitizeLeadSearch(raw: string | undefined): string | undefined {
  if (raw == null) return undefined;
  const t = raw.trim().slice(0, 120);
  if (!t) return undefined;
  const collapsed = t
    .replace(/,/g, " ")
    .replace(/%/g, "")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return collapsed || undefined;
}

/** Raw POST body (no transform) so it can sit inside `discriminatedUnion`. */
export const leadCreateInputSchema = z
  .object({
    brand_id: z.string().min(1).max(200),
    customer_name: z.string().trim().min(1).max(500),
    customer_email: z.string().trim().email().max(500),
    customer_phone: z.string().trim().max(100).optional(),
    source: leadSourceSchema,
    lead_type: leadTypeSchema,
    status: leadStatusSchema.optional().default("new"),
    priority: leadPrioritySchema.optional(),
    estimated_value: z.number().nonnegative().optional(),
    estimated_budget: z.number().nonnegative().optional(),
    project_timeline: z.string().max(2000).optional(),
    timeline: z.string().max(2000).optional(),
    notes: z.string().max(50_000).optional(),
  })
  .strict();

export type LeadCreateInput = z.infer<typeof leadCreateInputSchema>;

export function normalizeLeadCreateForDb(input: LeadCreateInput) {
  const { timeline, project_timeline, ...rest } = input;
  return {
    ...rest,
    project_timeline: project_timeline ?? timeline,
  };
}

export const bookingCreateSchema = z
  .object({
    lead_id: uuid.optional(),
    brand_id: z.string().min(1).max(200),
    customer_name: z.string().trim().min(1).max(500),
    customer_email: z.string().trim().email().max(500),
    customer_phone: z.string().trim().max(100).optional(),
    booking_type: bookingTypeSchema,
    status: bookingStatusSchema.optional().default("confirmed"),
    booking_value: z.number().nonnegative(),
    commission_rate: z.number().nonnegative().max(100).optional(),
    commission_amount: z.number().nonnegative().optional(),
    currency: iso4217CurrencySchema.optional(),
    booking_date: z.string().max(50).optional(),
    delivery_date: z.string().max(50).optional(),
    completion_date: z.string().max(50).optional(),
    notes: z.string().max(50_000).optional(),
  })
  .strict();

export const interactionCreateSchema = z
  .object({
    lead_id: uuid,
    interaction_type: z.enum([
      "email",
      "phone",
      "whatsapp",
      "meeting",
      "quote_sent",
      "follow_up",
      "note",
    ]),
    description: z.string().max(20_000).optional(),
  })
  .strict();

export const postLeadsBodySchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("lead"), data: leadCreateInputSchema }),
  z.object({ type: z.literal("booking"), data: bookingCreateSchema }),
  z.object({ type: z.literal("interaction"), data: interactionCreateSchema }),
]);

function stripUndefined<T extends Record<string, unknown>>(o: T): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(o).filter(([, v]) => v !== undefined)
  ) as Record<string, unknown>;
}

export const leadUpdateInputSchema = z
  .object({
    brand_id: z.string().min(1).max(200).optional(),
    customer_name: z.string().trim().min(1).max(500).optional(),
    customer_email: z.string().trim().email().max(500).optional(),
    customer_phone: z.string().trim().max(100).optional().nullable(),
    source: leadSourceSchema.optional(),
    lead_type: leadTypeSchema.optional(),
    status: leadStatusSchema.optional(),
    priority: leadPrioritySchema.optional().nullable(),
    estimated_value: z.number().nonnegative().optional().nullable(),
    estimated_budget: z.number().nonnegative().optional().nullable(),
    project_timeline: z.string().max(2000).optional().nullable(),
    timeline: z.string().max(2000).optional(),
    notes: z.string().max(50_000).optional().nullable(),
    contacted_at: z.string().max(50).optional().nullable(),
    qualified_at: z.string().max(50).optional().nullable(),
    converted_at: z.string().max(50).optional().nullable(),
  })
  .strict();

export type LeadUpdateInput = z.infer<typeof leadUpdateInputSchema>;

export function normalizeLeadUpdatePatch(input: LeadUpdateInput): Record<string, unknown> {
  const { timeline, project_timeline, ...rest } = input;
  const next: Record<string, unknown> = { ...rest };
  if (timeline !== undefined) next.project_timeline = timeline;
  else if (project_timeline !== undefined) next.project_timeline = project_timeline;
  return stripUndefined(next);
}

export const bookingUpdateInputSchema = z
  .object({
    lead_id: uuid.optional().nullable(),
    brand_id: z.string().min(1).max(200).optional(),
    customer_name: z.string().trim().min(1).max(500).optional(),
    customer_email: z.string().trim().email().max(500).optional(),
    customer_phone: z.string().trim().max(100).optional().nullable(),
    booking_type: bookingTypeSchema.optional(),
    status: bookingStatusSchema.optional(),
    booking_value: z.number().nonnegative().optional(),
    commission_rate: z.number().nonnegative().max(100).optional().nullable(),
    commission_amount: z.number().nonnegative().optional().nullable(),
    currency: z.union([z.null(), iso4217CurrencySchema]).optional(),
    booking_date: z.string().max(50).optional().nullable(),
    delivery_date: z.string().max(50).optional().nullable(),
    completion_date: z.string().max(50).optional().nullable(),
    notes: z.string().max(50_000).optional().nullable(),
  })
  .strict();

export type BookingUpdateInput = z.infer<typeof bookingUpdateInputSchema>;

export function normalizeBookingUpdatePatch(
  input: BookingUpdateInput
): Record<string, unknown> {
  return stripUndefined({ ...input } as Record<string, unknown>);
}

export const commissionStructureUpdateInputSchema = z
  .object({
    brand_id: z.string().max(200).nullable().optional(),
    booking_type: z.string().max(50).optional(),
    min_booking_value: z.number().nonnegative().optional(),
    max_booking_value: z.number().nonnegative().optional().nullable(),
    commission_rate: z.number().nonnegative().max(100).optional(),
    currency: iso4217CurrencySchema.optional(),
    is_active: z.boolean().optional(),
    effective_date: z.string().max(50).optional(),
  })
  .strict();

export type CommissionStructureUpdateInput = z.infer<
  typeof commissionStructureUpdateInputSchema
>;

export function normalizeCommissionStructureUpdatePatch(
  input: CommissionStructureUpdateInput
): Record<string, unknown> {
  return stripUndefined({ ...input } as Record<string, unknown>);
}

export const putLeadsBodySchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("lead"),
    id: uuid,
    data: leadUpdateInputSchema,
  }),
  z.object({
    type: z.literal("booking"),
    id: uuid,
    data: bookingUpdateInputSchema,
  }),
  z.object({
    type: z.literal("commission_structure"),
    id: uuid,
    data: commissionStructureUpdateInputSchema,
  }),
]);

export const deleteLeadsQuerySchema = z.object({
  type: z.enum(["lead", "booking", "interaction"]),
  id: uuid,
});

export function parseDeleteLeadsQuery(searchParams: URLSearchParams) {
  return deleteLeadsQuerySchema.safeParse({
    type: searchParams.get("type") ?? undefined,
    id: searchParams.get("id") ?? undefined,
  });
}

/** POST /api/admin/leads — flat body, strict (no unknown keys). */
export const postAdminLeadBodySchema = leadCreateInputSchema;

/** PUT /api/admin/leads */
export const putAdminLeadBodySchema = z
  .object({
    id: uuid,
    data: leadUpdateInputSchema,
  })
  .strict();

/** DELETE /api/admin/leads?id= */
export const deleteAdminLeadQuerySchema = z.object({ id: uuid });
export function parseDeleteAdminLeadQuery(searchParams: URLSearchParams) {
  return deleteAdminLeadQuerySchema.safeParse({
    id: searchParams.get("id") ?? undefined,
  });
}

/** POST /api/admin/bookings */
export const postAdminBookingBodySchema = bookingCreateSchema;

/** PUT /api/admin/bookings */
export const putAdminBookingBodySchema = z
  .object({
    id: uuid,
    data: bookingUpdateInputSchema,
  })
  .strict();

export const deleteAdminEntityQuerySchema = z.object({ id: uuid });
export function parseDeleteAdminEntityQuery(searchParams: URLSearchParams) {
  return deleteAdminEntityQuerySchema.safeParse({
    id: searchParams.get("id") ?? undefined,
  });
}

/** POST /api/admin/lead-interactions */
export const postAdminLeadInteractionBodySchema = interactionCreateSchema;

/** PUT /api/admin/commission-structure */
export const putAdminCommissionStructureBodySchema = z
  .object({
    id: uuid,
    data: commissionStructureUpdateInputSchema,
  })
  .strict();
