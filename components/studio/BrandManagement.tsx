"use client";

import { useState, useEffect } from "react";
import { Brand } from "@/lib/supabase";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Package, Trash2, PenSquare } from "lucide-react";
import { Permission } from "@/lib/services/permissionsService";
import React from "react";

interface BrandManagementProps {
  initialBrands: Brand[];
  userPermissions: Permission[];
  userId: string;
  userRole?: string;
  ownedBrandIds?: string[];
}

export default function BrandManagement({
  initialBrands,
  userPermissions,
  userId,
  userRole,
  ownedBrandIds = [],
}: BrandManagementProps) {
  // Filter brands based on user role and ownership
  const getFilteredBrands = (brands: Brand[]) => {
    if (userRole === "super_admin" || userRole === "admin") {
      return brands; // Admins see all brands
    }

    if (userRole === "brand_admin" && ownedBrandIds.length > 0) {
      return brands.filter((brand) => ownedBrandIds.includes(brand.id)); // Brand owners see only their brands
    }

    return []; // No access for other roles
  };

  const [brands, setBrands] = useState<Brand[]>(
    getFilteredBrands(initialBrands)
  );
  const [isLoading, setIsLoading] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const supabase = createClientComponentClient();

  const canManageBrands = userPermissions.includes("studio.brands.manage");
  const isBrandOwner = userRole === "brand_admin";
  const isAdmin = userRole === "admin" || userRole === "super_admin";

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
        userRole,
        ownedBrandIds,
        canManageBrands,
        isBrandOwner,
        isAdmin,
        hasSession: !!session,
        sessionUserId: session?.user?.id,
        sessionUserEmail: session?.user?.email,
        filteredBrandsCount: brands.length,
        error,
      });
    };
    checkAuth();
  }, [
    userId,
    userPermissions,
    userRole,
    ownedBrandIds,
    canManageBrands,
    isBrandOwner,
    isAdmin,
    brands.length,
    supabase,
  ]);

  // Update filtered brands when props change
  useEffect(() => {
    setBrands(getFilteredBrands(initialBrands));
  }, [initialBrands, userRole, ownedBrandIds]);

  const handleDeleteBrand = async (brandId: string) => {
    // Check if user has permission to delete this specific brand
    if (isBrandOwner && !ownedBrandIds.includes(brandId)) {
      toast.error("You can only delete your own brands");
      return;
    }

    if (!confirm("Are you sure you want to delete this brand?")) {
      return;
    }

    try {
      setIsLoading(true);
      const { error } = await supabase
        .from("brands")
        .delete()
        .eq("id", brandId);

      if (error) throw error;

      setBrands(brands.filter((brand) => brand.id !== brandId));
      toast.success("Brand deleted successfully");
    } catch (error) {
      console.error("Error deleting brand:", error);
      toast.error("Failed to delete brand");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateBrand = async (
    brandId: string,
    updates: Partial<Brand>
  ) => {
    // Check if user can update this brand
    if (!isAdmin && isBrandOwner && !ownedBrandIds.includes(brandId)) {
      toast.error("You don't have permission to update this brand");
      return;
    }

    try {
      setIsLoading(true);

      // Add debugging information
      console.log("🔄 Attempting brand update:", {
        brandId,
        updates,
        userRole,
        isAdmin,
        isBrandOwner,
        ownedBrandIds,
      });

      // Check authentication status first
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        console.error("❌ Session error:", sessionError);
        toast.error("Authentication error. Please refresh and try again.");
        return;
      }

      if (!session) {
        console.error("❌ No active session");
        toast.error("Please sign in again to update brands.");
        return;
      }

      console.log("✅ Session valid:", {
        userId: session.user.id,
        email: session.user.email,
      });

      // Perform the update with additional error context
      const { data, error } = await supabase
        .from("brands")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", brandId)
        .select()
        .single();

      if (error) {
        console.error("❌ Database update error:", {
          error,
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
        });

        // Provide specific error messages based on error type
        if (error.code === "PGRST116") {
          toast.error(
            "No permission to update this brand. Please check your access rights."
          );
        } else if (error.code === "42501") {
          toast.error("Database permission denied. Please contact support.");
        } else if (error.message.includes("RLS")) {
          toast.error(
            "Security policy blocked the update. Please contact support."
          );
        } else {
          toast.error(`Failed to update brand: ${error.message}`);
        }
        return;
      }

      console.log("✅ Brand updated successfully:", data);
      setBrands(brands.map((brand) => (brand.id === brandId ? data : brand)));
      setEditingBrand(null);
      toast.success("Brand updated successfully");
    } catch (error) {
      console.error("❌ Unexpected error updating brand:", error);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!canManageBrands) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="text-center">
          <Package className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-semibold">No Brand Access</h3>
          <p className="mt-2 text-gray-500">
            You don't have permission to manage brands.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-canela text-oma-plum">
            {isBrandOwner ? "Your Brands" : "Brand Management"}
          </h2>
          {isBrandOwner && (
            <p className="text-sm text-oma-cocoa mt-1">
              Manage your brand information and settings
            </p>
          )}
        </div>
        {isAdmin && (
          <Button className="bg-oma-plum hover:bg-oma-plum/90">
            Add New Brand
          </Button>
        )}
      </div>

      {/* Brand Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {brands.map((brand) => (
          <div
            key={brand.id}
            className="bg-white rounded-lg border border-oma-beige p-6 hover:shadow-md transition-shadow"
          >
            {editingBrand?.id === brand.id ? (
              <>
                <div className="space-y-4">
                  <Input
                    value={editingBrand.name}
                    onChange={(e) =>
                      setEditingBrand({ ...editingBrand, name: e.target.value })
                    }
                    placeholder="Brand name"
                  />
                  <Textarea
                    value={editingBrand.description || ""}
                    onChange={(e) =>
                      setEditingBrand({
                        ...editingBrand,
                        description: e.target.value,
                      })
                    }
                    placeholder="Brand description"
                    rows={3}
                  />
                  <Input
                    value={editingBrand.location || ""}
                    onChange={(e) =>
                      setEditingBrand({
                        ...editingBrand,
                        location: e.target.value,
                      })
                    }
                    placeholder="Location"
                  />
                  <Input
                    value={editingBrand.category || ""}
                    onChange={(e) =>
                      setEditingBrand({
                        ...editingBrand,
                        category: e.target.value,
                      })
                    }
                    placeholder="Category"
                  />
                  <div className="flex space-x-2">
                    <Button
                      onClick={() =>
                        handleUpdateBrand(brand.id, {
                          name: editingBrand.name,
                          description: editingBrand.description,
                          location: editingBrand.location,
                          category: editingBrand.category,
                        })
                      }
                      disabled={isLoading}
                      className="bg-oma-plum hover:bg-oma-plum/90"
                    >
                      Save
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setEditingBrand(null)}
                      disabled={isLoading}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-oma-plum">
                      {brand.name}
                    </h3>
                    <p className="text-sm text-oma-cocoa mt-1">
                      {brand.description}
                    </p>
                  </div>
                  {brand.is_verified && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Verified
                    </span>
                  )}
                </div>

                <div className="space-y-2 text-sm text-oma-cocoa">
                  <div>
                    <span className="font-medium">Location:</span>{" "}
                    {brand.location || "Not specified"}
                  </div>
                  <div>
                    <span className="font-medium">Category:</span>{" "}
                    {brand.category || "Not specified"}
                  </div>
                  <div>
                    <span className="font-medium">Rating:</span>{" "}
                    {brand.rating ? `${brand.rating}/5` : "No ratings yet"}
                  </div>
                  <div>
                    <span className="font-medium">Price Range:</span>{" "}
                    {brand.price_range || "Not specified"}
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-oma-beige">
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setEditingBrand(brand)}
                    >
                      <PenSquare className="h-4 w-4" />
                    </Button>
                    {(isAdmin ||
                      (isBrandOwner && ownedBrandIds.includes(brand.id))) && (
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleDeleteBrand(brand.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        ))}

        {brands.length === 0 && (
          <div className="col-span-full text-center py-12">
            <Package className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-semibold text-gray-900">
              {isBrandOwner ? "No brands assigned" : "No brands"}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {isBrandOwner
                ? "You don't have any brands assigned to your account yet."
                : "Get started by creating your first brand."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
