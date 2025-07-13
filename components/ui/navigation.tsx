import {
  getDynamicNavigationItems,
  type NavigationCategory,
} from "@/lib/services/categoryService";

export interface NavigationItem {
  title: string;
  href: string;
  description: string;
  items: {
    title: string;
    href: string;
    count?: number;
  }[];
}

// Static fallback navigation items (used if dynamic loading fails)
const fallbackNavigationItems: NavigationItem[] = [
  {
    title: "Collections",
    href: "/collections",
    description: "Discover curated fashion collections and styles",
    items: [
      { title: "High End Fashion Brands", href: "/directory?category=Luxury" },
      { title: "Ready to Wear", href: "/directory?category=Ready+to+Wear" },
      { title: "Made to Measure", href: "/directory?category=Couture" },
      {
        title: "Streetwear & Urban",
        href: "/directory?category=Streetwear+%26+Urban",
      },
      { title: "Accessories", href: "/directory?category=Accessories" },
    ],
  },
  {
    title: "Tailored",
    href: "/tailors",
    description: "Masters of craft creating perfectly fitted garments",
    items: [
      { title: "Browse All Tailors", href: "/tailors" },
      { title: "Bridal", href: "/directory?category=Bridal" },
      { title: "Custom Design", href: "/directory?category=Custom+Design" },
      { title: "Evening Gowns", href: "/directory?category=Evening+Gowns" },
      { title: "Alterations", href: "/directory?category=Alterations" },
    ],
  },
];

/**
 * Get navigation items dynamically from database
 */
export async function getNavigationItems(): Promise<NavigationItem[]> {
  try {
    console.log("🔄 Starting getNavigationItems...");

    const dynamicItems = await getDynamicNavigationItems();
    console.log("📋 Dynamic items received:", dynamicItems);

    // Debug each category and its items
    dynamicItems.forEach((category, index) => {
      console.log(`🔍 Navigation: Category ${index + 1} - ${category.title}:`);
      category.items.forEach((item, itemIndex) => {
        console.log(
          `  Item ${itemIndex + 1}: ${item.title} -> ${item.href} (count: ${item.count})`
        );
      });
    });

    // Convert NavigationCategory to NavigationItem format
    const navigationItems: NavigationItem[] = dynamicItems.map((category) => ({
      title: category.title,
      href: category.href,
      description: category.description,
      items: category.items.map((item) => ({
        title: item.title,
        href: item.href,
        count: item.count,
      })),
    }));

    console.log("✅ Final navigation items:", navigationItems);

    // Always return the dynamic items if we have them, otherwise fallback
    return navigationItems.length > 0
      ? navigationItems
      : fallbackNavigationItems;
  } catch (error) {
    console.error("❌ Error loading dynamic navigation items:", error);
    console.log("🔄 Falling back to static navigation items");
    return fallbackNavigationItems;
  }
}
