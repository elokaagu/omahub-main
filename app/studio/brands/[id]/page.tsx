"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  getBrand,
  updateBrand,
  deleteBrand,
} from "@/lib/services/brandService";
import { Brand } from "@/lib/supabase";
import { toast } from "sonner";
import { FileUpload } from "@/components/ui/file-upload";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MultiSelect } from "@/components/ui/multi-select";
import {
  ArrowLeft,
  Save,
  Trash2,
  Globe,
  MapPin,
  Star,
  CheckCircle,
  X,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { AuthImage } from "@/components/ui/auth-image";

// Common currencies used across Africa
const CURRENCIES = [
  { code: "NGN", symbol: "₦", name: "Nigerian Naira" },
  { code: "KES", symbol: "KSh", name: "Kenyan Shilling" },
  { code: "GHS", symbol: "GHS", name: "Ghanaian Cedi" },
  { code: "ZAR", symbol: "R", name: "South African Rand" },
  { code: "EGP", symbol: "EGP", name: "Egyptian Pound" },
  { code: "MAD", symbol: "MAD", name: "Moroccan Dirham" },
  { code: "TND", symbol: "TND", name: "Tunisian Dinar" },
  { code: "XOF", symbol: "XOF", name: "West African CFA Franc" },
  { code: "DZD", symbol: "DA", name: "Algerian Dinar" },
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
];

export default function BrandEditPage({ params }: { params: { id: string } }) {
  // Debug params
  console.log("Edit page params:", params);

  const router = useRouter();
  const { user } = useAuth();
  const [brand, setBrand] = useState<Brand | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [imageUrl, setImageUrl] = useState("");

  // Price range state
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [currency, setCurrency] = useState("NGN");

  // Categories for the dropdown
  const categories = [
    "Bridal",
    "Jewelry",
    "Accessories",
    "Casual Wear",
    "Formal Wear",
    "Streetwear",
    "Active Wear",
    "Traditional",
    "Footwear",
    "Luxury",
  ];

  useEffect(() => {
    const fetchBrand = async () => {
      setLoading(true);
      try {
        // Log the brand ID being requested
        console.log("Fetching brand with ID:", params.id);

        const brandData = await getBrand(params.id);

        if (brandData) {
          console.log("Brand data found:", brandData.name);
          setBrand(brandData);
          setImageUrl(brandData.image || "");

          // Parse existing price range if it exists
          if (
            brandData.price_range &&
            brandData.price_range !== "Contact for pricing"
          ) {
            const priceRangeMatch = brandData.price_range.match(
              /^(.+?)(\d+(?:,\d+)*)\s*-\s*(.+?)(\d+(?:,\d+)*)$/
            );
            if (priceRangeMatch) {
              const [, symbol1, min, symbol2, max] = priceRangeMatch;
              const foundCurrency = CURRENCIES.find(
                (c) =>
                  c.symbol === symbol1.trim() || c.symbol === symbol2.trim()
              );
              if (foundCurrency) {
                setCurrency(foundCurrency.code);
                setPriceMin(min.replace(/,/g, ""));
                setPriceMax(max.replace(/,/g, ""));
              }
            }
          }
        } else {
          console.error("Brand not found in database");
          // Use Next.js notFound() function to show the custom not-found page
          notFound();
        }
      } catch (error) {
        console.error("Error fetching brand:", error);
        toast.error("Error loading brand data");
        notFound();
      } finally {
        setLoading(false);
      }
    };

    fetchBrand();
  }, [params.id, router]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    if (brand) {
      setBrand({
        ...brand,
        [name]: value,
      });
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    if (brand) {
      setBrand({
        ...brand,
        [name]: value,
      });
    }
  };

  const handleCategoriesChange = (categories: string[]) => {
    if (brand) {
      setBrand({
        ...brand,
        categories: categories,
        category: categories[0] || brand.category, // Keep primary category for backward compatibility
      });
    }
  };

  const handleImageUpload = (url: string) => {
    setImageUrl(url);
    if (brand) {
      setBrand({
        ...brand,
        image: url,
      });
    }
  };

  const handleVerifiedToggle = () => {
    if (brand) {
      setBrand({
        ...brand,
        is_verified: !brand.is_verified,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brand || !user) {
      toast.error("You must be logged in to update a brand");
      return;
    }

    // Format price range if both min and max are provided
    let priceRange = brand.price_range || "Contact for pricing";
    if (priceMin && priceMax) {
      const selectedCurrency = CURRENCIES.find((c) => c.code === currency);
      const symbol = selectedCurrency?.symbol || "$";
      priceRange = `${symbol}${priceMin} - ${symbol}${priceMax}`;
    }

    setSaving(true);
    try {
      await updateBrand(user.id, brand.id, {
        description: brand.description,
        category: brand.category,
        categories: brand.categories,
        location: brand.location,
        price_range: priceRange,
        website: brand.website,
        instagram: brand.instagram,
        founded_year: brand.founded_year,
        is_verified: brand.is_verified,
        image: imageUrl,
      });
      toast.success("Brand updated successfully");
    } catch (error) {
      console.error("Error updating brand:", error);
      toast.error("Failed to update brand");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!brand || !user) {
      toast.error("You must be logged in to delete a brand");
      return;
    }

    setDeleting(true);
    try {
      await deleteBrand(user.id, brand.id);
      toast.success("Brand deleted successfully");
      router.push("/studio/brands");
    } catch (error) {
      console.error("Error deleting brand:", error);
      toast.error("Failed to delete brand");
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-oma-plum border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!brand) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Brand not found. Please try again.</p>
        <Button asChild className="mt-4">
          <Link href="/studio/brands">Back to Brands</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center mb-8">
        <Button variant="ghost" onClick={() => router.back()} className="mr-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-3xl font-canela text-gray-900">Edit Brand</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit}>
            <Card>
              <CardHeader>
                <CardTitle>Brand Details</CardTitle>
                <CardDescription>
                  Update information about this brand
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Brand Name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={brand.name}
                    onChange={handleChange}
                    placeholder="Enter brand name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={brand.description}
                    onChange={handleChange}
                    placeholder="Enter brand description"
                    className="min-h-32"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="categories">Categories</Label>
                    <MultiSelect
                      options={categories}
                      value={
                        brand.categories || [brand.category].filter(Boolean)
                      }
                      onValueChange={handleCategoriesChange}
                      placeholder="Select categories"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      name="location"
                      value={brand.location}
                      onChange={handleChange}
                      placeholder="e.g. Lagos, Nigeria"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price_range">Price Range</Label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <Select value={currency} onValueChange={setCurrency}>
                      <SelectTrigger>
                        <SelectValue placeholder="Currency" />
                      </SelectTrigger>
                      <SelectContent>
                        {CURRENCIES.map((curr) => (
                          <SelectItem key={curr.code} value={curr.code}>
                            {curr.symbol} - {curr.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Input
                      value={priceMin}
                      onChange={(e) => setPriceMin(e.target.value)}
                      placeholder="Min price (e.g. 15000)"
                      type="number"
                    />

                    <Input
                      value={priceMax}
                      onChange={(e) => setPriceMax(e.target.value)}
                      placeholder="Max price (e.g. 120000)"
                      type="number"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {priceMin && priceMax && currency ? (
                      <>
                        Preview:{" "}
                        {CURRENCIES.find((c) => c.code === currency)?.symbol}
                        {priceMin} -{" "}
                        {CURRENCIES.find((c) => c.code === currency)?.symbol}
                        {priceMax}
                      </>
                    ) : (
                      <>Current: {brand.price_range || "Contact for pricing"}</>
                    )}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      name="website"
                      value={brand.website || ""}
                      onChange={handleChange}
                      placeholder="https://example.com"
                      type="url"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="instagram">Instagram</Label>
                    <Input
                      id="instagram"
                      name="instagram"
                      value={brand.instagram || ""}
                      onChange={handleChange}
                      placeholder="@username"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="founded_year">Founded Year</Label>
                    <Input
                      id="founded_year"
                      name="founded_year"
                      value={brand.founded_year || ""}
                      onChange={handleChange}
                      placeholder="e.g. 2020"
                      type="number"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Verification Status</Label>
                    <Button
                      type="button"
                      variant={brand.is_verified ? "default" : "outline"}
                      size="sm"
                      onClick={handleVerifiedToggle}
                      className={
                        brand.is_verified
                          ? "bg-green-600 hover:bg-green-700"
                          : ""
                      }
                    >
                      {brand.is_verified ? (
                        <>
                          <CheckCircle className="h-4 w-4 mr-1" /> Verified
                        </>
                      ) : (
                        <>
                          <X className="h-4 w-4 mr-1" /> Not Verified
                        </>
                      )}
                    </Button>
                  </div>
                  <p className="text-sm text-gray-500">
                    Verified brands appear with a checkmark and get higher
                    visibility in search results
                  </p>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="text-red-600 border-red-600 hover:bg-red-50"
                      disabled={deleting}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      {deleting ? "Deleting..." : "Delete Brand"}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Are you absolutely sure?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently
                        delete the brand and all associated data from our
                        servers.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDelete}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                <Button
                  type="submit"
                  className="bg-oma-plum hover:bg-oma-plum/90 flex items-center gap-2"
                  disabled={saving}
                >
                  <Save className="h-4 w-4" />
                  {saving ? "Saving Changes..." : "Save Changes"}
                </Button>
              </CardFooter>
            </Card>
          </form>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Brand Image</CardTitle>
              <CardDescription>
                Upload an image to represent this brand
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FileUpload
                onUploadComplete={handleImageUpload}
                defaultValue={brand.image}
                bucket="brand-assets"
                path="brands"
              />
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Brand Preview</CardTitle>
              <CardDescription>
                See how this brand appears on the platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border overflow-hidden">
                <div className="h-36 bg-gray-100 relative">
                  {imageUrl ? (
                    <AuthImage
                      src={imageUrl}
                      alt={brand.name}
                      width={800}
                      height={600}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">
                      No image
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-lg">{brand.name}</h3>
                    {brand.is_verified && (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    )}
                  </div>
                  <div className="flex items-center text-sm text-gray-500 mb-1">
                    <Globe className="h-3 w-3 mr-1" />
                    <span>{brand.category}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-500 mb-2">
                    <MapPin className="h-3 w-3 mr-1" />
                    <span>{brand.location}</span>
                  </div>
                  {(priceMin && priceMax && currency) || brand.price_range ? (
                    <div className="flex items-center text-sm text-gray-500 mb-2">
                      <span className="font-medium">Price Range:</span>
                      <span className="ml-1">
                        {priceMin && priceMax && currency
                          ? `${CURRENCIES.find((c) => c.code === currency)?.symbol}${priceMin} - ${CURRENCIES.find((c) => c.code === currency)?.symbol}${priceMax}`
                          : brand.price_range}
                      </span>
                    </div>
                  ) : null}
                  <p className="text-sm text-gray-600 line-clamp-3 mb-4">
                    {brand.description}
                  </p>
                  <div className="flex items-center">
                    <Star className="h-4 w-4 text-yellow-400 mr-1" />
                    <span>{brand.rating.toFixed(1)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button asChild variant="outline" className="w-full">
                <Link href={`/brand/${brand.id}`} target="_blank">
                  View on Site
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
