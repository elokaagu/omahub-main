"use client";

import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { getAllBrands } from "@/lib/services/brandService";
import { useBrandOwnerAccess } from "@/lib/hooks/useBrandOwnerAccess";
import { Brand } from "@/lib/supabase";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Pencil, Trash2, Star, MapPin, Package, RefreshCw } from "lucide-react";
import { AuthImage } from "@/components/ui/auth-image";
import { FileUpload } from "@/components/ui/file-upload";

interface BrandManagementProps {
  className?: string;
}

export default function BrandManagement({ className }: BrandManagementProps) {
  const {
    user,
    isBrandOwner,
    isAdmin,
    ownedBrandIds,
    canManageBrands,
    filterBrandsByOwnership,
    canAccessBrand,
    loading: accessLoading,
  } = useBrandOwnerAccess();

  const supabase = createClientComponentClient();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    category: "",
    location: "",
    website: "",
    instagram: "",
    image: "",
  });

  useEffect(() => {
    if (!accessLoading && user && canManageBrands) {
      fetchBrands();
    }
  }, [accessLoading, user, canManageBrands]);

  const fetchBrands = async () => {
    try {
      setIsLoading(true);
      const allBrands = await getAllBrands();
      const filteredBrands = filterBrandsByOwnership(allBrands);
      setBrands(filteredBrands);
    } catch (error) {
      console.error("Error fetching brands:", error);
      toast.error("Failed to load brands");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefreshSession = async () => {
    try {
      setIsLoading(true);
      console.log("🔄 Refreshing session...");

      const { data: refreshData, error: refreshError } =
        await supabase.auth.refreshSession();

      if (refreshError) {
        console.error("❌ Session refresh failed:", refreshError);
        toast.error("Failed to refresh session");
        return;
      }

      console.log("✅ Session refreshed successfully");
      toast.success("Session refreshed successfully");

      // Refresh brands data
      await fetchBrands();
    } catch (error) {
      console.error("❌ Error refreshing session:", error);
      toast.error("Failed to refresh session");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditBrand = (brand: Brand) => {
    // Check if user can edit this brand
    if (!canAccessBrand(brand.id)) {
      toast.error("You don't have permission to edit this brand");
      return;
    }

    setEditingBrand(brand);
    setEditForm({
      name: brand.name,
      description: brand.description || "",
      category: brand.category,
      location: brand.location,
      website: brand.website || "",
      instagram: brand.instagram || "",
      image: brand.image || "",
    });
  };

  const handleUpdateBrand = async (
    brandId: string,
    updates: Partial<Brand>
  ) => {
    // Check if user can update this brand
    if (!canAccessBrand(brandId)) {
      toast.error("You don't have permission to update this brand");
      return;
    }

    try {
      setIsLoading(true);

      // Add debugging information
      console.log("🔄 Attempting brand update:", {
        brandId,
        updates,
        isBrandOwner,
        isAdmin,
        ownedBrandIds,
      });

      // Force session refresh before attempting update
      console.log("🔄 Refreshing session...");
      const { data: refreshData, error: refreshError } =
        await supabase.auth.refreshSession();

      if (refreshError) {
        console.error("❌ Session refresh failed:", refreshError);
        throw new Error(`Session refresh failed: ${refreshError.message}`);
      }

      console.log("✅ Session refreshed, attempting database update...");

      // Get current session to verify authentication
      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();

      if (sessionError || !sessionData.session) {
        console.error("❌ No valid session found:", sessionError);
        throw new Error("Authentication session invalid");
      }

      console.log("✅ Valid session found, updating brand...");

      const { data, error } = await supabase
        .from("brands")
        .update(updates)
        .eq("id", brandId)
        .select()
        .single();

      if (error) {
        console.error("❌ Database update error:", error);

        // Provide specific error messages based on error codes
        if (error.code === "PGRST116") {
          throw new Error(
            "No matching record found or insufficient permissions"
          );
        } else if (error.code === "42501") {
          throw new Error(
            "Database permission denied - please refresh your session"
          );
        } else if (error.message.includes("RLS")) {
          throw new Error(
            "Row Level Security policy violation - please contact support"
          );
        } else {
          throw new Error(`Database error: ${error.message}`);
        }
      }

      console.log("✅ Brand updated successfully:", data);

      // Update local state
      setBrands(
        brands.map((brand) =>
          brand.id === brandId ? { ...brand, ...updates } : brand
        )
      );

      toast.success("Brand updated successfully");
      setEditingBrand(null);
    } catch (error) {
      console.error("❌ Error updating brand:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      toast.error(`Failed to update brand: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteBrand = async (brandId: string) => {
    // Check if user has permission to delete this specific brand
    if (!canAccessBrand(brandId)) {
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

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBrand) return;

    await handleUpdateBrand(editingBrand.id, editForm);
  };

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCategoryChange = (value: string) => {
    setEditForm((prev) => ({ ...prev, category: value }));
  };

  const handleImageUpload = (url: string) => {
    setEditForm((prev) => ({ ...prev, image: url }));
  };

  // Show loading state while checking access
  if (accessLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-oma-plum border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // Show access denied if user doesn't have permission
  if (!user || !canManageBrands) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Package className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-semibold">Access Denied</h3>
          <p className="mt-2 text-gray-500">
            You don't have permission to manage brands.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
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
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={handleRefreshSession}
            disabled={isLoading}
            className="text-sm"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Session
          </Button>
          {isAdmin && (
            <Button className="bg-oma-plum hover:bg-oma-plum/90">
              Add New Brand
            </Button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64 mt-8">
          <div className="animate-spin h-8 w-8 border-4 border-oma-plum border-t-transparent rounded-full"></div>
        </div>
      ) : brands.length === 0 ? (
        <Card className="mt-8">
          <CardContent className="p-8 text-center">
            <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {isBrandOwner ? "No Brands Assigned" : "No Brands Found"}
            </h3>
            <p className="text-gray-600">
              {isBrandOwner
                ? "You don't have any brands assigned to your account yet."
                : "No brands have been added to the system yet."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          {brands.map((brand) => (
            <Card key={brand.id} className="overflow-hidden">
              <div className="aspect-video relative">
                <AuthImage
                  src={brand.image}
                  alt={brand.name}
                  width={400}
                  height={225}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 right-2">
                  {brand.is_verified && (
                    <Badge className="bg-green-500 hover:bg-green-600">
                      Verified
                    </Badge>
                  )}
                </div>
              </div>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-lg text-oma-plum">
                    {brand.name}
                  </h3>
                  <div className="flex items-center text-sm text-oma-cocoa">
                    <Star className="h-4 w-4 mr-1 fill-current" />
                    {brand.rating.toFixed(1)}
                  </div>
                </div>
                <p className="text-sm text-oma-cocoa mb-2 line-clamp-2">
                  {brand.description}
                </p>
                <div className="flex items-center text-sm text-oma-cocoa mb-2">
                  <MapPin className="h-4 w-4 mr-1" />
                  {brand.location}
                </div>
                <Badge variant="secondary" className="mb-4">
                  {brand.category}
                </Badge>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditBrand(brand)}
                    className="flex-1"
                  >
                    <Pencil className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  {isAdmin && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteBrand(brand.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Brand Modal */}
      {editingBrand && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Edit Brand</CardTitle>
              <CardDescription>
                Update the information for {editingBrand.name}
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleFormSubmit}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Brand Name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={editForm.name}
                    onChange={handleFormChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={editForm.description}
                    onChange={handleFormChange}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={editForm.category}
                      onValueChange={handleCategoryChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Fashion">Fashion</SelectItem>
                        <SelectItem value="Beauty">Beauty</SelectItem>
                        <SelectItem value="Home & Living">
                          Home & Living
                        </SelectItem>
                        <SelectItem value="Food & Beverage">
                          Food & Beverage
                        </SelectItem>
                        <SelectItem value="Technology">Technology</SelectItem>
                        <SelectItem value="Health & Wellness">
                          Health & Wellness
                        </SelectItem>
                        <SelectItem value="Arts & Crafts">
                          Arts & Crafts
                        </SelectItem>
                        <SelectItem value="Services">Services</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      name="location"
                      value={editForm.location}
                      onChange={handleFormChange}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    name="website"
                    type="url"
                    value={editForm.website}
                    onChange={handleFormChange}
                    placeholder="https://..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="instagram">Instagram</Label>
                  <Input
                    id="instagram"
                    name="instagram"
                    value={editForm.instagram}
                    onChange={handleFormChange}
                    placeholder="@username"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Brand Image</Label>
                  <FileUpload
                    onUploadComplete={handleImageUpload}
                    bucket="brand-images"
                    accept="image/*"
                    maxSize={5 * 1024 * 1024} // 5MB
                  />
                  {editForm.image && (
                    <div className="mt-2">
                      <AuthImage
                        src={editForm.image}
                        alt="Brand preview"
                        width={200}
                        height={100}
                        className="rounded-md object-cover"
                      />
                    </div>
                  )}
                </div>
              </CardContent>
              <div className="flex justify-end space-x-2 p-6 pt-0">
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
                  {isLoading ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
