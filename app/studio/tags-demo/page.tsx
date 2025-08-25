"use client";



import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  UnifiedTag,
  CategoryTag,
  FilterTag,
  SecondaryTag,
  TagGroup,
  ActiveFilters,
} from "@/components/ui/unified-tag";
import { UNIFIED_CATEGORIES } from "@/lib/data/unified-categories";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function TagsDemoPage() {
  const [activeFilters, setActiveFilters] = React.useState([
    { type: "category" as const, value: "bridal", label: "Category: Bridal" },
    {
      type: "search" as const,
      value: "wedding dress",
      label: 'Search: "wedding dress"',
    },
    { type: "location" as const, value: "Lagos", label: "Location: Lagos" },
  ]);

  const handleRemoveFilter = (type: string, value: string) => {
    setActiveFilters((prev) =>
      prev.filter((f) => !(f.type === type && f.value === value))
    );
  };

  const handleRemoveCategory = (category: string) => {
    console.log("Removing category:", category);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <Button variant="outline" asChild className="mb-4">
          <Link href="/studio">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Studio
          </Link>
        </Button>
        <h1 className="text-3xl font-canela text-gray-900 mb-2">
          Unified Tag System Demo
        </h1>
        <p className="text-oma-cocoa/80">
          Consistent tag styling and behavior across homepage filters, product
          uploads, and Studio UI
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Basic Tag Variants */}
        <Card>
          <CardHeader>
            <CardTitle>Tag Variants</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h4 className="text-sm font-medium mb-3 text-oma-cocoa">
                Default Tags (with category colors)
              </h4>
              <div className="flex flex-wrap gap-2">
                {UNIFIED_CATEGORIES.slice(0, 4).map((category) => (
                  <UnifiedTag
                    key={category.id}
                    category={category.name}
                    variant="default"
                  />
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-3 text-oma-cocoa">
                Filter Tags (outline style)
              </h4>
              <div className="flex flex-wrap gap-2">
                {UNIFIED_CATEGORIES.slice(0, 4).map((category) => (
                  <FilterTag key={category.id} category={category.name} />
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-3 text-oma-cocoa">
                Secondary Tags
              </h4>
              <div className="flex flex-wrap gap-2">
                {UNIFIED_CATEGORIES.slice(0, 4).map((category) => (
                  <SecondaryTag key={category.id} category={category.name} />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tag Sizes */}
        <Card>
          <CardHeader>
            <CardTitle>Tag Sizes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h4 className="text-sm font-medium mb-3 text-oma-cocoa">
                Small Tags
              </h4>
              <div className="flex flex-wrap gap-2">
                <UnifiedTag category="Bridal" size="sm" />
                <UnifiedTag category="Ready to Wear" size="sm" />
                <UnifiedTag category="Accessories" size="sm" />
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-3 text-oma-cocoa">
                Medium Tags (default)
              </h4>
              <div className="flex flex-wrap gap-2">
                <UnifiedTag category="Bridal" size="md" />
                <UnifiedTag category="Ready to Wear" size="md" />
                <UnifiedTag category="Accessories" size="md" />
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-3 text-oma-cocoa">
                Large Tags
              </h4>
              <div className="flex flex-wrap gap-2">
                <UnifiedTag category="Bridal" size="lg" />
                <UnifiedTag category="Ready to Wear" size="lg" />
                <UnifiedTag category="Accessories" size="lg" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Removable Tags */}
        <Card>
          <CardHeader>
            <CardTitle>Removable Tags</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h4 className="text-sm font-medium mb-3 text-oma-cocoa">
                Product Upload Form Style
              </h4>
              <TagGroup
                categories={["Bridal", "Evening Gowns", "Custom Design"]}
                variant="default"
                removable
                onRemove={handleRemoveCategory}
              />
            </div>

            <div>
              <h4 className="text-sm font-medium mb-3 text-oma-cocoa">
                Filter Tags with Remove
              </h4>
              <TagGroup
                categories={["Ready to Wear", "Accessories", "Vacation"]}
                variant="outline"
                removable
                onRemove={handleRemoveCategory}
              />
            </div>
          </CardContent>
        </Card>

        {/* Active Filters Example */}
        <Card>
          <CardHeader>
            <CardTitle>Active Filters Component</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-oma-cocoa/80">
              Used in Studio product pages, collections, and directory filters
            </p>
            <ActiveFilters
              filters={activeFilters}
              onRemove={handleRemoveFilter}
            />
            {activeFilters.length === 0 && (
              <p className="text-sm text-oma-cocoa/60 italic">
                No active filters
              </p>
            )}
          </CardContent>
        </Card>

        {/* Usage Context */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Usage Across Application</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-3">
                <h4 className="font-medium text-oma-plum">Homepage Filters</h4>
                <div className="space-y-2">
                  <CategoryTag category="Bridal" />
                  <CategoryTag category="Ready to Wear" />
                  <CategoryTag category="Accessories" />
                </div>
                <p className="text-xs text-oma-cocoa/70">
                  Category cards with brand colors and icons
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-oma-plum">
                  Studio Product Forms
                </h4>
                <div className="space-y-2">
                  <TagGroup
                    categories={["Evening Gowns", "Custom Design"]}
                    removable
                    onRemove={handleRemoveCategory}
                  />
                </div>
                <p className="text-xs text-oma-cocoa/70">
                  Removable tags for form inputs
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-oma-plum">Directory Filters</h4>
                <div className="space-y-2">
                  <FilterTag category="Bridal" />
                  <FilterTag category="Vacation" />
                </div>
                <p className="text-xs text-oma-cocoa/70">
                  Outline style for filter selections
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Category Details */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>All Unified Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {UNIFIED_CATEGORIES.map((category) => (
                <div
                  key={category.id}
                  className="p-4 border border-oma-gold/20 rounded-lg"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{category.icon}</span>
                    <UnifiedTag category={category.name} />
                  </div>
                  <p className="text-xs text-oma-cocoa/70 mb-2">
                    {category.description}
                  </p>
                  <p className="text-xs text-oma-plum italic">
                    "{category.homepageCta}"
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
