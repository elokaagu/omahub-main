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
    id: "high-end-fashion-brand",
    name: "High End Fashion",
    displayName: "High End Fashion",
    description: "Luxury and premium fashion brands.",
    slug: "high-end-fashion-brand",
    color: "#BFAE9C",
    icon: "👑",
    homepageImage: "/lovable-uploads/4a7c7e86-6cde-4a7d-a5aa4cb6fa51.png",
    homepageCta: "Luxury, redefined.",
    subcategories: ["Luxury", "Premium", "Designer"],
  },
  {
    id: "made-to-measure",
    name: "Made to Measure",
    displayName: "Made to Measure",
    description: "Custom-fitted garments tailored to individual measurements.",
    slug: "made-to-measure",
    color: "#7C9CA6",
    icon: "📏",
    homepageImage: "/lovable-uploads/57cc6a40-0f0d-4a7d-8786-41f15832ebfb.png",
    homepageCta: "Perfect fit, every time.",
    subcategories: ["Custom Fit", "Personal Tailoring"],
  },
  {
    id: "streetwear-urban",
    name: "Streetwear & Urban",
    displayName: "Streetwear & Urban",
    description: "Trendy streetwear and urban fashion styles.",
    slug: "streetwear-urban",
    color: "#4A6B8B",
    icon: "🧢",
    homepageImage: "/lovable-uploads/4a7c7e86-6cde-4d07-a246-a5aa4cb6fa51.png",
    homepageCta: "Urban edge, everyday.",
    subcategories: ["Street Style", "Urban Wear"],
  },
  {
    id: "alterations",
    name: "Alterations",
    displayName: "Alterations",
    description: "Garment adjustments and tailoring services.",
    slug: "alterations",
    color: "#A67C52",
    icon: "🪡",
    homepageImage: "/lovable-uploads/57cc6a40-0f0d-4a7d-8786-41f15832ebfb.png",
    homepageCta: "Fit perfected.",
    subcategories: ["Hemming", "Resizing", "Repairs"],
  },
] as const;

// Legacy category mappings for backward compatibility
export const LEGACY_CATEGORY_MAPPING = {
  // Current database categories -> Unified categories
  Bridal: "bridal",
  "Ready to Wear": "ready-to-wear",
  "Casual Wear": "ready-to-wear",
  Accessories: "accessories",
  Jewelry: "accessories",
  "Custom Design": "custom-design",
  "Evening Gowns": "evening-gowns",
  Alterations: "custom-design",
  Vacation: "ready-to-wear",
  Couture: "custom-design",
  Luxury: "ready-to-wear",
  "Streetwear & Urban": "streetwear-urban",

  // Homepage categories
  Collections: "ready-to-wear",
  Tailored: "custom-design",

  // Directory subcategories and new mappings
  "High End Fashion": "high-end-fashion-brand",
  "High End Fashion Brand": "high-end-fashion-brand",
  "High End Fashion Brands": "high-end-fashion-brand",
  "Made to Measure": "made-to-measure",
} as const;

// Reverse mapping for database storage
export const UNIFIED_TO_LEGACY_MAPPING = {
  bridal: "Bridal",
  "ready-to-wear": "Ready to Wear",
  accessories: "Accessories",
  "streetwear-urban": "Streetwear & Urban",
  "custom-design": "Custom Design",
  "evening-gowns": "Evening Gowns",
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
    categoryId: "ready-to-wear",
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
    ] || ""
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
