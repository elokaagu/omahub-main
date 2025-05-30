import { collections, subcategories } from "@/lib/data/directory";

export interface NavigationItem {
  title: string;
  href: string;
  description: string;
  items: {
    title: string;
    href: string;
  }[];
}

export const navigationItems: NavigationItem[] = [
  {
    title: "Collections",
    href: "/directory?category=Collections",
    description: "Shop for an occasion, holiday, or ready to wear piece",
    items: subcategories.Collections.map((subcategory) => ({
      title: subcategory,
      href: `/directory?category=Collections&subcategory=${subcategory.replace(/ /g, "+")}`,
    })),
  },
  {
    title: "Tailored",
    href: "/directory?category=Tailored",
    description: "Masters of craft creating perfectly fitted garments",
    items: subcategories.Tailored.map((subcategory) => ({
      title: subcategory,
      href: `/directory?category=Tailored&subcategory=${subcategory.replace(/ /g, "+")}`,
    })),
  },
];
