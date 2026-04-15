import { getAllBrands } from "@/lib/services/brandService";
import type { Brand } from "@/lib/supabase";

/** Brand categories that may create tailoring-style portfolio entries. */
export const TAILOR_PORTFOLIO_CATEGORIES = [
  "Bridal",
  "Custom Design",
  "Evening Gowns",
  "Alterations",
  "Tailored",
  "Event Wear",
  "Wedding Guest",
  "Birthday",
] as const;

export function isTailorPortfolioCategory(category: string): boolean {
  return (TAILOR_PORTFOLIO_CATEGORIES as readonly string[]).includes(category);
}

export function filterBrandsEligibleForPortfolio<T extends { category: string }>(
  brands: T[]
): T[] {
  return brands.filter((b) => isTailorPortfolioCategory(b.category));
}

/** All brands that are tailoring categories (caller should apply ownership / admin rules). */
export async function getBrandsEligibleForPortfolio(): Promise<Brand[]> {
  const all = await getAllBrands();
  return filterBrandsEligibleForPortfolio(all);
}
