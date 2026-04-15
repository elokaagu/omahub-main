"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-unified";
import { getAllBrands } from "@/lib/services/brandService";
import {
  getCollectionsWithBrands,
  deleteCollection,
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
import {
  buildCollectionsPageAccess,
  getDeleteCollectionPermission,
  type CollectionsPageAccess,
} from "@/lib/studio/collectionsPageAccess";
import { collectionsPageDevLog } from "./collectionsPageDevLog";

type CollectionWithBrand = Catalogue & {
  brand?: {
    name: string;
    id: string;
    location: string;
    is_verified: boolean;
    category: string;
    rating: number;
    long_description: string;
  };
};

export default function CollectionsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const supabase = createClient();

  const [brands, setBrands] = useState<Brand[]>([]);
  const [collections, setCollections] = useState<CollectionWithBrand[]>([]);
  const [userPermissions, setUserPermissions] = useState<Permission[]>([]);
  const [access, setAccess] = useState<CollectionsPageAccess | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedBrand, setSelectedBrand] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [collectionToDelete, setCollectionToDelete] = useState<string | null>(
    null
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!user) {
      collectionsPageDevLog("Collections page: no user, skipping fetch");
      setLoading(false);
      setAccess(null);
      return;
    }

    setLoading(true);
    setFetchError(null);
    try {
      const [permissions, profileResult] = await Promise.all([
        getUserPermissions(user.id),
        supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      ]);

      setUserPermissions(permissions);

      if (profileResult.error) {
        collectionsPageDevLog(
          "Collections page: profile fetch error, using auth context for role",
          profileResult.error
        );
      }

      if (!permissions.includes("studio.catalogues.manage")) {
        setAccess(null);
        setBrands([]);
        setCollections([]);
        return;
      }

      const profileRow = profileResult.error ? null : profileResult.data;
      const resolvedAccess = buildCollectionsPageAccess(profileRow, user);
      setAccess(resolvedAccess);

      let nextBrands: Brand[] = [];
      let nextCollections: CollectionWithBrand[] = [];

      if (resolvedAccess.isAdmin) {
        const [brandsData, collectionsData] = await Promise.all([
          getAllBrands(),
          getCollectionsWithBrands(),
        ]);
        nextBrands = brandsData;
        nextCollections = collectionsData;
        setBrands(brandsData);
        setCollections(collectionsData);
      } else if (
        resolvedAccess.isBrandOwner &&
        resolvedAccess.ownedBrandIds.length > 0
      ) {
        const ownedIds = resolvedAccess.ownedBrandIds;
        const [brandsData, collectionsData] = await Promise.all([
          getAllBrands().then((all) =>
            all.filter((b) => ownedIds.includes(b.id))
          ),
          getCollectionsWithBrands().then((all) =>
            all.filter((c) => ownedIds.includes(c.brand_id))
          ),
        ]);
        nextBrands = brandsData;
        nextCollections = collectionsData;
        setBrands(brandsData);
        setCollections(collectionsData);
      } else {
        setBrands([]);
        setCollections([]);
      }

      collectionsPageDevLog("Collections page: fetch OK", {
        brands: nextBrands.length,
        collections: nextCollections.length,
        role: resolvedAccess.role,
      });
    } catch (error: unknown) {
      console.error("Collections page: fetch error", error);
      setFetchError(
        error instanceof Error ? error.message : "Unknown error"
      );
      setBrands([]);
      setCollections([]);
      setAccess(null);
      toast.error("Failed to load collections");
    } finally {
      setLoading(false);
    }
  }, [user, supabase]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const filteredCollections = useMemo(() => {
    let list = collections;
    if (selectedBrand !== "all") {
      list = list.filter((c) => c.brand_id === selectedBrand);
    }
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          (c.brand?.name ?? "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [collections, selectedBrand, searchQuery]);

  const handleEditCollection = (collectionId: string) => {
    router.push(`/studio/collections/${collectionId}/edit`);
  };

  const confirmDeleteCollection = (collectionId: string) => {
    if (!access) {
      toast.error("Unable to verify permissions. Please refresh the page.");
      return;
    }
    const collection = collections.find((c) => c.id === collectionId);
    if (!collection) return;

    const perm = getDeleteCollectionPermission(access, collection.brand_id);
    if (!perm.ok) {
      toast.error(perm.message);
      return;
    }

    setCollectionToDelete(collectionId);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteCollection = async () => {
    if (!collectionToDelete) return;

    setIsDeleting(true);
    try {
      await deleteCollection(collectionToDelete);
      setCollections((prev) => prev.filter((c) => c.id !== collectionToDelete));
      toast.success("Collection deleted successfully");
    } catch (error) {
      console.error("Error deleting collection:", error);
      toast.error("Failed to delete collection");
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
      setCollectionToDelete(null);
    }
  };

  const canManageCatalogues = userPermissions.includes(
    "studio.catalogues.manage"
  );
  const canCreateCatalogues = userPermissions.includes(
    "studio.catalogues.create"
  );

  const displayRole = access?.role ?? user?.role;

  if (loading) {
    return <Loading />;
  }

  if (fetchError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-6">
        <h2 className="text-2xl font-bold text-red-600 mb-2">
          Failed to load collections
        </h2>
        <p className="text-black/70 mb-4 max-w-md">{fetchError}</p>
        <Button
          type="button"
          onClick={() => void fetchData()}
          className="bg-oma-plum text-white"
        >
          Retry
        </Button>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-gray-500">Please sign in to access the studio.</p>
      </div>
    );
  }

  if (!canManageCatalogues) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-black">
          You don&apos;t have permission to manage collections.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-6 py-24">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-canela text-black mb-2">
              Collections
            </h1>
            <p className="text-black/70">
              {displayRole === "brand_admin" && brands.length > 0
                ? `Manage collections for your ${brands.length > 1 ? `${brands.length} brands` : "brand"}: ${brands.map((b) => b.name).join(", ")}`
                : "Create and manage your brand collections"}
            </p>
            {displayRole === "brand_admin" && collections.length > 0 && (
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
                New this month
              </CardTitle>
              <CardDescription className="text-xs text-black/50">
                Not tracked yet — needs reliable{" "}
                <code className="text-xs">created_at</code> on collections.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-black/40">—</div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black/40 w-4 h-4" />
            <Input
              placeholder="Search collections..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 border-oma-cocoa/20 focus:border-oma-plum bg-white/80"
            />
          </div>
          <Select value={selectedBrand} onValueChange={setSelectedBrand}>
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
            {filteredCollections.map((collection) => (
              <Card
                key={collection.id}
                className="border-oma-gold/20 bg-white/80 hover:border-oma-gold/40 transition-all duration-300 hover:shadow-lg"
              >
                <div className="aspect-[4/5] relative overflow-hidden rounded-t-lg">
                  <AuthImage
                    src={collection.image || "/placeholder-image.jpg"}
                    alt={collection.title}
                    aspectRatio="4/5"
                    className="w-full h-full"
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    quality={80}
                  />
                </div>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-canela text-black mb-1">
                        {collection.title}
                      </CardTitle>
                      <CardDescription className="text-black/60">
                        {collection.brand?.name ?? "Unknown brand"}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link
                        href={`/collection/${collection.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center border-oma-cocoa/20 text-black hover:bg-oma-cocoa/5"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      type="button"
                      onClick={() => handleEditCollection(collection.id)}
                      className="border-oma-cocoa/20 text-black hover:bg-oma-cocoa/5"
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      type="button"
                      onClick={() => confirmDeleteCollection(collection.id)}
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
                onClick={() => void handleDeleteCollection()}
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
