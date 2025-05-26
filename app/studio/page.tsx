"use client";

import { useEffect, useState } from "react";
import { getAllBrands } from "@/lib/services/brandService";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brand } from "@/lib/supabase";
import { PlusCircle, RefreshCw } from "lucide-react";

export default function StudioDashboard() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalBrands: 0,
    totalCollections: 0,
    totalReviews: 0,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const brandsData = await getAllBrands();
      setBrands(brandsData);

      // Calculate stats
      const collectionsCount = brandsData.reduce((acc, brand) => {
        // This is a placeholder since we don't have collection counts in the brand object
        // You would need to fetch this from the API or modify your data model
        return acc + Math.floor(Math.random() * 5); // Placeholder for demo
      }, 0);

      const reviewsCount = brandsData.reduce((acc, brand) => {
        // Using random values for demo purposes
        return acc + Math.floor(Math.random() * 10); // Placeholder for demo
      }, 0);

      setStats({
        totalBrands: brandsData.length,
        totalCollections: collectionsCount,
        totalReviews: reviewsCount,
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-canela text-gray-900">Dashboard</h1>
        <Button
          onClick={fetchData}
          variant="outline"
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Total Brands</CardTitle>
            <CardDescription>Number of brands in the directory</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">
              {loading ? (
                <span className="animate-pulse">...</span>
              ) : (
                stats.totalBrands
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Collections</CardTitle>
            <CardDescription>Total collections published</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">
              {loading ? (
                <span className="animate-pulse">...</span>
              ) : (
                stats.totalCollections
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Reviews</CardTitle>
            <CardDescription>Customer reviews received</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">
              {loading ? (
                <span className="animate-pulse">...</span>
              ) : (
                stats.totalReviews
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Brands */}
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">Recent Brands</h2>
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

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin h-8 w-8 border-4 border-oma-plum border-t-transparent rounded-full"></div>
        </div>
      ) : brands.length === 0 ? (
        <Card className="bg-gray-50 border border-dashed border-gray-300">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-gray-600 mb-4">No brands have been added yet</p>
            <Button asChild className="bg-oma-plum hover:bg-oma-plum/90">
              <Link href="/studio/brands/create">Create Your First Brand</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {brands.slice(0, 6).map((brand) => (
            <Card key={brand.id} className="overflow-hidden">
              <div className="h-36 bg-gray-200 relative">
                {brand.image ? (
                  <img
                    src={brand.image}
                    alt={brand.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    No image
                  </div>
                )}
              </div>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{brand.name}</CardTitle>
                <CardDescription>{brand.category}</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                  {brand.description}
                </p>
                <Button
                  asChild
                  variant="outline"
                  className="w-full text-oma-plum border-oma-plum hover:bg-oma-plum hover:text-white"
                >
                  <Link href={`/studio/brands/${brand.id}`}>Manage Brand</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {brands.length > 6 && (
        <div className="mt-6 text-center">
          <Button asChild variant="outline">
            <Link href="/studio/brands">View All Brands</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
