import { z } from "zod";
import { standardCategories } from "@/lib/data/directory";
import { designerApplicationBodySchema } from "./designerApplicationBody";

/** Categories shown on the join form; must stay aligned with directory listings plus a catch-all. */
export const joinFormCategoryOptions = [
  ...standardCategories,
  "Other",
] as const;

const joinCategorySet = new Set<string>(joinFormCategoryOptions);

/**
 * Client-side validation for the designer application form.
 * Builds on the API body schema and adds category whitelist and year sanity checks.
 */
export const designerApplicationFormSchema =
  designerApplicationBodySchema.superRefine((data, ctx) => {
    if (!joinCategorySet.has(data.category)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["category"],
        message: "Please select a valid category",
      });
    }
    if (data.yearFounded != null && data.yearFounded !== "") {
      const y = parseInt(String(data.yearFounded), 10);
      const now = new Date().getFullYear();
      if (Number.isNaN(y) || y < 1900 || y > now + 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["yearFounded"],
          message: `Enter a year between 1900 and ${now + 1}`,
        });
      }
    }
    if (!data.contactForPricing) {
      const min = data.priceMin?.trim();
      const max = data.priceMax?.trim();
      if (!min || !max) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["priceMin"],
          message: "Enter a minimum and maximum price, or choose contact for pricing",
        });
      } else {
        const minNum = parseFloat(min);
        const maxNum = parseFloat(max);
        if (
          Number.isNaN(minNum) ||
          Number.isNaN(maxNum) ||
          minNum < 0 ||
          maxNum < 0
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["priceMin"],
            message: "Enter valid price numbers",
          });
        } else if (minNum > maxNum) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["priceMax"],
            message: "Maximum price must be greater than or equal to minimum",
          });
        }
      }
    }
  });

export type DesignerApplicationFormInput = z.input<
  typeof designerApplicationFormSchema
>;

/** Values the join form holds while someone fills it in. */
export type JoinFormValues = {
  brandName: string;
  designerName: string;
  email: string;
  phone: string;
  website: string;
  instagram: string;
  location: string;
  category: string;
  description: string;
  yearFounded: string;
  currency: string;
  priceMin: string;
  priceMax: string;
  contactForPricing: boolean;
};

export const EMPTY_JOIN_FORM: JoinFormValues = {
  brandName: "",
  designerName: "",
  email: "",
  phone: "",
  website: "",
  instagram: "",
  location: "",
  category: "",
  description: "",
  yearFounded: "",
  currency: "USD",
  priceMin: "",
  priceMax: "",
  contactForPricing: false,
};

/**
 * The exact JSON body the join form POSTs to /api/designer-application.
 * Raw values only: the API does its own cleanup, so never send parsed output.
 */
export function buildJoinApplicationPayload(
  values: JoinFormValues,
  imageUrls: string[],
) {
  return { ...values, imageUrls };
}

/** Friendly names for API field errors shown to applicants. */
export const JOIN_FIELD_LABELS: Record<string, string> = {
  brandName: "Brand name",
  designerName: "Designer name",
  email: "Email",
  phone: "Phone",
  website: "Website",
  instagram: "Instagram",
  location: "Location",
  category: "Category",
  description: "Brand description",
  yearFounded: "Year founded",
  currency: "Currency",
  priceMin: "Minimum price",
  priceMax: "Maximum price",
  contactForPricing: "Contact for pricing",
  imageUrls: "Photos",
};
