import { z } from "zod";

export const faqCategorySchema = z.enum([
  "general",
  "designers",
  "customers",
  "platform",
  "billing",
  "shipping",
]);

export const faqPageLocationSchema = z.enum([
  "general",
  "how-it-works",
  "contact",
  "join",
  "all",
]);

/** FAQ row id (Supabase typically uses uuid). */
export const faqIdSchema = z.string().uuid();

export const faqCreateSchema = z.object({
  question: z.string().trim().min(1).max(2000),
  answer: z.string().trim().min(1).max(100_000),
  category: faqCategorySchema.optional().default("general"),
  display_order: z.coerce.number().int().min(0).max(99_999).optional().default(0),
  page_location: faqPageLocationSchema.optional().default("general"),
  is_active: z.boolean().optional().default(true),
});

export const faqUpdateSchema = z.object({
  id: faqIdSchema,
  question: z.string().trim().min(1).max(2000),
  answer: z.string().trim().min(1).max(100_000),
  category: faqCategorySchema.optional(),
  display_order: z.coerce.number().int().min(0).max(99_999).optional(),
  page_location: faqPageLocationSchema.optional(),
  is_active: z.boolean().optional(),
});

/** Partial FAQ patch (e.g., active toggle) */
export const faqPatchSchema = z
  .object({
    id: faqIdSchema,
    question: z.string().trim().min(1).max(2000).optional(),
    answer: z.string().trim().min(1).max(100_000).optional(),
    category: faqCategorySchema.optional(),
    display_order: z.coerce.number().int().min(0).max(99_999).optional(),
    page_location: faqPageLocationSchema.optional(),
    is_active: z.boolean().optional(),
  })
  .refine(
    (data) =>
      data.question !== undefined ||
      data.answer !== undefined ||
      data.category !== undefined ||
      data.display_order !== undefined ||
      data.page_location !== undefined ||
      data.is_active !== undefined,
    {
      message: "At least one field must be provided",
    }
  );

export type FaqCreateInput = z.infer<typeof faqCreateSchema>;
export type FaqUpdateInput = z.infer<typeof faqUpdateSchema>;
export type FaqPatchInput = z.infer<typeof faqPatchSchema>;
