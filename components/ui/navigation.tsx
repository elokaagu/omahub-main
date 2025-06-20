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
    href: "/collections",
    description: "Shop for an occasion, holiday, or ready to wear piece",
    items: subcategories.Collections.map((subcategory) => ({
      title: subcategory,
      href: `/directory?category=Collections&subcategory=${subcategory.replace(/ /g, "+")}`,
    })),
  },
  {
    title: "Tailoring",
    href: "/directory?category=Tailoring",
    description: "Masters of craft creating perfectly fitted garments",
    items: subcategories.Tailored.map((subcategory) => ({
      title: subcategory,
      href: `/directory?category=Tailoring&subcategory=${subcategory.replace(/ /g, "+")}`,
    })),
  },
];
