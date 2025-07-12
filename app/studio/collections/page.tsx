"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/lib/types/supabase";
import { getAllBrands } from "@/lib/services/brandService";
import {
  getCollectionsWithBrands as getCataloguesWithBrands,
  deleteCollection as deleteCatalogue,
} from "@/lib/services/collectionService";
import {
  getUserPermissions,
  Permission,
} from "@/lib/services/permissionsService";
import { useAuth } from "@/contexts/AuthContext";
import { Brand, Catalogue } from "@/lib/supabase";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { PlusCircle, Search, Edit, Trash2, Eye, Package } from "lucide-react";
import { toast } from "sonner";
import { AuthImage } from "@/components/ui/auth-image";
import { Loading } from "@/components/ui/loading";

type CollectionWithBrand = Catalogue & {
  brand: {
    name: string;
    id: string;
    location: string;
    is_verified: boolean;
    category: string;
    rating: number;
    long_description: string;
  };
};
type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export default function CollectionsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const supabase = createClientComponentClient<Database>();

  const [brands, setBrands] = useState<Brand[]>([]);
  const [collections, setCollections] = useState<CollectionWithBrand[]>([]);
  const [filteredCollections, setFilteredCollections] = useState<
    CollectionWithBrand[]
  >([]);
  const [userPermissions, setUserPermissions] = useState<Permission[]>([]);
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedBrand, setSelectedBrand] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [catalogueToDelete, setCatalogueToDelete] = useState<string | null>(
    null
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [user]);

  useEffect(() => {
    filterCatalogues();
  }, [selectedBrand, searchQuery, collections]);

  const fetchData = async () => {
    if (!user) {
      console.log("📚 Catalogues Page: No user, skipping fetch");
      setLoading(false);
      return;
    }

    console.log("🔍 ENHANCED DEBUG: Starting fetchData for user:", {
      id: user.id,
      email: user.email,
      role: user.role,
      owned_brands: user.owned_brands,
      fullUserObject: user,
    });

    setLoading(true);
    setFetchError(null);
    try {
      // Get user permissions and profile
      const [permissions, profileResult] = await Promise.all([
        getUserPermissions(user.id, user.email),
        supabase.from("profiles").select("*").eq("id", user.id).single(),
      ]);

      console.log("🔍 ENHANCED DEBUG: Auth data fetched:", {
        permissions,
        profileError: profileResult.error,
        profileData: profileResult.data,
        userFromContext: {
          id: user.id,
          email: user.email,
          role: user.role,
          owned_brands: user.owned_brands,
        },
      });

      console.log("📚 Catalogues Page: Permissions:", permissions);
      console.log("📚 Catalogues Page: Profile result:", {
        error: profileResult.error,
        data: profileResult.data
          ? {
              id: profileResult.data.id,
              email: profileResult.data.email,
              role: profileResult.data.role,
              owned_brands: profileResult.data.owned_brands,
            }
          : null,
      });

      setUserPermissions(permissions);

      if (profileResult.error) {
        console.error(
          "❌ Catalogues Page: Error fetching profile:",
          profileResult.error
        );
      } else {
        setUserProfile(profileResult.data);
      }

      // Check if user has permission to manage catalogues
      if (!permissions.includes("studio.catalogues.manage")) {
        console.log(
          "⚠️ Catalogues Page: User doesn't have permission to manage catalogues"
        );
        setLoading(false);
        return;
      }

      const isBrandOwner = user.role === "brand_admin";
      const isAdmin = user.role === "admin" || user.role === "super_admin";
      const ownedBrandIds =
        profileResult.data?.owned_brands || user.owned_brands || [];

      console.log("📚 Catalogues Page: Role analysis:", {
        isBrandOwner,
        isAdmin,
        ownedBrandIds,
        ownedBrandCount: ownedBrandIds.length,
        profileOwnedBrands: profileResult.data?.owned_brands,
        userContextOwnedBrands: user.owned_brands,
        fallbackUsed: !profileResult.data?.owned_brands && user.owned_brands,
      });

      // Use profile role as primary source of truth, fallback to user context
      const profileRole = profileResult.data?.role;
      const effectiveRole = profileRole || user.role;
      const effectiveIsBrandOwner = effectiveRole === "brand_admin";
      const effectiveIsAdmin =
        effectiveRole === "admin" || effectiveRole === "super_admin";

      console.log("📚 Catalogues Page: Enhanced role analysis:", {
        userContextRole: user.role,
        profileRole,
        effectiveRole,
        originalIsBrandOwner: isBrandOwner,
        effectiveIsBrandOwner,
        originalIsAdmin: isAdmin,
        effectiveIsAdmin,
        ownedBrandIds,
        ownedBrandCount: ownedBrandIds.length,
        userPermissions: permissions,
      });

      // Use effective role for decision making
      const finalIsBrandOwner = effectiveIsBrandOwner;
      const finalIsAdmin = effectiveIsAdmin;

      // Fetch brands and catalogues based on user role
      if (finalIsAdmin) {
        console.log("📚 Catalogues Page: Admin user - fetching all data");
        // Admins see all brands and catalogues
        const [brandsData, cataloguesData] = await Promise.all([
          getAllBrands(),
          getCataloguesWithBrands(),
        ]);
        console.log("📚 Catalogues Page: Admin data fetched:", {
          brandsCount: brandsData.length,
          cataloguesCount: cataloguesData.length,
        });
        setBrands(brandsData);
        setCollections(cataloguesData);
      } else if (finalIsBrandOwner && ownedBrandIds.length > 0) {
        console.log(
          "📚 Catalogues Page: Brand owner with owned brands - fetching filtered data"
        );
        // Brand owners see only their brands and catalogues
        const [brandsData, cataloguesData] = await Promise.all([
          getAllBrands().then((allBrands) => {
            console.log(
              "📚 Catalogues Page: All brands fetched:",
              allBrands.length
            );
            const filtered = allBrands.filter((brand) =>
              ownedBrandIds.includes(brand.id)
            );
            console.log("📚 Catalogues Page: Filtered brands for owner:", {
              total: allBrands.length,
              filtered: filtered.length,
              ownedBrandIds,
              filteredBrands: filtered.map((b) => ({ id: b.id, name: b.name })),
            });
            return filtered;
          }),
          getCataloguesWithBrands().then((allCatalogues) => {
            console.log(
              "📚 Catalogues Page: All catalogues fetched:",
              allCatalogues.length
            );
            const filtered = allCatalogues.filter((catalogue) =>
              ownedBrandIds.includes(catalogue.brand_id)
            );
            console.log("📚 Catalogues Page: Filtered catalogues for owner:", {
              total: allCatalogues.length,
              filtered: filtered.length,
              ownedBrandIds,
              filteredCatalogues: filtered.map((c) => ({
                id: c.id,
                title: c.title,
                brand_id: c.brand_id,
                brand_name: c.brand?.name,
              })),
            });
            return filtered;
          }),
        ]);
        setBrands(brandsData);
        setCollections(cataloguesData);
      } else {
        console.log(
          "📚 Catalogues Page: No access - user is not admin and has no owned brands"
        );
        // No access
        setBrands([]);
        setCollections([]);
      }
    } catch (error: any) {
      console.error("❌ Catalogues Page: Error fetching data:", error);
      setFetchError(error?.message || "Unknown error");
      toast.error("Failed to load collections");
    } finally {
      console.log(
        "📚 Catalogues Page: Fetch completed, setting loading to false"
      );
      setLoading(false);
    }
  };

  const filterCatalogues = () => {
    let filtered = [...collections];

    // Filter by brand
    if (selectedBrand !== "all") {
      filtered = filtered.filter(
        (catalogue) => catalogue.brand_id === selectedBrand
      );
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (catalogue) =>
          catalogue.title.toLowerCase().includes(query) ||
          catalogue.brand.name.toLowerCase().includes(query)
      );
    }

    setFilteredCollections(filtered);
  };

  const handleBrandChange = (value: string) => {
    setSelectedBrand(value);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleEditCatalogue = (catalogueId: string) => {
    router.push(`/studio/collections/${catalogueId}/edit`);
  };

  const handleViewCatalogue = (catalogueId: string) => {
    // Open catalogue page in new tab
    window.open(`/collection/${catalogueId}`, "_blank");
  };

  const confirmDeleteCatalogue = (catalogueId: string) => {
    // Check if user can delete this catalogue
    const catalogue = collections.find((c) => c.id === catalogueId);
    // Use profile role as primary source of truth
    const profileRole = userProfile?.role;
    const effectiveRole = profileRole || user?.role;
    const isBrandOwner = effectiveRole === "brand_admin";
    const isAdmin =
      effectiveRole === "admin" || effectiveRole === "super_admin";
    const ownedBrandIds = userProfile?.owned_brands || user?.owned_brands || [];

    console.log("🗑️ Catalogues Page: Delete permission check:", {
      catalogueId,
      catalogueBrandId: catalogue?.brand_id,
      userRole: user?.role,
      profileRole,
      effectiveRole,
      isBrandOwner,
      isAdmin,
      ownedBrandIds,
      profileOwnedBrands: userProfile?.owned_brands,
      userContextOwnedBrands: user?.owned_brands,
      fallbackUsed: !userProfile?.owned_brands && user?.owned_brands,
      hasAccess:
        !isBrandOwner ||
        (catalogue && ownedBrandIds.includes(catalogue.brand_id)),
    });

    if (
      isBrandOwner &&
      catalogue &&
      !ownedBrandIds.includes(catalogue.brand_id)
    ) {
      toast.error("You can only delete collections from your own brands");
      return;
    }

    if (!isAdmin && !isBrandOwner) {
      toast.error("You don't have permission to delete collections");
      return;
    }

    setCatalogueToDelete(catalogueId);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteCatalogue = async () => {
    if (!catalogueToDelete) return;

    setIsDeleting(true);
    try {
      await deleteCatalogue(catalogueToDelete);
      setCollections(collections.filter((c) => c.id !== catalogueToDelete));
      toast.success("Collection deleted successfully");
    } catch (error) {
      console.error("Error deleting catalogue:", error);
      toast.error("Failed to delete collection");
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
      setCatalogueToDelete(null);
    }
  };

  // Check permissions
  const canManageCatalogues = userPermissions.includes(
    "studio.catalogues.manage"
  );
  const canCreateCatalogues = userPermissions.includes(
    "studio.catalogues.create"
  );

  if (loading) {
    return <Loading />;
  }

  if (fetchError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <h2 className="text-2xl font-bold text-red-600 mb-2">
          Failed to load collections
        </h2>
        <p className="text-black/70 mb-4">{fetchError}</p>
        <Button onClick={fetchData} className="bg-oma-plum text-white">
          Retry
        </Button>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Please sign in to access the studio.</p>
      </div>
    );
  }

  if (!canManageCatalogues) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-black">
          You don't have permission to manage collections.
        </p>
      </div>
    );
  }

  // Debug logging for render
  console.log("📚 Catalogues Page: Rendering with data:", {
    cataloguesCount: collections.length,
    filteredCataloguesCount: filteredCollections.length,
    brandsCount: brands.length,
    selectedBrand,
    searchQuery,
    canManageCatalogues,
    canCreateCatalogues,
    userRole: user?.role,
  });

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-6 py-24">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-canela text-black mb-2">
              Collections
            </h1>
            <p className="text-black/70">
              {user?.role === "brand_admin" && brands.length > 0
                ? `Manage collections for your ${brands.length > 1 ? `${brands.length} brands` : "brand"}: ${brands.map((b) => b.name).join(", ")}`
                : "Create and manage your brand collections"}
            </p>
            {user?.role === "brand_admin" && collections.length > 0 && (
              <p className="text-sm text-oma-plum/70 mt-1">
                Showing {collections.length} collection
                {collections.length !== 1 ? "s" : ""} from your owned brands
              </p>
            )}
          </div>
          {canCreateCatalogues && (
            <Link
              href="/studio/collections/create"
              className="w-full sm:w-auto"
            >
              <Button className="bg-oma-plum hover:bg-oma-plum/90 text-white w-full sm:w-auto">
                <PlusCircle className="w-4 h-4 mr-2" />
                Create Collection
              </Button>
            </Link>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-oma-gold/20 bg-white/80">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-black/70">
                Total Collections
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-black">
                {collections.length}
              </div>
            </CardContent>
          </Card>
          <Card className="border-oma-gold/20 bg-white/80">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-black/70">
                Active Brands
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-black">
                {brands.length}
              </div>
            </CardContent>
          </Card>
          <Card className="border-oma-gold/20 bg-white/80">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-black/70">
                This Month
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-black">
                {
                  collections.filter((c) => {
                    // Since created_at might not be available in the Catalogue type,
                    // we'll show 0 for now or implement proper date tracking
                    return false;
                  }).length
                }
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black/40 w-4 h-4" />
            <Input
              placeholder="Search collections..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="pl-10 border-oma-cocoa/20 focus:border-oma-plum bg-white/80"
            />
          </div>
          <Select value={selectedBrand} onValueChange={handleBrandChange}>
            <SelectTrigger className="w-full sm:w-48 border-oma-cocoa/20 bg-white/80">
              <SelectValue placeholder="Filter by brand" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Brands</SelectItem>
              {brands.map((brand) => (
                <SelectItem key={brand.id} value={brand.id}>
                  {brand.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Collections Grid */}
        {filteredCollections.length === 0 ? (
          <Card className="border-oma-gold/20 bg-white/80">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Package className="w-16 h-16 text-black/30 mb-4" />
              <h3 className="text-xl font-canela text-black mb-2">
                No collections found
              </h3>
              <p className="text-black/60 text-center mb-6">
                {collections.length === 0
                  ? "Get started by creating your first collection"
                  : "Try adjusting your search or filter criteria"}
              </p>
              {canCreateCatalogues && collections.length === 0 && (
                <Link href="/studio/collections/create">
                  <Button className="bg-oma-plum hover:bg-oma-plum/90 text-white">
                    <PlusCircle className="w-4 h-4 mr-2" />
                    Create Your First Collection
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCollections.map((catalogue) => (
              <Card
                key={catalogue.id}
                className="border-oma-gold/20 bg-white/80 hover:border-oma-gold/40 transition-all duration-300 hover:shadow-lg"
              >
                <div className="aspect-[4/3] relative overflow-hidden rounded-t-lg">
                  <AuthImage
                    src={catalogue.image || "/placeholder-image.jpg"}
                    alt={catalogue.title}
                    aspectRatio="4/3"
                    className="w-full h-full"
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    quality={80}
                  />
                </div>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-canela text-black mb-1">
                        {catalogue.title}
                      </CardTitle>
                      <CardDescription className="text-black/60">
                        {catalogue.brand.name}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewCatalogue(catalogue.id)}
                      className="border-oma-cocoa/20 text-black hover:bg-oma-cocoa/5"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditCatalogue(catalogue.id)}
                      className="border-oma-cocoa/20 text-black hover:bg-oma-cocoa/5"
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => confirmDeleteCatalogue(catalogue.id)}
                      className="border-red-200 text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Collection</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this collection? This action
                cannot be undone and will remove all associated data.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteCatalogue}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
