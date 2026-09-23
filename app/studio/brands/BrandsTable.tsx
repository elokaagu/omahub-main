"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AuthImage } from "@/components/ui/auth-image";
import {
  CheckCircle,
  Package,
  PlusCircle,
  Search,
  Star,
} from "@/components/ui/icons";
import { BlurIn, BlurInTableRow } from "@/components/studio/BlurIn";
import { IMAGE_QUALITY } from "@/lib/images/imageSizing";

/** One row of the Studio brands list - only what the table shows. */
export type StudioBrandRow = {
  id: string;
  name: string;
  description: string | null;
  category: string;
  location: string;
  rating: number | null;
  is_verified: boolean;
  imageUrl: string;
};

type BrandsTableProps = {
  brands: StudioBrandRow[];
  /** brand_admin sees "Your Brands"; admins can also create brands. */
  isBrandOwner: boolean;
  canCreate: boolean;
};

export function BrandsTable({
  brands,
  isBrandOwner,
  canCreate,
}: BrandsTableProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredBrands = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return brands;
    return brands.filter(
      (brand) =>
        brand.name.toLowerCase().includes(query) ||
        (brand.description?.toLowerCase() || "").includes(query) ||
        brand.category.toLowerCase().includes(query) ||
        brand.location.toLowerCase().includes(query),
    );
  }, [brands, searchQuery]);

  const openBrand = (brandId: string) => {
    router.push(`/studio/brands/${encodeURIComponent(brandId.trim())}`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <BlurIn className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-canela text-gray-900">
            {isBrandOwner ? "Your Brands" : "Brands"}
          </h1>
          {isBrandOwner && (
            <p className="mt-1 text-sm text-gray-600">
              Manage your brand information and settings
            </p>
          )}
        </div>
        {canCreate && (
          <Button
            asChild
            className="w-full bg-oma-plum hover:bg-oma-plum/90 sm:w-auto"
          >
            <Link
              href="/studio/brands/create"
              className="flex items-center justify-center gap-2"
            >
              <PlusCircle className="h-4 w-4" />
              Add New Brand
            </Link>
          </Button>
        )}
      </BlurIn>

      <BlurIn delay={0.08} className="mb-8">
        <Card>
          <CardHeader>
            <CardTitle>
              {isBrandOwner ? "Your Brand Management" : "Brand Management"}
            </CardTitle>
            <CardDescription>
              {isBrandOwner
                ? "Manage your brands in the directory"
                : "Manage all brands in the directory"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search brands by name, category, or location..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
      </BlurIn>

      {filteredBrands.length === 0 ? (
        <BlurIn delay={0.12}>
          <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
            <Package className="mx-auto mb-4 h-12 w-12 text-gray-400" />
            <p className="mb-4 text-gray-600">
              {searchQuery
                ? "No brands match your search criteria"
                : isBrandOwner
                  ? "You don't have any brands assigned to your account yet."
                  : "No brands have been added yet"}
            </p>
            {!searchQuery && canCreate && (
              <Button asChild className="bg-oma-plum hover:bg-oma-plum/90">
                <Link href="/studio/brands/create">
                  Create Your First Brand
                </Link>
              </Button>
            )}
          </div>
        </BlurIn>
      ) : (
        <BlurIn delay={0.12}>
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
            <div className="border-b border-gray-200 p-4">
              <p className="text-sm text-gray-500">
                Showing {filteredBrands.length} brand
                {filteredBrands.length === 1 ? "" : "s"}
                {isBrandOwner && " assigned to your account"}
              </p>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Brand</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBrands.map((brand, index) => (
                  <BlurInTableRow
                    key={brand.id}
                    delay={Math.min(index, 10) * 0.05}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => openBrand(brand.id)}
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-md bg-gray-100">
                          {brand.imageUrl ? (
                            <AuthImage
                              src={brand.imageUrl}
                              alt={brand.name}
                              width={40}
                              height={40}
                              aspectRatio="square"
                              className="h-full w-full"
                              sizes="40px"
                              quality={IMAGE_QUALITY.thumbnail}
                              focal="portrait"
                            />
                          ) : null}
                        </div>
                        <span>{brand.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{brand.category}</TableCell>
                    <TableCell>{brand.location}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Star className="mr-1 h-4 w-4 text-yellow-400" />
                        {brand.rating && brand.rating > 0 ? (
                          brand.rating.toFixed(1)
                        ) : (
                          <span className="text-gray-400">No ratings yet</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {brand.is_verified ? (
                        <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                          <CheckCircle className="mr-1 h-3 w-3" />
                          Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                          Unverified
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          openBrand(brand.id);
                        }}
                      >
                        View
                      </Button>
                    </TableCell>
                  </BlurInTableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </BlurIn>
      )}
    </div>
  );
}
