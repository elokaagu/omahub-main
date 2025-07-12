// Main categories for the directory
export const collections = ["Collections", "Tailored"] as const;

// (Legacy arrays removed. Use unified categories from lib/data/unified-categories.ts for all UI options.)

export type Category = (typeof collections)[number];

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
  Vacation: "Ready to Wear",
} as const;

// Mapping from database categories to display categories
export const categoryMapping = {
  Bridal: "Bridal",
  "Custom Design": "Custom Design",
  "Evening Gowns": "Evening Gowns",
  Alterations: "Alterations",
  "Ready to Wear": "Ready to Wear",
  "Casual Wear": "Ready to Wear",
  Accessories: "Accessories",
  Jewelry: "Accessories",
  Vacation: "Ready to Wear",
  Couture: "Couture",
  Luxury: "Luxury", // Keep Luxury as its own category for navigation
  "Streetwear & Urban": "Streetwear & Urban", // Updated streetwear category
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

export type Occasion = (typeof occasions)[number];

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
