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
    href: "/tailored",
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
    const dynamicItems = await getDynamicNavigationItems();

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

    return navigationItems.length > 0
      ? navigationItems
      : fallbackNavigationItems;
  } catch (error) {
    console.error("Error loading dynamic navigation items:", error);
    return fallbackNavigationItems;
  }
}

// Export static items for backward compatibility during transition
export const navigationItems = fallbackNavigationItems;
