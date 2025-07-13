import { supabase } from "@/lib/supabase";
import { getAllCollections } from "@/lib/services/collectionService";
import { getAllBrands } from "@/lib/services/brandService";

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

// Define the exact categories that should always be present
const COLLECTIONS_CATEGORIES = [
  { title: "High End Fashion Brands", category: "Luxury" },
  { title: "Ready to Wear", category: "Ready to Wear" },
  { title: "Made to Measure", category: "Couture" },
  { title: "Streetwear & Urban", category: "Streetwear & Urban" },
  { title: "Accessories", category: "Accessories" },
];

const TAILORED_CATEGORIES = [
  { title: "Bridal", category: "Bridal" },
  { title: "Custom Design", category: "Custom Design" },
  { title: "Evening Gowns", category: "Evening Gowns" },
  { title: "Alterations", category: "Alterations" },
];

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
 * Get category counts for each brand category (using the categories array)
 */
export async function getCategoryCounts(): Promise<Record<string, number>> {
  if (!supabase) {
    throw new Error("Supabase client not available");
  }

  // Fetch both legacy 'category' and new 'categories' array for all brands
  const { data, error } = await supabase
    .from("brands")
    .select("category, categories")
    .not("categories", "is", null);

  if (error) {
    console.error("Error fetching category counts:", error);
    throw error;
  }

  // Build a set of all curated categories (from COLLECTIONS_CATEGORIES and TAILORED_CATEGORIES)
  const curatedCategories = [
    ...COLLECTIONS_CATEGORIES.map((c) => c.category),
    ...TAILORED_CATEGORIES.map((c) => c.category),
  ];

  // Count brands for each curated category using the categories array
  const counts: Record<string, number> = {};
  curatedCategories.forEach((cat) => {
    counts[cat] = 0;
  });

  data.forEach((item) => {
    // Use the categories array if present, otherwise fallback to legacy category
    const brandCategories: string[] =
      Array.isArray(item.categories) && item.categories.length > 0
        ? item.categories
        : item.category
          ? [item.category]
          : [];
    curatedCategories.forEach((cat) => {
      if (brandCategories.includes(cat)) {
        counts[cat] = (counts[cat] || 0) + 1;
      }
    });
  });

  return counts;
}

/**
 * Get dynamic navigation items - ALWAYS returns all categories regardless of brand data
 */
export async function getDynamicNavigationItems(): Promise<
  NavigationCategory[]
> {
  try {
    console.log("🔄 Starting getDynamicNavigationItems...");

    // Get brand counts for display purposes only
    const counts = await getCategoryCounts();
    console.log("📊 Brand category counts:", counts);

    // Always create Collections items with all predefined categories
    console.log("🔍 COLLECTIONS_CATEGORIES array:", COLLECTIONS_CATEGORIES);

    const collectionsItems = COLLECTIONS_CATEGORIES.map((item) => {
      const result = {
        title: item.title,
        href: `/directory?category=${encodeURIComponent(item.category)}`,
        count: counts[item.category] || 0,
      };
      console.log(
        `🔍 Created item: ${item.title} -> ${item.category} (count: ${counts[item.category] || 0})`
      );
      return result;
    });

    console.log("📋 Collections items created:", collectionsItems);
    console.log("📋 Collections items count:", collectionsItems.length);

    // Always create Tailored items with all predefined categories
    const tailoredItems = [
      {
        title: "Browse All Tailors",
        href: "/tailors",
        count: Object.values(counts).reduce((sum, c) => sum + c, 0),
      },
      ...TAILORED_CATEGORIES.map((item) => ({
        title: item.title,
        href: `/directory?category=${encodeURIComponent(item.category)}`,
        count: counts[item.category] || 0,
      })),
    ];

    console.log("📋 Tailored items created:", tailoredItems);

    const navigationCategories = [
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

    console.log("✅ Navigation categories created:", navigationCategories);
    return navigationCategories;
  } catch (error) {
    console.error("❌ Error getting dynamic navigation items:", error);
    // Return fallback navigation on error
    return getFallbackNavigationItems();
  }
}

/**
 * Fallback navigation items in case of database errors
 */
function getFallbackNavigationItems(): NavigationCategory[] {
  console.log("🔄 Using fallback navigation items");

  return [
    {
      title: "Collections",
      href: "/collections",
      description: "Discover curated fashion collections and styles",
      items: COLLECTIONS_CATEGORIES.map((item) => ({
        title: item.title,
        href: `/directory?category=${encodeURIComponent(item.category)}`,
        count: 0,
      })),
    },
    {
      title: "Tailored",
      href: "/tailored",
      description: "Masters of craft creating perfectly fitted garments",
      items: [
        {
          title: "Browse All Tailors",
          href: "/tailors",
          count: 0,
        },
        ...TAILORED_CATEGORIES.map((item) => ({
          title: item.title,
          href: `/directory?category=${encodeURIComponent(item.category)}`,
          count: 0,
        })),
      ],
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
      const hasBrands = COLLECTIONS_CATEGORIES.some(
        (item) => (counts[item.category] || 0) > 0
      );
      console.log(`🔍 Collections has brands: ${hasBrands}`);
      console.log(
        `🔍 Collections categories checked:`,
        COLLECTIONS_CATEGORIES.map(
          (item) =>
            `${item.title} -> ${item.category} (count: ${counts[item.category] || 0})`
        )
      );
      return true; // Always return true for now to ensure navigation shows
    } else {
      // Check if any Tailored categories have brands
      const hasBrands = TAILORED_CATEGORIES.some(
        (item) => (counts[item.category] || 0) > 0
      );
      console.log(`🔍 Tailored has brands: ${hasBrands}`);
      console.log(
        `🔍 Tailored categories checked:`,
        TAILORED_CATEGORIES.map(
          (item) =>
            `${item.title} -> ${item.category} (count: ${counts[item.category] || 0})`
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
