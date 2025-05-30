"use client";

import { useState } from "react";
import { Brand } from "@/lib/supabase";
import { UserRole } from "@/lib/services/authService";
import { updateBrand } from "@/lib/services/brandService";
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
import { toast } from "@/components/ui/use-toast";
import Link from "next/link";

interface BrandManagementProps {
  brands: Brand[];
  userRole: UserRole;
  userId: string;
}

export default function BrandManagement({
  brands,
  userRole,
  userId,
}: BrandManagementProps) {
  const [editingBrand, setEditingBrand] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Brand>>({});

  const handleEdit = (brand: Brand) => {
    setEditingBrand(brand.id);
    setFormData(brand);
  };

  const handleCancel = () => {
    setEditingBrand(null);
    setFormData({});
  };

  const handleSave = async (brandId: string) => {
    try {
      const updatedBrand = await updateBrand(userId, brandId, formData);
      if (updatedBrand) {
        toast({
          title: "Success",
          description: "Brand updated successfully",
        });
        setEditingBrand(null);
        setFormData({});
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update brand",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {brands.map((brand) => (
        <Card key={brand.id} className="overflow-hidden">
          <div className="h-36 bg-gray-200 relative">
            {brand.logo_url ? (
              <img
                src={brand.logo_url}
                alt={brand.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                No logo
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
                    className="flex-1 bg-oma-plum hover:bg-oma-plum/90"
                  >
                    Save
                  </Button>
                  <Button
                    onClick={handleCancel}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                  {brand.description}
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
  );
}
