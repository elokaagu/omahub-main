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
  });

export type DesignerApplicationFormInput = z.input<
  typeof designerApplicationFormSchema
>;
