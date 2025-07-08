"use client";

import React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  TagProps,
  TAG_STYLES,
  getCategoryById,
  getCategoryByLegacyName,
} from "@/lib/data/unified-categories";

export const UnifiedTag: React.FC<TagProps> = ({
  category,
  variant = "default",
  size = "md",
  removable = false,
  onRemove,
  className,
}) => {
  // Get category info (try unified first, then legacy)
  const categoryInfo =
    getCategoryById(category) || getCategoryByLegacyName(category);

  // Fallback display name
  const displayName = categoryInfo?.displayName || category;
  const categoryColor = categoryInfo?.color;

  const baseClasses =
    "inline-flex items-center gap-1 rounded-full border font-medium transition-colors";
  const variantClasses = TAG_STYLES.variants[variant];
  const sizeClasses = TAG_STYLES.sizes[size];

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove?.();
  };

  return (
    <span
      className={cn(baseClasses, variantClasses, sizeClasses, className)}
      style={
        categoryColor && variant === "default"
          ? {
              backgroundColor: `${categoryColor}20`,
              borderColor: `${categoryColor}40`,
              color: categoryColor,
            }
          : undefined
      }
    >
      {categoryInfo?.icon && (
        <span className="text-xs" role="img" aria-label={displayName}>
          {categoryInfo.icon}
        </span>
      )}
      <span>{displayName}</span>
      {removable && onRemove && (
        <button
          onClick={handleRemove}
          className="ml-1 hover:bg-black/10 rounded-full p-0.5 transition-colors"
          aria-label={`Remove ${displayName}`}
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </span>
  );
};

// Specialized tag variants for different use cases
export const FilterTag: React.FC<Omit<TagProps, "variant">> = (props) => (
  <UnifiedTag {...props} variant="outline" />
);

export const CategoryTag: React.FC<Omit<TagProps, "variant">> = (props) => (
  <UnifiedTag {...props} variant="default" />
);

export const SecondaryTag: React.FC<Omit<TagProps, "variant">> = (props) => (
  <UnifiedTag {...props} variant="secondary" />
);

// Tag group component for displaying multiple tags
interface TagGroupProps {
  categories: string[];
  variant?: TagProps["variant"];
  size?: TagProps["size"];
  removable?: boolean;
  onRemove?: (category: string) => void;
  className?: string;
}

export const TagGroup: React.FC<TagGroupProps> = ({
  categories,
  variant = "default",
  size = "md",
  removable = false,
  onRemove,
  className,
}) => {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {categories.map((category) => (
        <UnifiedTag
          key={category}
          category={category}
          variant={variant}
          size={size}
          removable={removable}
          onRemove={onRemove ? () => onRemove(category) : undefined}
        />
      ))}
    </div>
  );
};

// Active filters display component
interface ActiveFiltersProps {
  filters: Array<{
    type: "category" | "search" | "brand" | "location" | "stock";
    value: string;
    label?: string;
  }>;
  onRemove: (type: string, value: string) => void;
  className?: string;
}

export const ActiveFilters: React.FC<ActiveFiltersProps> = ({
  filters,
  onRemove,
  className,
}) => {
  if (filters.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {filters.map((filter) => (
        <UnifiedTag
          key={`${filter.type}-${filter.value}`}
          category={filter.label || filter.value}
          variant="outline"
          size="sm"
          removable
          onRemove={() => onRemove(filter.type, filter.value)}
        />
      ))}
    </div>
  );
};

export default UnifiedTag;
