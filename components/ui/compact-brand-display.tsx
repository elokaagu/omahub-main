import React from "react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Building2, MoreHorizontal } from "lucide-react";

interface CompactBrandDisplayProps {
  brands: string[];
  maxVisible?: number;
  className?: string;
}

export function CompactBrandDisplay({
  brands,
  maxVisible = 2,
  className = "",
}: CompactBrandDisplayProps) {
  if (!brands || brands.length === 0) {
    return (
      <span className="text-gray-400 text-sm italic">No brands assigned</span>
    );
  }

  const visibleBrands = brands.slice(0, maxVisible);
  const hiddenCount = brands.length - maxVisible;

  return (
    <TooltipProvider>
      <div className={`flex items-center gap-1 flex-wrap ${className}`}>
        {/* Visible brands */}
        {visibleBrands.map((brand, index) => (
          <Tooltip key={brand}>
            <TooltipTrigger asChild>
              <Badge
                variant="secondary"
                className="text-xs px-2 py-1 bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 transition-colors cursor-help"
              >
                <Building2 className="w-3 h-3 mr-1" />
                {brand}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>Brand: {brand}</p>
            </TooltipContent>
          </Tooltip>
        ))}

        {/* Hidden brands indicator */}
        {hiddenCount > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge
                variant="outline"
                className="text-xs px-2 py-1 bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100 transition-colors cursor-help"
              >
                <MoreHorizontal className="w-3 h-3 mr-1" />+{hiddenCount}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <div className="space-y-1">
                <p className="font-medium">All Brands:</p>
                {brands.map((brand, index) => (
                  <p key={brand} className="text-sm text-gray-600">
                    {index + 1}. {brand}
                  </p>
                ))}
              </div>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
}

// Alternative: Horizontal list with separators
export function HorizontalBrandList({
  brands,
  className = "",
}: {
  brands: string[];
  className?: string;
}) {
  if (!brands || brands.length === 0) {
    return (
      <span className="text-gray-400 text-sm italic">No brands assigned</span>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="text-sm text-gray-600">Brands:</span>
      <div className="flex items-center gap-1">
        {brands.map((brand, index) => (
          <React.Fragment key={brand}>
            <span className="text-sm font-medium text-blue-700 bg-blue-50 px-2 py-1 rounded-md border border-blue-200">
              {brand}
            </span>
            {index < brands.length - 1 && (
              <span className="text-gray-300 mx-1">•</span>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

// Alternative: Compact chips with better spacing
export function BrandChips({
  brands,
  className = "",
}: {
  brands: string[];
  className?: string;
}) {
  if (!brands || brands.length === 0) {
    return (
      <span className="text-gray-400 text-sm italic">No brands assigned</span>
    );
  }

  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`}>
      {brands.map((brand) => (
        <span
          key={brand}
          className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border border-blue-200 shadow-sm"
        >
          <Building2 className="w-3 h-3 mr-1.5 text-blue-500" />
          {brand}
        </span>
      ))}
    </div>
  );
}
