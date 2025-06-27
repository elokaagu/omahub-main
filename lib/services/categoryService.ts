import { supabase } from "@/lib/supabase";

export interface DynamicCategory {
  name: string;
  count: number;
  subcategories: string[];
}

export interface NavigationCategory {
  title: string;
  href: string;
  description: string;
  items: {
    title: string;
    href: string;
    count: number;
  }[];
}

/**
 * Get all unique categories from the brands table
 */
export async function getAllBrandCategories(): Promise<string[]> {
  if (!supabase) {
    throw new Error("Supabase client not available");
  }

  const { data, error } = await supabase
    .from("brands")
    .select("category")
    .not("category", "is", null);

  if (error) {
    console.error("Error fetching brand categories:", error);
    throw error;
  }

  // Get unique categories and sort them
  const categories = [...new Set(data.map((item) => item.category))].sort();
  return categories;
}

/**
 * Get category counts for each brand category
 */
export async function getCategoryCounts(): Promise<Record<string, number>> {
  if (!supabase) {
    throw new Error("Supabase client not available");
  }

  const { data, error } = await supabase
    .from("brands")
    .select("category")
    .not("category", "is", null);

  if (error) {
    console.error("Error fetching category counts:", error);
    throw error;
  }

  // Count occurrences of each category
  const counts: Record<string, number> = {};
  data.forEach((item) => {
    if (item.category) {
      counts[item.category] = (counts[item.category] || 0) + 1;
    }
  });

  return counts;
}

/**
 * Map database categories to navigation groups
 */
export function mapCategoriesToNavigation(
  categories: string[],
  counts: Record<string, number>
): NavigationCategory[] {
  // Define category mappings
  const collectionsCategories = [
    "Ready to Wear",
    "Accessories",
    "Vacation",
    "Casual Wear",
    "Formal Wear",
  ];
  const tailoringCategories = [
    "Bridal",
    "Couture",
    "Custom Design",
    "Tailoring",
    "Event Wear",
    "Wedding Guest",
    "Birthday",
  ];

  const navigationCategories: NavigationCategory[] = [];

  // Collections navigation
  const collectionsItems = categories
    .filter((cat) => collectionsCategories.includes(cat))
    .map((cat) => ({
      title: cat,
      href: `/directory?category=${encodeURIComponent(cat)}`,
      count: counts[cat] || 0,
    }))
    .filter((item) => item.count > 0); // Only show categories with brands

  if (collectionsItems.length > 0) {
    navigationCategories.push({
      title: "Collections",
      href: "/collections",
      description: "Shop for an occasion, holiday, or ready to wear piece",
      items: collectionsItems,
    });
  }

  // Tailoring navigation
  const tailoringItems = categories
    .filter((cat) => tailoringCategories.includes(cat))
    .map((cat) => ({
      title: cat,
      href: `/directory?category=${encodeURIComponent(cat)}`,
      count: counts[cat] || 0,
    }))
    .filter((item) => item.count > 0); // Only show categories with brands

  if (tailoringItems.length > 0) {
    navigationCategories.push({
      title: "Tailoring",
      href: "/directory?category=Tailoring",
      description: "Masters of craft creating perfectly fitted garments",
      items: tailoringItems,
    });
  }

  return navigationCategories;
}

/**
 * Get dynamic navigation items based on current brand categories
 */
export async function getDynamicNavigationItems(): Promise<
  NavigationCategory[]
> {
  try {
    const [categories, counts] = await Promise.all([
      getAllBrandCategories(),
      getCategoryCounts(),
    ]);

    return mapCategoriesToNavigation(categories, counts);
  } catch (error) {
    console.error("Error getting dynamic navigation items:", error);
    // Return empty array on error to prevent navigation breaking
    return [];
  }
}

/**
 * Check if a navigation category has brands
 */
export async function checkCategoryHasBrands(
  categoryType: "Collections" | "Tailoring"
): Promise<boolean> {
  try {
    const counts = await getCategoryCounts();

    if (categoryType === "Collections") {
      const collectionsCategories = [
        "Ready to Wear",
        "Accessories",
        "Vacation",
        "Casual Wear",
        "Formal Wear",
      ];
      return collectionsCategories.some((cat) => (counts[cat] || 0) > 0);
    } else {
      const tailoringCategories = [
        "Bridal",
        "Couture",
        "Custom Design",
        "Tailoring",
        "Event Wear",
        "Wedding Guest",
        "Birthday",
      ];
      return tailoringCategories.some((cat) => (counts[cat] || 0) > 0);
    }
  } catch (error) {
    console.error(`Error checking if ${categoryType} has brands:`, error);
    return false;
  }
}

/**
 * Refresh navigation cache (call this when brands are added/updated)
 */
export async function refreshNavigationCache(): Promise<void> {
  // This function can be called after brand creation/update to refresh navigation
  // For now, we'll just log that a refresh is needed
  console.log(
    "🔄 Navigation cache refresh requested - categories will update on next page load"
  );
}
