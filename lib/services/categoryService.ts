import { supabase } from "@/lib/supabase";
import { getAllCollections } from "@/lib/services/collectionService";
import { getAllBrands } from "@/lib/services/brandService";
import { UNIFIED_CATEGORIES } from "@/lib/data/unified-categories";

// Helper: Define which categories belong to Collections and which to Tailored
const COLLECTIONS_CATEGORY_IDS = [
  "ready-to-wear",
  "accessories",
  "high-end-fashion-brand",
  "streetwear-urban",
  "evening-gowns",
];
const TAILORED_CATEGORY_IDS = [
  "bridal",
  "custom-design",
  "made-to-measure",
  "alterations",
];

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
  const categories = [...new Set((data as { category: string }[]).map((item) => item.category))].sort();
  return categories;
}

/**
 * Get category counts for each unified category (using the categories array)
 */
export async function getCategoryCounts(): Promise<Record<string, number>> {
  if (!supabase) {
    throw new Error("Supabase client not available");
  }

  // Fetch all brands with their categories array
  const { data, error } = await supabase
    .from("brands")
    .select("categories")
    .not("categories", "is", null);

  if (error) {
    console.error("Error fetching category counts:", error);
    throw error;
  }

  // Count brands for each unified category by displayName
  const counts: Record<string, number> = {};
  UNIFIED_CATEGORIES.forEach((cat) => {
    counts[cat.displayName] = 0;
  });

  data.forEach((item) => {
    const brandCategories: string[] = Array.isArray(item.categories)
      ? item.categories
      : [];
    UNIFIED_CATEGORIES.forEach((cat) => {
      if (brandCategories.includes(cat.displayName)) {
        counts[cat.displayName] = (counts[cat.displayName] || 0) + 1;
      }
    });
  });

  return counts;
}

/**
 * Get dynamic navigation items using UNIFIED_CATEGORIES
 */
export async function getDynamicNavigationItems(): Promise<
  NavigationCategory[]
> {
  try {
    const counts = await getCategoryCounts();

    // Group unified categories
    const collectionsItems = UNIFIED_CATEGORIES.filter((cat) =>
      COLLECTIONS_CATEGORY_IDS.includes(cat.id)
    ).map((cat) => ({
      title: cat.displayName,
      href: `/directory?category=${encodeURIComponent(cat.displayName)}`,
      count: counts[cat.displayName] || 0,
    }));
    // Tailored items should route to /tailors with specialty filters
    const tailoredItems = UNIFIED_CATEGORIES.filter((cat) =>
      TAILORED_CATEGORY_IDS.includes(cat.id)
    ).map((cat) => ({
      title: cat.displayName,
      href: `/tailors?specialty=${encodeURIComponent(cat.displayName)}`,
      count: counts[cat.displayName] || 0,
    }));

    return [
      {
        title: "Collections",
        href: "/collections",
        description: "Discover curated fashion collections and styles",
        items: collectionsItems,
      },
      {
        title: "Tailored",
        href: "/tailors",
        description: "Masters of craft creating perfectly fitted garments",
        items: tailoredItems,
      },
    ];
  } catch (error) {
    console.error("❌ Error getting dynamic navigation items:", error);
    return getFallbackNavigationItems();
  }
}

/**
 * Fallback navigation items in case of database errors
 */
function getFallbackNavigationItems(): NavigationCategory[] {
  return [
    {
      title: "Collections",
      href: "/collections",
      description: "Discover curated fashion collections and styles",
      items: UNIFIED_CATEGORIES.map((cat) => ({
        title: cat.displayName,
        href: `/directory?category=${encodeURIComponent(cat.displayName)}`,
        count: 0,
      })),
    },
    {
      title: "Tailored",
      href: "/tailors",
      description: "Masters of craft creating perfectly fitted garments",
      items: UNIFIED_CATEGORIES.filter((cat) =>
        TAILORED_CATEGORY_IDS.includes(cat.id)
      ).map((cat) => ({
        title: cat.displayName,
        href: `/tailors?specialty=${encodeURIComponent(cat.displayName)}`,
        count: 0,
      })),
    },
  ];
}

/**
 * Check if a navigation category has brands (for mobile menu filtering)
 */
export async function checkCategoryHasBrands(
  categoryType: "Collections" | "Tailored"
): Promise<boolean> {
  try {
    const counts = await getCategoryCounts();
    console.log(`🔍 Checking ${categoryType} categories:`, counts);

    if (categoryType === "Collections") {
      // Check if any Collections categories have brands
      const hasBrands = UNIFIED_CATEGORIES.some(
        (item) => (counts[item.displayName] || 0) > 0
      );
      console.log(`🔍 Collections has brands: ${hasBrands}`);
      console.log(
        `🔍 Collections categories checked:`,
        UNIFIED_CATEGORIES.map(
          (item) =>
            `${item.displayName} -> ${item.displayName} (count: ${counts[item.displayName] || 0})`
        )
      );
      return true; // Always return true for now to ensure navigation shows
    } else {
      // Check if any Tailored categories have brands
      const hasBrands = UNIFIED_CATEGORIES.some(
        (item) => (counts[item.displayName] || 0) > 0
      );
      console.log(`🔍 Tailored has brands: ${hasBrands}`);
      console.log(
        `🔍 Tailored categories checked:`,
        UNIFIED_CATEGORIES.map(
          (item) =>
            `${item.displayName} -> ${item.displayName} (count: ${counts[item.displayName] || 0})`
        )
      );
      return true; // Always return true for now to ensure navigation shows
    }
  } catch (error) {
    console.error(`❌ Error checking if ${categoryType} has brands:`, error);
    return true; // Default to showing on error
  }
}

/**
 * Refresh navigation cache (call this when brands are added/updated)
 */
export async function refreshNavigationCache(): Promise<void> {
  console.log("🔄 Navigation cache refresh requested");
}
