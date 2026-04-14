import { z } from "zod";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => {
      const t = v?.trim();
      return t ? t : null;
    });

const measurementsSchema = z
  .object({
    fit_preference: optionalText(50),
    length_preference: optionalText(50),
    sleeve_preference: optionalText(50),
    height: optionalText(50),
    weight: optionalText(50),
    chest: optionalText(50),
    waist: optionalText(50),
    hips: optionalText(50),
    inseam: optionalText(50),
    shoulder: optionalText(50),
    arm_length: optionalText(50),
    neck: optionalText(50),
    custom_measurements: optionalText(4000),
  })
  .partial()
  .optional()
  .transform((v) => v ?? {});

const deliveryAddressSchema = z.object({
  full_name: z.string().trim().min(1).max(200),
  email: z.string().trim().email().max(320),
  phone: z.string().trim().max(50).optional().transform((v) => v?.trim() || ""),
  address_line_1: z.string().trim().min(1).max(500),
  city: z.string().trim().min(1).max(120),
  state: z.string().trim().min(1).max(120),
  postal_code: z.string().trim().min(1).max(40),
  country: z.string().trim().min(1).max(120),
});

export const customOrderBodySchema = z
  .object({
    user_id: z.string().uuid().optional().nullable(),
    product_id: z.string().min(1).max(200),
    brand_id: z.string().min(1).max(200),
    customer_notes: optionalText(10000),
    delivery_address: deliveryAddressSchema,
    total_amount: z.number().positive().max(10_000_000).optional().nullable(),
    size: optionalText(80),
    color: optionalText(80),
    quantity: z.number().int().min(1).max(100).optional().default(1),
    measurements: measurementsSchema,
    _order_hp: z.string().optional(),
  })
  .strip();

export type CustomOrderBody = z.infer<typeof customOrderBodySchema>;

export function parseCustomOrderBody(raw: unknown) {
  return customOrderBodySchema.safeParse(raw);
}

export function isCustomOrderHoneypotTriggered(raw: unknown): boolean {
  if (typeof raw !== "object" || raw === null) return false;
  const hp = (raw as Record<string, unknown>)["_order_hp"];
  return typeof hp === "string" && hp.trim().length > 0;
}
