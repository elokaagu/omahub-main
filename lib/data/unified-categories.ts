// Unified Category System for OmaHub
// This file defines the standardized categories used across all parts of the application

export const UNIFIED_CATEGORIES = [
  // Main Categories
  {
    id: "bridal",
    name: "Bridal",
    displayName: "Bridal",
    description: "Wedding dresses, bridal accessories, and ceremonial wear",
    slug: "bridal",
    color: "#E8B4CB", // Soft pink
    icon: "👰",
    homepageImage: "/lovable-uploads/57cc6a40-0f0d-4a7d-8786-41f15832ebfb.png",
    homepageCta: 'Tailored for "Yes."',
    subcategories: ["Wedding Dresses", "Bridal Accessories", "Ceremonial Wear"],
  },
  {
    id: "ready-to-wear",
    name: "Ready to Wear",
    displayName: "Ready to Wear",
    description: "Ready-made fashion pieces for everyday and special occasions",
    slug: "ready-to-wear",
    color: "#D4A574", // Warm beige
    icon: "👗",
    homepageImage: "/lovable-uploads/4a7c7e86-6cde-4d07-a246-a5aa4cb6fa51.png",
    homepageCta: "Looks for the every day that isn't.",
    subcategories: ["Casual Wear", "Formal Wear", "Streetwear", "Luxury"],
  },
  {
    id: "accessories",
    name: "Accessories",
    displayName: "Accessories",
    description: "Jewelry, bags, shoes, and fashion accessories",
    slug: "accessories",
    color: "#C8A882", // Gold tone
    icon: "💎",
    homepageImage: "/lovable-uploads/25c3fe26-3fc4-43ef-83ac-6931a74468c0.png",
    homepageCta: "The extras that make it extra.",
    subcategories: ["Jewelry", "Bags", "Shoes", "Scarves & Wraps"],
  },
  {
    id: "streetwear",
    name: "Streetwear",
    displayName: "Streetwear",
    description: "Urban fashion and street style pieces",
    slug: "streetwear",
    color: "#6B7280", // Gray
    icon: "🛹",
    homepageImage: "/lovable-uploads/4a7c7e86-6cde-4d07-a246-a5aa4cb6fa51.png",
    homepageCta: "Urban style, elevated.",
    subcategories: ["Urban Fashion", "Street Style", "Athleisure"],
  },
  {
    id: "custom-design",
    name: "Custom Design",
    displayName: "Custom Design",
    description: "Bespoke and made-to-measure pieces",
    slug: "custom-design",
    color: "#A67C52", // Rich brown
    icon: "✂️",
    homepageImage: "/lovable-uploads/57cc6a40-0f0d-4a7d-8786-41f15832ebfb.png",
    homepageCta: "Crafted just for you.",
    subcategories: ["Bespoke Tailoring", "Made-to-Measure", "Alterations"],
  },
  {
    id: "evening-gowns",
    name: "Evening Gowns",
    displayName: "Evening Gowns",
    description: "Formal evening wear and gowns",
    slug: "evening-gowns",
    color: "#8B4A6B", // Deep rose
    icon: "🌙",
    homepageImage: "/lovable-uploads/4a7c7e86-6cde-4d07-a246-a5aa4cb6fa51.png",
    homepageCta: "Elegance for every evening.",
    subcategories: ["Formal Gowns", "Cocktail Dresses", "Red Carpet"],
  },
  {
    id: "vacation",
    name: "Vacation",
    displayName: "Vacation",
    description: "Resort wear and vacation-ready pieces",
    slug: "vacation",
    color: "#7FB069", // Tropical green
    icon: "🏖️",
    homepageImage: "/lovable-uploads/25c3fe26-3fc4-43ef-83ac-6931a74468c0.png",
    homepageCta: "Escape in style.",
    subcategories: ["Resort Wear", "Swimwear", "Beach Accessories"],
  },
] as const;

// Legacy category mappings for backward compatibility
export const LEGACY_CATEGORY_MAPPING = {
  // Current database categories -> Unified categories
  Bridal: "bridal",
  "Ready to Wear": "ready-to-wear",
  "Casual Wear": "ready-to-wear",
  "Formal Wear": "ready-to-wear",
  Accessories: "accessories",
  Jewelry: "accessories",
  "Custom Design": "custom-design",
  "Evening Gowns": "evening-gowns",
  Alterations: "custom-design",
  Vacation: "vacation",
  Couture: "custom-design",
  Luxury: "ready-to-wear",
  Streetwear: "streetwear",

  // Homepage categories
  Collections: "ready-to-wear",
  Tailored: "custom-design",

  // Directory subcategories
  "High-End Fashion Brands": "ready-to-wear",
  "Made to Measure": "custom-design",
  "Streetwear & Urban": "ready-to-wear",
} as const;

// Reverse mapping for database storage
export const UNIFIED_TO_LEGACY_MAPPING = {
  bridal: "Bridal",
  "ready-to-wear": "Ready to Wear",
  accessories: "Accessories",
  streetwear: "Streetwear",
  "custom-design": "Custom Design",
  "evening-gowns": "Evening Gowns",
  vacation: "Vacation",
} as const;

// Occasions mapping
export const OCCASIONS = [
  {
    id: "wedding",
    name: "Wedding",
    categoryId: "bridal",
    description: "Wedding ceremonies and celebrations",
  },
  {
    id: "party",
    name: "Party",
    categoryId: "ready-to-wear",
    description: "Parties and social gatherings",
  },
  {
    id: "formal",
    name: "Formal",
    categoryId: "evening-gowns",
    description: "Formal events and galas",
  },
  {
    id: "vacation",
    name: "Vacation",
    categoryId: "vacation",
    description: "Travel and leisure",
  },
  {
    id: "everyday",
    name: "Everyday",
    categoryId: "ready-to-wear",
    description: "Daily wear and casual occasions",
  },
] as const;

// Helper functions
export const getCategoryById = (id: string) => {
  return UNIFIED_CATEGORIES.find((cat) => cat.id === id);
};

export const getCategoryByLegacyName = (legacyName: string) => {
  const unifiedId =
    LEGACY_CATEGORY_MAPPING[legacyName as keyof typeof LEGACY_CATEGORY_MAPPING];
  return unifiedId ? getCategoryById(unifiedId) : null;
};

export const mapLegacyToUnified = (legacyCategory: string): string => {
  return (
    LEGACY_CATEGORY_MAPPING[
      legacyCategory as keyof typeof LEGACY_CATEGORY_MAPPING
    ] || "ready-to-wear"
  );
};

export const mapUnifiedToLegacy = (unifiedCategory: string): string => {
  return (
    UNIFIED_TO_LEGACY_MAPPING[
      unifiedCategory as keyof typeof UNIFIED_TO_LEGACY_MAPPING
    ] || "Ready to Wear"
  );
};

export const getAllCategoryNames = () => {
  return UNIFIED_CATEGORIES.map((cat) => cat.name);
};

export const getAllCategoryIds = () => {
  return UNIFIED_CATEGORIES.map((cat) => cat.id);
};

export const getCategoriesForHomepage = () => {
  return UNIFIED_CATEGORIES.filter(
    (cat) => cat.homepageImage && cat.homepageCta
  );
};

export const getCategoriesForDirectory = () => {
  return UNIFIED_CATEGORIES.map((cat) => ({
    id: cat.id,
    name: cat.displayName,
    slug: cat.slug,
  }));
};

export const getCategoriesForStudio = () => {
  return UNIFIED_CATEGORIES.map((cat) => ({
    value: cat.name, // Use name for backward compatibility with existing database
    label: cat.displayName,
    id: cat.id,
  }));
};

// Tag component props interface
export interface TagProps {
  category: string;
  variant?: "default" | "secondary" | "outline";
  size?: "sm" | "md" | "lg";
  removable?: boolean;
  onRemove?: () => void;
  className?: string;
}

// Tag styling configuration
export const TAG_STYLES = {
  variants: {
    default: "bg-oma-plum/10 text-oma-plum border-oma-plum/20",
    secondary: "bg-oma-beige text-oma-cocoa border-oma-cocoa/20",
    outline:
      "bg-transparent border-oma-plum text-oma-plum hover:bg-oma-plum/10",
  },
  sizes: {
    sm: "px-2 py-1 text-xs",
    md: "px-3 py-1.5 text-sm",
    lg: "px-4 py-2 text-base",
  },
} as const;

export type UnifiedCategory = (typeof UNIFIED_CATEGORIES)[number];
export type CategoryId = UnifiedCategory["id"];
export type CategoryName = UnifiedCategory["name"];
