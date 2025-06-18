// Main categories for the directory
export const collections = ["Collections", "Tailored"] as const;

// Subcategories mapping
export const subcategories = {
  Collections: ["Ready to Wear", "Accessories", "Vacation"],
  Tailored: ["Bridal", "Couture"],
} as const;

export type Category = (typeof collections)[number];
export type Subcategory = (typeof subcategories)[Category][number];

export const locations = [
  "All Locations",
  "Lagos",
  "Accra",
  "Nairobi",
  "Johannesburg",
  "Dakar",
  "Abuja",
  "Marrakech",
  "Cairo",
  "Kumasi",
];
