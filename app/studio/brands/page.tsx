"use client";

import { useEffect, useState, useCallback } from "react";
import { getAllBrands } from "@/lib/services/brandService";
import {
  getUserPermissions,
  Permission,
} from "@/lib/services/permissionsService";
import { useAuth } from "@/contexts/AuthContext";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/lib/types/supabase";
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
import {
  PlusCircle,
  Search,
  Star,
  CheckCircle,
  Package,
} from "@/components/ui/icons";
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
import { AuthImage } from "@/components/ui/auth-image";
import { Loading } from "@/components/ui/loading";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useStudioOptimization } from "@/lib/hooks/useStudioOptimization";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export default function BrandsPage() {
  const { user, refreshUserProfile } = useAuth();
  const supabase = createClientComponentClient<Database>();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [filteredBrands, setFilteredBrands] = useState<Brand[]>([]);
  const [userPermissions, setUserPermissions] = useState<Permission[]>([]);
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  // Use optimization hook to prevent constant reloading
  const { debouncedFetch, controlledRefresh, forceRefresh } = useStudioOptimization({
    debounceMs: 1000, // 1 second debounce
    maxRefreshIntervalMs: 30000, // 30 seconds max between checks
    enableRealTimeUpdates: true,
  });

  const fetchData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Get user permissions and profile directly without refreshing
      const [permissions, profileResult] = await Promise.all([
        getUserPermissions(user.id, user.email),
        supabase.from("profiles").select("*").eq("id", user.id).single(),
      ]);

      setUserPermissions(permissions);

      if (profileResult.error) {
        console.error("Error fetching profile:", profileResult.error);
        // Use user context as fallback
        setUserProfile({
          id: user.id,
          email: user.email,
          role: user.role || "user",
          owned_brands: user.owned_brands || [],
          first_name: user.first_name || null,
          last_name: user.last_name || null,
          avatar_url: user.avatar_url || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as Profile);
      } else {
        setUserProfile(profileResult.data);
      }

      // Get brands based on user role
      if (permissions.includes("studio.brands.manage")) {
        const effectiveProfile = profileResult.data || {
          role: user.role,
          owned_brands: user.owned_brands || [],
        };

        const isAdmin =
          effectiveProfile.role === "admin" ||
          effectiveProfile.role === "super_admin";
        const isBrandOwner = effectiveProfile.role === "brand_admin";
        const ownedBrandIds = effectiveProfile.owned_brands || [];

        if (isAdmin) {
          // Admins see all brands with brand_images relationship
          const { data: fetchedBrands, error } = await supabase
            .from("brands")
            .select("*, brand_images(*)")
            .order("name");

          if (error) throw error;
          setBrands(fetchedBrands || []);
        } else if (isBrandOwner && ownedBrandIds.length > 0) {
          // Brand owners see only their brands with brand_images relationship
          const { data: fetchedBrands, error } = await supabase
            .from("brands")
            .select("*, brand_images(*)")
            .in("id", ownedBrandIds)
            .order("name");

          if (error) throw error;
          setBrands(fetchedBrands || []);
        } else {
          setBrands([]);
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [user, supabase]); // Only depend on user and supabase

  useEffect(() => {
    // Use controlled refresh to prevent excessive calls
    controlledRefresh(fetchData);
  }, [fetchData, controlledRefresh]); // Now safe to depend on fetchData since it's memoized

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredBrands(brands);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = brands.filter(
        (brand) =>
          brand.name.toLowerCase().includes(query) ||
          (brand.description?.toLowerCase() || "").includes(query) ||
          brand.category.toLowerCase().includes(query) ||
          brand.location.toLowerCase().includes(query)
      );
      setFilteredBrands(filtered);
    }
  }, [searchQuery, brands]);

  const handleBrandClick = (brandId: string) => {
    router.push(
      `/studio/brands/${encodeURIComponent(brandId.trim().toLowerCase())}`
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loading />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Package className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-semibold">Please Sign In</h3>
          <p className="mt-2 text-gray-500">
            You need to be signed in to manage brands.
          </p>
        </div>
      </div>
    );
  }

  if (!userPermissions.includes("studio.brands.manage")) {
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

  const isBrandOwner = user.role === "brand_admin";
  const isAdmin = user.role === "admin" || user.role === "super_admin";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-canela text-gray-900">
            {isBrandOwner ? "Your Brands" : "Brands"}
          </h1>
          {isBrandOwner && (
            <p className="text-sm text-gray-600 mt-1">
              Manage your brand information and settings
            </p>
          )}
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button
            onClick={() => forceRefresh(fetchData)}
            variant="outline"
            size="sm"
            className="flex items-center gap-2 w-full sm:w-auto"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          {isAdmin && (
            <Button
              asChild
              className="bg-oma-plum hover:bg-oma-plum/90 w-full sm:w-auto"
            >
              <Link
                href="/studio/brands/create"
                className="flex items-center justify-center gap-2"
              >
                <PlusCircle className="h-4 w-4" />
                Add New Brand
              </Link>
            </Button>
          )}
        </div>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>
            {isBrandOwner ? "Your Brand Management" : "Brand Management"}
          </CardTitle>
          <CardDescription>
            {isBrandOwner
              ? "Manage your brands in the directory"
              : "Manage all brands in the directory"}
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

      {filteredBrands.length === 0 ? (
        <div className="bg-gray-50 border border-dashed border-gray-300 rounded-lg p-8 text-center">
          <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-600 mb-4">
            {searchQuery
              ? "No brands match your search criteria"
              : isBrandOwner
                ? "You don't have any brands assigned to your account yet."
                : "No brands have been added yet"}
          </p>
          {!searchQuery && isAdmin && (
            <Button asChild className="bg-oma-plum hover:bg-oma-plum/90">
              <Link href="/studio/brands/create">Create Your First Brand</Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <p className="text-sm text-gray-500">
              Showing {filteredBrands.length} brand
              {filteredBrands.length === 1 ? "" : "s"}
              {isBrandOwner && " assigned to your account"}
            </p>
          </div>
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
                        {brand.brand_images?.[0]?.storage_path && (
                          <AuthImage
                            src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/brand-assets/${brand.brand_images[0].storage_path}`}
                            alt={brand.name}
                            aspectRatio="square"
                            className="w-full h-full"
                            sizes="40px"
                            quality={60}
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
                      {brand.rating && brand.rating > 0 ? (
                        brand.rating.toFixed(1)
                      ) : (
                        <span className="text-gray-400">No ratings yet</span>
                      )}
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
                      onClick={(e) => {
                        e.stopPropagation();
                        handleBrandClick(brand.id);
                      }}
                    >
                      View
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
