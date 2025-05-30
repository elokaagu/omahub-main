"use client";

import { useState, useEffect } from "react";
import { Brand } from "@/lib/supabase";
import { UserRole } from "@/lib/services/authService";
import { updateBrand, getAllBrands } from "@/lib/services/brandService";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import Link from "next/link";
import Image from "next/image";
import { Package } from "@/components/ui/icons";

interface BrandManagementProps {
  initialBrands: Brand[];
  userRole: UserRole;
  userId: string;
}

export default function BrandManagement({
  initialBrands,
  userRole,
  userId,
}: BrandManagementProps) {
  const [brands, setBrands] = useState<Brand[]>(initialBrands);
  const [editingBrand, setEditingBrand] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Brand>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refresh brands periodically
  useEffect(() => {
    const refreshBrands = async () => {
      try {
        const updatedBrands = await getAllBrands();
        setBrands(updatedBrands);
      } catch (err) {
        console.error("Error refreshing brands:", err);
        // Don't set error state here to avoid disrupting the UI
      }
    };

    const interval = setInterval(refreshBrands, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const handleEdit = (brand: Brand) => {
    setEditingBrand(brand.id);
    setFormData(brand);
  };

  const handleCancel = () => {
    setEditingBrand(null);
    setFormData({});
  };

  const handleSave = async (brandId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const updatedBrand = await updateBrand(userId, brandId, formData);
      if (updatedBrand) {
        setBrands(brands.map((b) => (b.id === brandId ? updatedBrand : b)));
        toast.success("Brand updated successfully");
        setEditingBrand(null);
        setFormData({});
      }
    } catch (err) {
      console.error("Error updating brand:", err);
      setError(err instanceof Error ? err.message : "Failed to update brand");
      toast.error("Failed to update brand");
    } finally {
      setIsLoading(false);
    }
  };

  if (error) {
    return (
      <div className="p-4 bg-red-50 rounded-lg">
        <h3 className="text-red-800 font-semibold">Error</h3>
        <p className="text-red-600">{error}</p>
        <Button
          onClick={() => setError(null)}
          className="mt-2 bg-red-100 text-red-800 hover:bg-red-200"
        >
          Dismiss
        </Button>
      </div>
    );
  }

  if (brands.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-4 text-lg font-semibold text-gray-900">No Brands</h3>
        <p className="mt-2 text-gray-500">
          Get started by creating a new brand.
        </p>
        {userRole === "admin" && (
          <Button asChild className="mt-4 bg-oma-plum hover:bg-oma-plum/90">
            <Link href="/studio/brands/create">Create Brand</Link>
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-canela text-oma-plum">Manage Brands</h2>
        {userRole === "admin" && (
          <Button asChild className="bg-oma-plum hover:bg-oma-plum/90">
            <Link href="/studio/brands/create">Create Brand</Link>
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {brands.map((brand) => (
          <Card key={brand.id} className="overflow-hidden">
            <div className="h-48 bg-gray-100 relative">
              {brand.image ? (
                <Image
                  src={brand.image}
                  alt={brand.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  <Package className="h-12 w-12" />
                </div>
              )}
            </div>

            <CardHeader className="pb-2">
              <CardTitle className="text-lg">
                {editingBrand === brand.id ? (
                  <Input
                    value={formData.name || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Brand name"
                  />
                ) : (
                  brand.name
                )}
              </CardTitle>
              <CardDescription>
                {brand.website && (
                  <a
                    href={brand.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-oma-plum hover:underline"
                  >
                    {brand.website}
                  </a>
                )}
              </CardDescription>
            </CardHeader>

            <CardContent>
              {editingBrand === brand.id ? (
                <>
                  <Textarea
                    value={formData.description || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Brand description"
                    className="mb-4"
                  />
                  <Input
                    value={formData.website || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, website: e.target.value })
                    }
                    placeholder="Website URL"
                    className="mb-4"
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleSave(brand.id)}
                      disabled={isLoading}
                      className="flex-1 bg-oma-plum hover:bg-oma-plum/90"
                    >
                      {isLoading ? "Saving..." : "Save"}
                    </Button>
                    <Button
                      onClick={handleCancel}
                      variant="outline"
                      className="flex-1"
                      disabled={isLoading}
                    >
                      Cancel
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                    {brand.description || "No description available"}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleEdit(brand)}
                      variant="outline"
                      className="flex-1 text-oma-plum border-oma-plum hover:bg-oma-plum hover:text-white"
                    >
                      Edit
                    </Button>
                    {userRole === "admin" && (
                      <Button
                        asChild
                        variant="outline"
                        className="flex-1 text-oma-plum border-oma-plum hover:bg-oma-plum hover:text-white"
                      >
                        <Link href={`/studio/brands/${brand.id}`}>Manage</Link>
                      </Button>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
