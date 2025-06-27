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
    description: "Shop for an occasion, holiday, or ready to wear piece",
    items: [
      { title: "Ready to Wear", href: "/directory?category=Ready+to+Wear" },
      { title: "Accessories", href: "/directory?category=Accessories" },
      { title: "Jewelry", href: "/directory?category=Jewelry" },
      { title: "Casual Wear", href: "/directory?category=Casual+Wear" },
      { title: "Formal Wear", href: "/directory?category=Formal+Wear" },
      { title: "Vacation", href: "/directory?category=Vacation" },
    ],
  },
  {
    title: "Tailoring",
    href: "/directory?category=Tailoring",
    description: "Masters of craft creating perfectly fitted garments",
    items: [
      { title: "Bridal", href: "/directory?category=Bridal" },
      { title: "Custom Design", href: "/directory?category=Custom+Design" },
      { title: "Event Wear", href: "/directory?category=Event+Wear" },
      { title: "Couture", href: "/directory?category=Couture" },
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
