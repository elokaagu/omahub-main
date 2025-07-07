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
  // Define category mappings for the new Collections structure
  const collectionsCategories = [
    "Luxury", // Maps to "High End Fashion Brands"
    "Ready to Wear",
    "Couture", // Maps to "Made to Measure"
    "Streetwear", // Maps to "Streetwear & Urban"
    "Accessories",
    // Legacy categories that should also map to collections
    "Jewelry", // Maps to Accessories
    "Casual Wear", // Maps to Ready to Wear
    "Formal Wear", // Maps to Made to Measure
    "Vacation", // Maps to Ready to Wear
  ];
  const tailoringCategories = [
    "Bridal",
    "Custom Design",
    "Evening Gowns",
    "Alterations",
    "Tailoring",
    "Event Wear",
    "Wedding Guest",
    "Birthday",
  ];

  const navigationCategories: NavigationCategory[] = [];

  // Collections navigation - map database categories to navigation labels
  const categoryMapping: Record<string, { title: string; category: string }> = {
    Luxury: { title: "High End Fashion Brands", category: "Luxury" },
    "Ready to Wear": { title: "Ready to Wear", category: "Ready to Wear" },
    Couture: { title: "Made to Measure", category: "Couture" },
    Streetwear: { title: "Streetwear & Urban", category: "Streetwear" },
    Accessories: { title: "Accessories", category: "Accessories" },
    // Legacy mappings
    Jewelry: { title: "Accessories", category: "Accessories" },
    "Casual Wear": { title: "Ready to Wear", category: "Ready to Wear" },
    "Formal Wear": { title: "Made to Measure", category: "Couture" },
    Vacation: { title: "Ready to Wear", category: "Ready to Wear" },
  };

  // Create aggregated collections items
  const aggregatedCounts: Record<string, number> = {};
  categories
    .filter((cat) => collectionsCategories.includes(cat))
    .forEach((cat) => {
      const mapping = categoryMapping[cat];
      if (mapping) {
        aggregatedCounts[mapping.category] =
          (aggregatedCounts[mapping.category] || 0) + (counts[cat] || 0);
      }
    });

  const collectionsItems = [
    { title: "High End Fashion Brands", category: "Luxury" },
    { title: "Ready to Wear", category: "Ready to Wear" },
    { title: "Made to Measure", category: "Couture" },
    { title: "Streetwear & Urban", category: "Streetwear" },
    { title: "Accessories", category: "Accessories" },
  ]
    .map((item) => ({
      title: item.title,
      href: `/directory?category=${encodeURIComponent(item.category)}`,
      count: aggregatedCounts[item.category] || 0,
    }))
    .filter((item) => item.count > 0); // Only show categories with brands

  if (collectionsItems.length > 0) {
    navigationCategories.push({
      title: "Collections",
      href: "/collections",
      description: "Discover curated fashion collections and styles",
      items: collectionsItems,
    });
  }

  // Tailoring navigation - include all categories that fit tailoring
  const tailoringItems = categories
    .filter((cat) => tailoringCategories.includes(cat))
    .map((cat) => ({
      title: cat,
      href: `/directory?category=${encodeURIComponent(cat)}`,
      count: counts[cat] || 0,
    }))
    .filter((item) => item.count > 0) // Only show categories with brands
    .sort((a, b) => b.count - a.count); // Sort by count descending

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
