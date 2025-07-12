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

// Mapping for always-present categories in Collections
const ALWAYS_PRESENT_COLLECTIONS = [
  { title: "High-End Fashion Brands", category: "Luxury" },
  { title: "Ready to Wear", category: "Ready to Wear" },
  { title: "Made to Measure", category: "Couture" },
  { title: "Streetwear & Urban", category: "Streetwear" },
  { title: "Accessories", category: "Accessories" },
];

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

  // Get all categories with at least 1 brand or collection
  const allCategories = Array.from(new Set(Object.keys(mergedCounts))).filter(
    (cat) => mergedCounts[cat] > 0
  );
  const sortedCategories = [...allCategories].sort((a, b) =>
    a.localeCompare(b)
  );

  // Collections navigation - always show the 5 key categories at the top
  const alwaysPresent = ALWAYS_PRESENT_COLLECTIONS.map((item) => ({
    title: item.title,
    href: `/directory?category=${encodeURIComponent(item.category)}`,
    count: mergedCounts[item.category] || 0,
    always: true,
  }));

  // All other categories, excluding the always-present ones
  const alwaysCategoriesSet = new Set(
    ALWAYS_PRESENT_COLLECTIONS.map((i) => i.category)
  );
  const otherCategories = sortedCategories
    .filter((cat) => !alwaysCategoriesSet.has(cat))
    .map((cat) => ({
      title: cat,
      href: `/directory?category=${encodeURIComponent(cat)}`,
      count: mergedCounts[cat],
      always: false,
    }));

  const collectionsItems = [...alwaysPresent, ...otherCategories];

  // Tailored navigation - show all categories, with Browse All Tailors at top
  const tailoredItems = [
    {
      title: "Browse All Tailors",
      href: "/tailors",
      count: sortedCategories.reduce((sum, cat) => sum + mergedCounts[cat], 0),
    },
    ...sortedCategories.map((cat) => ({
      title: cat,
      href: `/directory?category=${encodeURIComponent(cat)}`,
      count: mergedCounts[cat],
    })),
  ];

  return [
    {
      title: "Collections",
      href: "/collections",
      description: "Discover curated fashion collections and styles",
      items: collectionsItems,
    },
    {
      title: "Tailored",
      href: "/tailored",
      description: "Masters of craft creating perfectly fitted garments",
      items: tailoredItems,
    },
  ];
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
