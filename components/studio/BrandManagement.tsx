"use client";

import { useState, useEffect } from "react";
import type { Database } from "@/lib/types/supabase";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Package, Trash2, PenSquare } from "lucide-react";
import { Permission } from "@/lib/services/permissionsService";
import React from "react";

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
  const supabase = createClientComponentClient();

  const canManageBrands = userPermissions.includes("studio.brands.manage");

  // Debug current user and session
  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();
      console.log("🔍 BrandManagement Auth Debug:", {
        userId,
        userPermissions,
        canManageBrands,
        hasSession: !!session,
        sessionUserId: session?.user?.id,
        sessionUserEmail: session?.user?.email,
        error,
      });
    };
    checkAuth();
  }, [userId, userPermissions, canManageBrands, supabase]);

  const handleUpdateBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBrand || !canManageBrands) {
      toast.error("You don't have permission to update brands");
      return;
    }

    console.log("🔄 Updating brand:", {
      brandId: editingBrand.id,
      brandName: editingBrand.name,
      userId: userId,
      canManageBrands,
      userPermissions,
    });

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

      if (error) {
        console.error("❌ Supabase error updating brand:", error);
        throw error;
      }

      console.log("✅ Brand updated successfully:", brand);
      setBrands(brands.map((b) => (b.id === brand.id ? brand : b)));
      setEditingBrand(null);
      toast.success("Brand updated successfully");
    } catch (error) {
      console.error("❌ Error updating brand:", error);

      // Show more specific error message
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      toast.error(`Failed to update brand: ${errorMessage}`);
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
      {/* Quick Edit Section */}
      <div>
        <h3 className="text-xl font-canela text-oma-plum mb-6">Quick Edit</h3>

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
                        <p className="text-gray-600 mt-2">
                          {brand.description}
                        </p>
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
                Get started by creating your first brand.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
