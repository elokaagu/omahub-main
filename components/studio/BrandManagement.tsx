"use client";

import { useState, useEffect } from "react";
import type { Database } from "@/lib/types/supabase";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Package, Trash2, PenSquare, Plus } from "lucide-react";
import { Permission } from "@/lib/services/permissionsService";

type Brand = Database["public"]["Tables"]["brands"]["Row"];

interface BrandManagementProps {
  initialBrands: Brand[];
  userPermissions: Permission[];
  userId: string;
}

export default function BrandManagement({
  initialBrands,
  userPermissions,
  userId,
}: BrandManagementProps) {
  const [brands, setBrands] = useState<Brand[]>(initialBrands);
  const [isLoading, setIsLoading] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [newBrand, setNewBrand] = useState({
    name: "",
    description: "",
    website: "",
  });
  const [showNewBrandForm, setShowNewBrandForm] = useState(false);
  const supabase = createClientComponentClient();

  const canManageBrands = userPermissions.includes("studio.brands.manage");

  const handleCreateBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageBrands) {
      toast.error("You don't have permission to create brands");
      return;
    }

    setIsLoading(true);
    try {
      const { data: brand, error } = await supabase
        .from("brands")
        .insert({
          name: newBrand.name,
          description: newBrand.description,
          website: newBrand.website,
        })
        .select()
        .single();

      if (error) throw error;

      setBrands([...brands, brand]);
      setNewBrand({ name: "", description: "", website: "" });
      setShowNewBrandForm(false);
      toast.success("Brand created successfully");
    } catch (error) {
      console.error("Error creating brand:", error);
      toast.error("Failed to create brand");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBrand || !canManageBrands) {
      toast.error("You don't have permission to update brands");
      return;
    }

    setIsLoading(true);
    try {
      const { data: brand, error } = await supabase
        .from("brands")
        .update({
          name: editingBrand.name,
          description: editingBrand.description,
          website: editingBrand.website,
        })
        .eq("id", editingBrand.id)
        .select()
        .single();

      if (error) throw error;

      setBrands(brands.map((b) => (b.id === brand.id ? brand : b)));
      setEditingBrand(null);
      toast.success("Brand updated successfully");
    } catch (error) {
      console.error("Error updating brand:", error);
      toast.error("Failed to update brand");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteBrand = async (brandId: string) => {
    if (!canManageBrands) {
      toast.error("You don't have permission to delete brands");
      return;
    }

    if (!confirm("Are you sure you want to delete this brand?")) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("brands")
        .delete()
        .eq("id", brandId);

      if (error) throw error;

      setBrands(brands.filter((b) => b.id !== brandId));
      toast.success("Brand deleted successfully");
    } catch (error) {
      console.error("Error deleting brand:", error);
      toast.error("Failed to delete brand");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Add Brand Button */}
      {canManageBrands && (
        <div className="flex justify-end">
          <Button
            onClick={() => setShowNewBrandForm(!showNewBrandForm)}
            className="bg-oma-plum hover:bg-oma-plum/90"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Brand
          </Button>
        </div>
      )}

      {/* New Brand Form */}
      {showNewBrandForm && (
        <form
          onSubmit={handleCreateBrand}
          className="space-y-4 bg-white p-6 rounded-lg border border-gray-200"
        >
          <h3 className="text-lg font-semibold mb-4">Create New Brand</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <Input
              type="text"
              value={newBrand.name}
              onChange={(e) =>
                setNewBrand({ ...newBrand, name: e.target.value })
              }
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <Textarea
              value={newBrand.description}
              onChange={(e) =>
                setNewBrand({ ...newBrand, description: e.target.value })
              }
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Website
            </label>
            <Input
              type="url"
              value={newBrand.website || ""}
              onChange={(e) =>
                setNewBrand({ ...newBrand, website: e.target.value })
              }
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowNewBrandForm(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-oma-plum hover:bg-oma-plum/90"
            >
              {isLoading ? "Creating..." : "Create Brand"}
            </Button>
          </div>
        </form>
      )}

      {/* Brands List */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {brands.map((brand) => (
          <div
            key={brand.id}
            className="bg-white p-6 rounded-lg border border-gray-200"
          >
            {editingBrand?.id === brand.id ? (
              <form onSubmit={handleUpdateBrand} className="space-y-4">
                <Input
                  type="text"
                  value={editingBrand.name}
                  onChange={(e) =>
                    setEditingBrand({ ...editingBrand, name: e.target.value })
                  }
                  required
                />
                <Textarea
                  value={editingBrand.description || ""}
                  onChange={(e) =>
                    setEditingBrand({
                      ...editingBrand,
                      description: e.target.value,
                    })
                  }
                  placeholder="Description"
                />
                <Input
                  type="url"
                  value={editingBrand.website || ""}
                  onChange={(e) =>
                    setEditingBrand({
                      ...editingBrand,
                      website: e.target.value,
                    })
                  }
                  placeholder="Website URL"
                />
                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditingBrand(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="bg-oma-plum hover:bg-oma-plum/90"
                  >
                    {isLoading ? "Saving..." : "Save"}
                  </Button>
                </div>
              </form>
            ) : (
              <>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">{brand.name}</h3>
                    {brand.description && (
                      <p className="text-gray-600 mt-2">{brand.description}</p>
                    )}
                    {brand.website && (
                      <a
                        href={brand.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-oma-plum hover:underline mt-2 block"
                      >
                        Visit Website
                      </a>
                    )}
                  </div>
                  {canManageBrands && (
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setEditingBrand(brand)}
                      >
                        <PenSquare className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleDeleteBrand(brand.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        ))}

        {brands.length === 0 && (
          <div className="col-span-full text-center py-12">
            <Package className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-semibold text-gray-900">
              No brands
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating a new brand.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
