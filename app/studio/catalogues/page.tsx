"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/lib/types/supabase";
import { getAllBrands } from "@/lib/services/brandService";
import {
  getCataloguesWithBrands,
  deleteCatalogue,
} from "@/lib/services/catalogueService";
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

type CatalogueWithBrand = Catalogue & { brand: { name: string; id: string } };
type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export default function CataloguesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const supabase = createClientComponentClient<Database>();

  const [brands, setBrands] = useState<Brand[]>([]);
  const [catalogues, setCatalogues] = useState<CatalogueWithBrand[]>([]);
  const [filteredCatalogues, setFilteredCatalogues] = useState<
    CatalogueWithBrand[]
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

  useEffect(() => {
    fetchData();
  }, [user]);

  useEffect(() => {
    filterCatalogues();
  }, [selectedBrand, searchQuery, catalogues]);

  const fetchData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Get user permissions and profile
      const [permissions, profileResult] = await Promise.all([
        getUserPermissions(user.id, user.email),
        supabase.from("profiles").select("*").eq("id", user.id).single(),
      ]);

      setUserPermissions(permissions);

      if (profileResult.error) {
        console.error("Error fetching profile:", profileResult.error);
      } else {
        setUserProfile(profileResult.data);
      }

      // Check if user has permission to manage catalogues
      if (!permissions.includes("studio.catalogues.manage")) {
        console.log("User doesn't have permission to manage catalogues");
        setLoading(false);
        return;
      }

      const isBrandOwner = user.role === "brand_admin";
      const isAdmin = user.role === "admin" || user.role === "super_admin";
      const ownedBrandIds = profileResult.data?.owned_brands || [];

      // Fetch brands and catalogues based on user role
      if (isAdmin) {
        // Admins see all brands and catalogues
        const [brandsData, cataloguesData] = await Promise.all([
          getAllBrands(),
          getCataloguesWithBrands(),
        ]);
        setBrands(brandsData);
        setCatalogues(cataloguesData);
      } else if (isBrandOwner && ownedBrandIds.length > 0) {
        // Brand owners see only their brands and catalogues
        const [brandsData, cataloguesData] = await Promise.all([
          getAllBrands().then((allBrands) =>
            allBrands.filter((brand) => ownedBrandIds.includes(brand.id))
          ),
          getCataloguesWithBrands().then((allCatalogues) =>
            allCatalogues.filter((catalogue) =>
              ownedBrandIds.includes(catalogue.brand_id)
            )
          ),
        ]);
        setBrands(brandsData);
        setCatalogues(cataloguesData);
      } else {
        // No access
        setBrands([]);
        setCatalogues([]);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load catalogues");
    } finally {
      setLoading(false);
    }
  };

  const filterCatalogues = () => {
    let filtered = [...catalogues];

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

    setFilteredCatalogues(filtered);
  };

  const handleBrandChange = (value: string) => {
    setSelectedBrand(value);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleEditCatalogue = (catalogueId: string) => {
    router.push(`/studio/catalogues/${catalogueId}/edit`);
  };

  const handleViewCatalogue = (catalogueId: string) => {
    // Open catalogue page in new tab
    window.open(`/catalogue/${catalogueId}`, "_blank");
  };

  const confirmDeleteCatalogue = (catalogueId: string) => {
    // Check if user can delete this catalogue
    const catalogue = catalogues.find((c) => c.id === catalogueId);
    const isBrandOwner = user?.role === "brand_admin";
    const isAdmin = user?.role === "admin" || user?.role === "super_admin";
    const ownedBrandIds = userProfile?.owned_brands || [];

    if (
      isBrandOwner &&
      catalogue &&
      !ownedBrandIds.includes(catalogue.brand_id)
    ) {
      toast.error("You can only delete catalogues from your own brands");
      return;
    }

    if (!isAdmin && !isBrandOwner) {
      toast.error("You don't have permission to delete catalogues");
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
      setCatalogues(catalogues.filter((c) => c.id !== catalogueToDelete));
      toast.success("Catalogue deleted successfully");
    } catch (error) {
      console.error("Error deleting catalogue:", error);
      toast.error("Failed to delete catalogue");
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
          You don't have permission to manage catalogues.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-6 py-24">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-canela text-black mb-2">Catalogues</h1>
            <p className="text-black/70">
              Create and manage your brand catalogues
            </p>
          </div>
          {canCreateCatalogues && (
            <Link href="/studio/catalogues/create">
              <Button className="bg-oma-plum hover:bg-oma-plum/90 text-white">
                <PlusCircle className="w-4 h-4 mr-2" />
                Create Catalogue
              </Button>
            </Link>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-oma-gold/20 bg-white/80">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-black/70">
                Total Catalogues
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-black">
                {catalogues.length}
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
                  catalogues.filter((c) => {
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
              placeholder="Search catalogues..."
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

        {/* Catalogues Grid */}
        {filteredCatalogues.length === 0 ? (
          <Card className="border-oma-gold/20 bg-white/80">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Package className="w-16 h-16 text-black/30 mb-4" />
              <h3 className="text-xl font-canela text-black mb-2">
                No catalogues found
              </h3>
              <p className="text-black/60 text-center mb-6">
                {catalogues.length === 0
                  ? "Get started by creating your first catalogue"
                  : "Try adjusting your search or filter criteria"}
              </p>
              {canCreateCatalogues && catalogues.length === 0 && (
                <Link href="/studio/catalogues/create">
                  <Button className="bg-oma-plum hover:bg-oma-plum/90 text-white">
                    <PlusCircle className="w-4 h-4 mr-2" />
                    Create Your First Catalogue
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCatalogues.map((catalogue) => (
              <Card
                key={catalogue.id}
                className="border-oma-gold/20 bg-white/80 hover:border-oma-gold/40 transition-all duration-300 hover:shadow-lg"
              >
                <div className="aspect-[4/3] relative overflow-hidden rounded-t-lg">
                  <AuthImage
                    src={catalogue.image}
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
              <AlertDialogTitle>Delete Catalogue</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this catalogue? This action
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
