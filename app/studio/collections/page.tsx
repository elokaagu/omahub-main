"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getAllBrands } from "@/lib/services/brandService";
import { Brand, Collection } from "@/lib/supabase";
import { getBrandCollections } from "@/lib/services/brandService";
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
import { PlusCircle, Search, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function CollectionsPage() {
  const router = useRouter();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [collections, setCollections] = useState<
    (Collection & { brandName: string })[]
  >([]);
  const [filteredCollections, setFilteredCollections] = useState<
    (Collection & { brandName: string })[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [selectedBrand, setSelectedBrand] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterCollections();
  }, [selectedBrand, searchQuery, collections]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const brandsData = await getAllBrands();
      setBrands(brandsData);

      // Fetch collections for all brands
      const allCollections = [];
      for (const brand of brandsData) {
        const brandCollections = await getBrandCollections(brand.id);
        const collectionsWithBrandName = brandCollections.map((collection) => ({
          ...collection,
          brandName: brand.name,
        }));
        allCollections.push(...collectionsWithBrandName);
      }
      setCollections(allCollections);
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
          collection.brandName.toLowerCase().includes(query)
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

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-canela text-gray-900">Collections</h1>
        <Button asChild className="bg-oma-plum hover:bg-oma-plum/90">
          <Link
            href="/studio/collections/create"
            className="flex items-center gap-2"
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin h-8 w-8 border-4 border-oma-plum border-t-transparent rounded-full"></div>
        </div>
      ) : filteredCollections.length === 0 ? (
        <div className="bg-gray-50 border border-dashed border-gray-300 rounded-lg p-8 text-center">
          <p className="text-gray-600 mb-4">
            {collections.length === 0
              ? "No collections have been added yet"
              : "No collections match your search criteria"}
          </p>
          {collections.length === 0 && (
            <Button asChild className="bg-oma-plum hover:bg-oma-plum/90">
              <Link href="/studio/collections/create">
                Create Your First Collection
              </Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCollections.map((collection) => (
            <Card
              key={collection.id}
              className="overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="aspect-[4/3] relative">
                {collection.image ? (
                  <img
                    src={collection.image}
                    alt={collection.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">
                    No image
                  </div>
                )}
              </div>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{collection.title}</CardTitle>
                <CardDescription>{collection.brandName}</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex space-x-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 flex items-center justify-center gap-1"
                    onClick={() =>
                      router.push(`/studio/collections/${collection.id}/edit`)
                    }
                  >
                    <Edit className="h-4 w-4" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 flex items-center justify-center gap-1 text-red-500 hover:text-white hover:bg-red-500 hover:border-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
