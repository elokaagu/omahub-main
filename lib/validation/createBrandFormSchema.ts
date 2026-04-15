import { z } from "zod";
import {
  SHORT_DESCRIPTION_LIMIT,
  BRAND_NAME_LIMIT,
} from "@/lib/brands/studioBrandFormConstants";

export const createBrandFormSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Brand name is required")
      .max(
        BRAND_NAME_LIMIT,
        `Brand name must be at most ${BRAND_NAME_LIMIT} characters`
      ),
    description: z
      .string()
      .trim()
      .min(1, "Short description is required")
      .max(
        SHORT_DESCRIPTION_LIMIT,
        `Short description must be at most ${SHORT_DESCRIPTION_LIMIT} characters`
      ),
    long_description: z.string(),
    location: z.string().trim().min(1, "Location is required"),
    price_min: z.string(),
    price_max: z.string(),
    contact_for_pricing: z.boolean(),
    currency: z.string().min(1, "Currency is required"),
    categories: z.array(z.string()).min(1, "Select at least one category"),
    image: z.string().trim().min(1, "Brand image is required"),
    website: z.string(),
    instagram: z.string(),
    whatsapp: z.string(),
    contact_email: z.string(),
    founded_year: z.string(),
    video_url: z.string(),
    video_thumbnail: z.string(),
  })
  .superRefine((data, ctx) => {
    const email = data.contact_email.trim();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Enter a valid contact email",
        path: ["contact_email"],
      });
    }

    if (data.contact_for_pricing) {
      return;
    }

    const hasMin = Boolean(data.price_min?.trim());
    const hasMax = Boolean(data.price_max?.trim());
    if (!hasMin || !hasMax) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Enter both min and max price, or check “explore brand for prices”",
        path: ["price_min"],
      });
      return;
    }

    const min = parseFloat(String(data.price_min).replace(/,/g, ""));
    const max = parseFloat(String(data.price_max).replace(/,/g, ""));
    if (!Number.isFinite(min) || !Number.isFinite(max)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Enter valid numbers for min and max price",
        path: ["price_min"],
      });
      return;
    }

    if (min > max) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Minimum price cannot be greater than maximum price",
        path: ["price_max"],
      });
    }
  });

export type CreateBrandFormParsed = z.infer<typeof createBrandFormSchema>;

export function firstCreateBrandValidationMessage(
  result: z.SafeParseReturnType<unknown, CreateBrandFormParsed>
): string {
  if (result.success) return "";
  return result.error.issues[0]?.message ?? "Please fix the form errors";
}
