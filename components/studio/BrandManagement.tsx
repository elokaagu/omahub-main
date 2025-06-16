"use client";

import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import {
  getAllBrands,
  invalidateBrandsCache,
} from "@/lib/services/brandService";
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
import BrandManagementDebug from "./BrandManagementDebug";

interface BrandManagementProps {
  className?: string;
}

// Character limits
const SHORT_DESCRIPTION_LIMIT = 150;
const BRAND_NAME_LIMIT = 50; // Add brand name character limit

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
    refresh,
  } = useBrandOwnerAccess();

  const supabase = createClientComponentClient();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
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

  // Simplified tab visibility change listener with much longer debounce
  useEffect(() => {
    if (typeof window === "undefined") return;

    let refreshTimeout: NodeJS.Timeout;
    const REFRESH_DEBOUNCE_MS = 10000; // Increased to 10 seconds to reduce aggressive refreshing

    const handleVisibilityChange = () => {
      // Only refresh if tab was hidden for a significant time and user has permissions
      if (!document.hidden && user && canManageBrands && !accessLoading) {
        clearTimeout(refreshTimeout);
        refreshTimeout = setTimeout(() => {
          console.log(
            "👁️ Tab became visible after long absence, refreshing brands..."
          );
          invalidateBrandsCache(); // Clear cache to ensure fresh data
          fetchBrands();
        }, REFRESH_DEBOUNCE_MS);
      }
    };

    // Remove the aggressive focus listener - only keep visibility change
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      clearTimeout(refreshTimeout);
    };
  }, [user, canManageBrands, accessLoading]);

  const fetchBrands = async () => {
    try {
      setIsLoading(true);
      setAuthError(null); // Clear any previous auth errors
      const allBrands = await getAllBrands();
      const filteredBrands = filterBrandsByOwnership(allBrands);
      setBrands(filteredBrands);
    } catch (error) {
      console.error("Error fetching brands:", error);

      // Check if it's an authentication error
      if (
        error instanceof Error &&
        (error.message.includes("auth") ||
          error.message.includes("session") ||
          error.message.includes("unauthorized"))
      ) {
        setAuthError("Authentication session expired. Please sign in again.");
      } else {
        toast.error("Failed to load brands");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefreshSession = async () => {
    try {
      setIsLoading(true);
      console.log("🔄 Manual session refresh requested...");

      const { data: refreshData, error: refreshError } =
        await supabase.auth.refreshSession();

      if (refreshError) {
        console.error("❌ Session refresh failed:", refreshError);
        toast.error(
          "Session refresh failed - please sign out and sign back in"
        );
        return;
      }

      console.log("✅ Session refreshed successfully");
      toast.success("Session refreshed successfully");

      // Refresh brands data
      await fetchBrands();
    } catch (error) {
      console.error("❌ Error refreshing session:", error);
      toast.error(
        "Failed to refresh session - please sign out and sign back in"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuthRecovery = async () => {
    try {
      console.log("🔄 Starting authentication recovery...");

      // Sign out the user
      const { error: signOutError } = await supabase.auth.signOut();

      if (signOutError) {
        console.error("❌ Error signing out:", signOutError);
        toast.error("Failed to sign out - please refresh the page");
        return;
      }

      console.log("✅ Signed out successfully");
      toast.success("Signed out successfully - please sign in again");

      // Redirect to login page
      window.location.href = "/login?redirect=/studio";
    } catch (error) {
      console.error("❌ Error during authentication recovery:", error);
      toast.error("Authentication recovery failed - please refresh the page");
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

      console.log("✅ Updating brand...");

      // Use the new API endpoint that handles name propagation
      const response = await fetch(`/api/studio/brands/${brandId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to update brand");
      }

      console.log("✅ Brand updated successfully:", result.brand);

      // Update local state
      setBrands(
        brands.map((brand) =>
          brand.id === brandId ? { ...brand, ...updates } : brand
        )
      );

      if (result.nameChanged) {
        toast.success(
          "Brand updated successfully! Name changes have been propagated across all connections."
        );
      } else {
        toast.success("Brand updated successfully");
      }
      setEditingBrand(null);
    } catch (error) {
      console.error("❌ Error updating brand:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      toast.error(errorMessage);
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

      // Use API route for deletion to handle permissions properly
      const response = await fetch(`/api/brands/${brandId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to delete brand");
      }

      // Remove brand from local state
      setBrands(brands.filter((brand) => brand.id !== brandId));
      toast.success(result.message || "Brand deleted successfully");

      // Refresh user data to update owned_brands array
      refresh();
    } catch (error) {
      console.error("Error deleting brand:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to delete brand";
      toast.error(errorMessage);
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

    // Handle character limit for brand name
    if (name === "name" && value.length > BRAND_NAME_LIMIT) {
      return; // Don't update if exceeding limit
    }

    // Handle character limit for description
    if (name === "description" && value.length > SHORT_DESCRIPTION_LIMIT) {
      return; // Don't update if exceeding limit
    }

    setEditForm({ ...editForm, [name]: value });
  };

  const handleCategoryChange = (value: string) => {
    setEditForm((prev) => ({ ...prev, category: value }));
  };

  const handleImageUpload = (url: string) => {
    setEditForm((prev) => ({ ...prev, image: url }));
  };

  // Calculate remaining characters for description
  const remainingChars =
    SHORT_DESCRIPTION_LIMIT - (editForm.description || "").length;

  // Calculate remaining characters for brand name
  const remainingNameChars = BRAND_NAME_LIMIT - (editForm.name || "").length;

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
      {/* Debug component for development */}
      <BrandManagementDebug />

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
          <Button
            variant="outline"
            onClick={handleAuthRecovery}
            disabled={isLoading}
            className="text-sm text-orange-600 hover:text-orange-700 border-orange-300 hover:border-orange-400"
          >
            Sign Out & Sign In
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
      ) : authError ? (
        <Card className="mt-8 border-orange-200 bg-orange-50">
          <CardContent className="p-8 text-center">
            <Package className="mx-auto h-12 w-12 text-orange-400 mb-4" />
            <h3 className="text-lg font-semibold text-orange-900 mb-2">
              Authentication Issue
            </h3>
            <p className="text-orange-700 mb-6">{authError}</p>
            <div className="flex justify-center space-x-4">
              <Button
                variant="outline"
                onClick={handleRefreshSession}
                disabled={isLoading}
                className="border-orange-300 text-orange-700 hover:bg-orange-100"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Refresh Session
              </Button>
              <Button
                onClick={handleAuthRecovery}
                disabled={isLoading}
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                Sign Out & Sign In Again
              </Button>
            </div>
          </CardContent>
        </Card>
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
                  {(isAdmin || canAccessBrand(brand.id)) && (
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
                  <div className="flex items-center justify-between">
                    <Label htmlFor="name">Brand Name</Label>
                    <span
                      className={`text-sm ${remainingNameChars < 10 ? "text-red-500" : "text-muted-foreground"}`}
                    >
                      {remainingNameChars} characters remaining
                    </span>
                  </div>
                  <Input
                    id="name"
                    name="name"
                    value={editForm.name}
                    onChange={handleFormChange}
                    required
                    className={remainingNameChars < 0 ? "border-red-500" : ""}
                  />
                  <p className="text-xs text-muted-foreground">
                    Keep it concise and memorable (max 50 characters)
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="description">Description</Label>
                    <span
                      className={`text-sm ${remainingChars < 20 ? "text-red-500" : "text-muted-foreground"}`}
                    >
                      {remainingChars} characters remaining
                    </span>
                  </div>
                  <Textarea
                    id="description"
                    name="description"
                    value={editForm.description}
                    onChange={handleFormChange}
                    rows={3}
                    placeholder="A brief description of the brand (max 150 characters)"
                    className={remainingChars < 0 ? "border-red-500" : ""}
                  />
                  <p className="text-xs text-muted-foreground">
                    Keep it concise - this appears in brand listings and
                    previews
                  </p>
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
