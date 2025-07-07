// Main categories for the directory
export const collections = ["Collections", "Tailored"] as const;

// Subcategories mapping - updated to include Vacation in Collections
export const subcategories = {
  Collections: ["Ready to Wear", "Accessories", "Vacation"],
  Tailored: ["Bridal", "Couture"],
} as const;

export type Category = (typeof collections)[number];
export type Subcategory = (typeof subcategories)[Category][number];

// Standard categories used across the application
export const standardCategories = [
  "Bridal",
  "Ready to Wear",
  "Accessories",
  "Vacation",
  "Couture",
  "Jewelry",
  "Casual Wear",
  "Formal Wear",
  "Luxury",
] as const;

// Occasions used in "What are you dressing for?" section
export const occasions = [
  "Wedding",
  "Party",
  "Ready to Wear",
  "Vacation",
] as const;

// Mapping from occasions to categories for filtering
export const occasionToCategoryMapping = {
  Wedding: "Bridal",
  Party: "Ready to Wear",
  "Ready to Wear": "Ready to Wear",
  Vacation: "Vacation",
} as const;

// Mapping from database categories to display categories
export const categoryMapping = {
  Bridal: "Bridal",
  "Ready to Wear": "Ready to Wear",
  "Casual Wear": "Ready to Wear",
  "Formal Wear": "Couture",
  Accessories: "Accessories",
  Jewelry: "Accessories",
  Vacation: "Vacation",
  Couture: "Couture",
  Luxury: "Ready to Wear", // Map luxury to ready to wear for filtering
} as const;

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

export type StandardCategory = (typeof standardCategories)[number];
export type Occasion = (typeof occasions)[number];

// Helper function to get all available categories for filtering
export const getAllFilterCategories = () => [
  "All Categories",
  ...collections,
  ...Object.values(subcategories).flat(),
];

// Helper function to map occasion to category for filtering
export const mapOccasionToCategory = (occasion: string): string => {
  return (
    occasionToCategoryMapping[
      occasion as keyof typeof occasionToCategoryMapping
    ] || occasion
  );
};

// Helper function to map database category to display category
export const mapDatabaseToDisplayCategory = (dbCategory: string): string => {
  return (
    categoryMapping[dbCategory as keyof typeof categoryMapping] ||
    "Ready to Wear"
  );
};
