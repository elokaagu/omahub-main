import { createServerSupabaseClient } from "@/lib/supabase-unified";
import type { PublicFaq } from "@/lib/types/publicFaq";
import {
  faqCategorySchema,
  faqPageLocationSchema,
} from "@/lib/validation/faqs";

export type { PublicFaq } from "@/lib/types/publicFaq";

export type GetPublicFaqsOptions = {
  pageLocation?: string | null;
  category?: string | null;
};

/**
 * Active FAQs for public surfaces (RLS also limits rows in Supabase).
 * Prefer calling from Server Components; `/api/faqs` uses the same logic for clients.
 */
export async function getPublicFaqs(
  options: GetPublicFaqsOptions = {}
): Promise<{ faqs: PublicFaq[]; error: string | null }> {
  try {
    const supabase = await createServerSupabaseClient();

    let query = supabase
      .from("faqs")
      .select(
        "id, question, answer, category, display_order, page_location, is_active"
      )
      .eq("is_active", true)
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: false });

    const pageLocationRaw = options.pageLocation;
    if (pageLocationRaw && pageLocationRaw !== "all") {
      const loc = faqPageLocationSchema.safeParse(pageLocationRaw);
      if (loc.success) {
        query = query.in("page_location", [loc.data, "all"]);
      }
    }

    const categoryRaw = options.category;
    if (categoryRaw) {
      const cat = faqCategorySchema.safeParse(categoryRaw);
      if (cat.success) {
        query = query.eq("category", cat.data);
      }
    }

    const { data, error } = await query;

    if (error) {
      console.error("[getPublicFaqs] query failed", { code: error.code });
      return { faqs: [], error: "Failed to load FAQs" };
    }

    return { faqs: (data ?? []) as PublicFaq[], error: null };
  } catch (e) {
    console.error("[getPublicFaqs] unexpected error", e);
    return { faqs: [], error: "Failed to load FAQs" };
  }
}
