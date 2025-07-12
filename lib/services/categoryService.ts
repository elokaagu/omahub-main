import { supabase } from "@/lib/supabase";
import { getAllCollections } from "@/lib/services/collectionService";
import { getAllBrands } from "@/lib/services/brandService";

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
 * Map all categories with at least 1 brand or collection to navigation
 */
export function mapCategoriesToNavigation(
  categories: string[],
  counts: Record<string, number>,
  collectionCounts: Record<string, number>
): NavigationCategory[] {
  // Merge counts for each category (brands + collections)
  const mergedCounts: Record<string, number> = { ...counts };
  for (const [cat, count] of Object.entries(collectionCounts)) {
    mergedCounts[cat] = (mergedCounts[cat] || 0) + count;
  }

  // Define which categories belong to Collections vs Tailored
  const collectionsCategories = [
    "Bridal",
    "Ready to Wear",
    "Accessories",
    "Luxury",
    "Couture",
    "Streetwear",
    "Jewelry",
    "Casual Wear",
    "Formal Wear",
    "Vacation",
  ];

  const tailoredCategories = [
    "Bridal",
    "Custom Design",
    "Evening Gowns",
    "Alterations",
    "Tailored",
    "Event Wear",
    "Wedding Guest",
    "Birthday",
  ];

  const navigationCategories: NavigationCategory[] = [];

  // Collections navigation - include all categories with brands/collections
  const collectionsItems = categories
    .filter((cat) => collectionsCategories.includes(cat))
    .map((cat) => ({
      title: cat,
      href: `/directory?category=${encodeURIComponent(cat)}`,
      count: mergedCounts[cat] || 0,
    }))
    .filter((item) => item.count > 0) // Only show categories with brands/collections
    .sort((a, b) => a.title.localeCompare(b.title));

  if (collectionsItems.length > 0) {
    navigationCategories.push({
      title: "Collections",
      href: "/collections",
      description: "Discover curated fashion collections and styles",
      items: collectionsItems,
    });
  }

  // Tailored navigation - include all categories with brands/collections
  const tailoredItems = categories
    .filter((cat) => tailoredCategories.includes(cat))
    .map((cat) => ({
      title: cat,
      href: `/directory?category=${encodeURIComponent(cat)}`,
      count: mergedCounts[cat] || 0,
    }))
    .filter((item) => item.count > 0) // Only show categories with brands/collections
    .sort((a, b) => a.title.localeCompare(b.title));

  if (tailoredItems.length > 0) {
    // Add "Browse All Tailors" as the first item
    const allTailoredItems = [
      {
        title: "Browse All Tailors",
        href: "/tailors",
        count: tailoredItems.reduce((sum, item) => sum + item.count, 0),
      },
      ...tailoredItems,
    ];

    navigationCategories.push({
      title: "Tailored",
      href: "/tailored",
      description: "Masters of craft creating perfectly fitted garments",
      items: allTailoredItems,
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
    const [categories, counts, collections, brands] = await Promise.all([
      getAllBrandCategories(),
      getCategoryCounts(),
      getAllCollections(),
      getAllBrands(),
    ]);

    // Build a map of brand_id to category
    const brandIdToCategory: Record<string, string> = {};
    brands.forEach((brand) => {
      if (brand.id && brand.category) {
        brandIdToCategory[brand.id] = brand.category;
      }
    });

    // Count collections by the brand's category
    const collectionCounts: Record<string, number> = {};
    collections.forEach((col) => {
      const cat = col.brand_id ? brandIdToCategory[col.brand_id] : undefined;
      if (cat) {
        collectionCounts[cat] = (collectionCounts[cat] || 0) + 1;
      }
    });

    return mapCategoriesToNavigation(categories, counts, collectionCounts);
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
  categoryType: "Collections" | "Tailored"
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
      const tailoredCategories = [
        "Bridal",
        "Couture",
        "Custom Design",
        "Tailored",
        "Event Wear",
        "Wedding Guest",
        "Birthday",
      ];
      return tailoredCategories.some((cat) => (counts[cat] || 0) > 0);
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
