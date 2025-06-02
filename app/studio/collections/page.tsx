"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getAllBrands } from "@/lib/services/brandService";
import {
  getCollectionsWithBrands,
  deleteCollection,
} from "@/lib/services/collectionService";
import { Brand, Collection } from "@/lib/supabase";
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
import { PlusCircle, Search, Edit, Trash2, Eye } from "lucide-react";
import { toast } from "sonner";
import { AuthImage } from "@/components/ui/auth-image";

type CollectionWithBrand = Collection & { brand: { name: string; id: string } };

export default function CollectionsPage() {
  const router = useRouter();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [collections, setCollections] = useState<CollectionWithBrand[]>([]);
  const [filteredCollections, setFilteredCollections] = useState<
    CollectionWithBrand[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [selectedBrand, setSelectedBrand] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [collectionToDelete, setCollectionToDelete] = useState<string | null>(
    null
  );
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterCollections();
  }, [selectedBrand, searchQuery, collections]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch brands and collections in parallel
      const [brandsData, collectionsData] = await Promise.all([
        getAllBrands(),
        getCollectionsWithBrands(),
      ]);

      setBrands(brandsData);
      setCollections(collectionsData);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load collections");
    } finally {
      setLoading(false);
    }
  };

  const filterCollections = () => {
    let filtered = [...collections];

    // Filter by brand
    if (selectedBrand !== "all") {
      filtered = filtered.filter(
        (collection) => collection.brand_id === selectedBrand
      );
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (collection) =>
          collection.title.toLowerCase().includes(query) ||
          collection.brand.name.toLowerCase().includes(query)
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

  const handleEditCollection = (collectionId: string) => {
    router.push(`/studio/collections/${collectionId}/edit`);
  };

  const handleViewCollection = (collectionId: string) => {
    // Open collection page in new tab
    window.open(`/collection/${collectionId}`, "_blank");
  };

  const confirmDeleteCollection = (collectionId: string) => {
    setCollectionToDelete(collectionId);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteCollection = async () => {
    if (!collectionToDelete) return;

    setIsDeleting(true);
    try {
      await deleteCollection(collectionToDelete);

      // Remove the deleted collection from state
      const updatedCollections = collections.filter(
        (collection) => collection.id !== collectionToDelete
      );
      setCollections(updatedCollections);

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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-oma-plum border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-8 gap-4">
        <h1 className="text-3xl font-canela text-gray-900">Collections</h1>
        <Button
          asChild
          className="bg-oma-plum hover:bg-oma-plum/90 w-full sm:w-auto"
        >
          <Link
            href="/studio/collections/create"
            className="flex items-center justify-center gap-2"
          >
            <PlusCircle className="h-4 w-4" />
            Add New Collection
          </Link>
        </Button>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Collection Management</CardTitle>
          <CardDescription>
            Manage collections for all your brands
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search collections..."
                className="pl-10"
                value={searchQuery}
                onChange={handleSearchChange}
              />
            </div>

            <Select value={selectedBrand} onValueChange={handleBrandChange}>
              <SelectTrigger>
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
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <Search className="h-12 w-12 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No collections found
              </h3>
              <p className="text-gray-600 mb-6">
                {searchQuery || selectedBrand !== "all"
                  ? "Try adjusting your search or filter criteria."
                  : "Get started by creating your first collection."}
              </p>
              {!searchQuery && selectedBrand === "all" && (
                <Button asChild className="bg-oma-plum hover:bg-oma-plum/90">
                  <Link href="/studio/collections/create">
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Create First Collection
                  </Link>
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredCollections.map((collection) => (
                <Card
                  key={collection.id}
                  className="overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="aspect-square relative">
                    <AuthImage
                      src={collection.image}
                      alt={collection.title}
                      width={400}
                      height={400}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-lg mb-1 line-clamp-1">
                      {collection.title}
                    </h3>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-1">
                      by {collection.brand.name}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewCollection(collection.id)}
                        className="flex-1"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditCollection(collection.id)}
                        className="flex-1"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => confirmDeleteCollection(collection.id)}
                        className="flex-1"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

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
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCollection}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
