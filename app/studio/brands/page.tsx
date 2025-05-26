"use client";

import { useEffect, useState } from "react";
import { getAllBrands } from "@/lib/services/brandService";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brand } from "@/lib/supabase";
import { PlusCircle, Search, Star, CheckCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function BrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [filteredBrands, setFilteredBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  useEffect(() => {
    fetchBrands();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredBrands(brands);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = brands.filter(
        (brand) =>
          brand.name.toLowerCase().includes(query) ||
          brand.description.toLowerCase().includes(query) ||
          brand.category.toLowerCase().includes(query) ||
          brand.location.toLowerCase().includes(query)
      );
      setFilteredBrands(filtered);
    }
  }, [searchQuery, brands]);

  const fetchBrands = async () => {
    setLoading(true);
    try {
      const data = await getAllBrands();
      setBrands(data);
      setFilteredBrands(data);
    } catch (error) {
      console.error("Error fetching brands:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBrandClick = (brandId: string) => {
    router.push(`/studio/brands/${brandId}`);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-canela text-gray-900">Brands</h1>
        <Button asChild className="bg-oma-plum hover:bg-oma-plum/90">
          <Link
            href="/studio/brands/create"
            className="flex items-center gap-2"
          >
            <PlusCircle className="h-4 w-4" />
            Add New Brand
          </Link>
        </Button>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Brand Management</CardTitle>
          <CardDescription>
            Manage all your brands in the directory
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search brands by name, category, or location..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin h-8 w-8 border-4 border-oma-plum border-t-transparent rounded-full"></div>
        </div>
      ) : filteredBrands.length === 0 ? (
        <div className="bg-gray-50 border border-dashed border-gray-300 rounded-lg p-8 text-center">
          <p className="text-gray-600 mb-4">
            {searchQuery
              ? "No brands match your search criteria"
              : "No brands have been added yet"}
          </p>
          {!searchQuery && (
            <Button asChild className="bg-oma-plum hover:bg-oma-plum/90">
              <Link href="/studio/brands/create">Create Your First Brand</Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Brand</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBrands.map((brand) => (
                <TableRow
                  key={brand.id}
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => handleBrandClick(brand.id)}
                >
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-md overflow-hidden bg-gray-100 flex-shrink-0">
                        {brand.image && (
                          <img
                            src={brand.image}
                            alt={brand.name}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <span>{brand.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>{brand.category}</TableCell>
                  <TableCell>{brand.location}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Star className="h-4 w-4 text-yellow-400 mr-1" />
                      {brand.rating.toFixed(1)}
                    </div>
                  </TableCell>
                  <TableCell>
                    {brand.is_verified ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        Unverified
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-oma-plum border-oma-plum hover:bg-oma-plum hover:text-white"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/studio/brands/${brand.id}`);
                      }}
                    >
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
