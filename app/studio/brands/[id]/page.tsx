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
import {
  formatPriceRange,
  formatNumberWithCommas,
} from "@/lib/utils/priceFormatter";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { formatBrandDescription } from "@/lib/utils/textFormatter";
import { getAllCategoryNames } from "@/lib/data/unified-categories";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  getTailorsWithBrands,
  getTailorById,
} from "@/lib/services/tailorService";
import { VideoUpload } from "@/components/ui/video-upload";
import { VideoPlayer } from "@/components/ui/video-player";
import { useTailoringEvent } from "@/contexts/NavigationContext";

// Character limits
const SHORT_DESCRIPTION_LIMIT = 150;
const BRAND_NAME_LIMIT = 50;

// Common currencies used across Africa
const CURRENCIES = [
  { code: "NONE", symbol: "—", name: "No Currency (Explore brand for prices)" },
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
  const [imageUploading, setImageUploading] = useState(false);
  const [imageUploadProgress, setImageUploadProgress] = useState(0);
  const [tailor, setTailor] = useState<any | null>(null);
  const [tailorModalOpen, setTailorModalOpen] = useState(false);
  const [tailorSpecialties, setTailorSpecialties] = useState<string[]>([]);
  const [tailorPriceRange, setTailorPriceRange] = useState("");
  const [tailorConsultationFee, setTailorConsultationFee] = useState("");
  const [tailorLeadTime, setTailorLeadTime] = useState("");
  const [tailorSaving, setTailorSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [disableTailoring, setDisableTailoring] = useState(false);

  // Price range state
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [currency, setCurrency] = useState("NONE");

  // Categories for the dropdown
  const categories = getAllCategoryNames();
  const tailoringEvent = useTailoringEvent();

  const CATEGORIES = getAllCategoryNames();
  const [selectedCategory, setSelectedCategory] = useState(
    brand?.category || ""
  );
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    brand?.categories || []
  );

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
            brandData.price_range !== "Contact for pricing" &&
            brandData.price_range !== "Explore brand for prices"
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
            } else {
              // If price range is not a valid format, set to NONE
              setCurrency("NONE");
              setPriceMin("");
              setPriceMax("");
            }
          } else {
            // If no price range or it's "Explore brand for prices", set to NONE
            setCurrency("NONE");
            setPriceMin("");
            setPriceMax("");
          }
        } else {
          console.error("Brand not found in database");
          setBrand(null);
          setErrorMsg(
            "Brand not found. Please check the URL or try again later."
          );
          // notFound(); // Remove this line
        }
      } catch (error: any) {
        console.error("Error fetching brand:", error);
        toast.error("Error loading brand data");
        // Only redirect if error is 404
        if (error?.status === 404) {
          notFound();
        } else {
          setErrorMsg(
            "An error occurred while loading the brand. Please try again later."
          );
        }
      } finally {
        setLoading(false);
      }
    };

    fetchBrand();
  }, [params.id, router]);

  useEffect(() => {
    // Fetch tailor profile for this brand (if exists)
    async function fetchTailor() {
      if (!brand) return;
      const { data, error } = await supabase
        .from("tailors")
        .select("*")
        .eq("brand_id", brand.id)
        .single();
      if (data) {
        setTailor(data);
        setTailorSpecialties(data.specialties || []);
        setTailorPriceRange(data.price_range || "");
        setTailorConsultationFee(data.consultation_fee || "");
        setTailorLeadTime(data.lead_time || "");
      } else {
        setTailor(null);
        setTailorSpecialties([]);
        setTailorPriceRange("");
        setTailorConsultationFee("");
        setTailorLeadTime("");
      }
    }
    fetchTailor();
  }, [brand]);

  async function handleTailorSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setTailorSaving(true);
    if (!brand) {
      toast.error("Brand not loaded");
      setTailorSaving(false);
      return;
    }
    const specialtiesArr = tailorSpecialties; // No need to split since it's already an array
    const payload = {
      brand_id: brand.id,
      title: brand.name, // required by schema
      image: brand.image, // required by schema
      description: brand.description || brand.long_description || "",
      specialties: specialtiesArr,
      price_range: tailorPriceRange,
      consultation_fee: tailorConsultationFee
        ? Number(tailorConsultationFee)
        : null,
      lead_time: tailorLeadTime,
    };
    // Update brand's category/categories if changed
    await supabase
      .from("brands")
      .update({
        category: selectedCategory,
        categories: selectedCategories,
      })
      .eq("id", brand.id);
    let result;
    if (tailor) {
      // Update
      result = await supabase
        .from("tailors")
        .update(payload)
        .eq("id", tailor.id)
        .select()
        .single();
    } else {
      // Create
      result = await supabase.from("tailors").insert(payload).select().single();
    }
    if (result.error) {
      toast.error("Failed to save tailoring profile");
    } else {
      toast.success("Tailoring profile saved");
      setTailor(result.data);
      setTailorModalOpen(false);
      tailoringEvent.notify();
    }
    setTailorSaving(false);
  }

  async function handleDisableTailoring() {
    if (!brand || !tailor) return;

    setDisableTailoring(true);
    try {
      const { error } = await supabase
        .from("tailors")
        .delete()
        .eq("id", tailor.id);

      if (error) {
        toast.error("Failed to disable tailoring");
      } else {
        toast.success("Tailoring disabled successfully");
        setTailor(null);
        setTailorSpecialties([]);
        setTailorPriceRange("");
        setTailorConsultationFee("");
        setTailorLeadTime("");
        tailoringEvent.notify();
      }
    } catch (error) {
      console.error("Error disabling tailoring:", error);
      toast.error("Failed to disable tailoring");
    } finally {
      setDisableTailoring(false);
    }
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    // Handle character limit for brand name
    if (name === "name" && value.length > BRAND_NAME_LIMIT) {
      return; // Don't update if exceeding limit
    }

    // Handle character limit for short description
    if (name === "description" && value.length > SHORT_DESCRIPTION_LIMIT) {
      return; // Don't update if exceeding limit
    }

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
    setImageUploading(false);
    setImageUploadProgress(0);
    if (brand) {
      setBrand({
        ...brand,
        image: url,
      });
    }
  };

  const handleImageUploadStart = () => {
    setImageUploading(true);
    setImageUploadProgress(0);
  };

  const handleImageUploadProgress = (progress: number) => {
    setImageUploadProgress(progress);
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
    let priceRange;
    if (priceMin && priceMax && currency && currency !== "NONE") {
      const selectedCurrency = CURRENCIES.find((c) => c.code === currency);
      const symbol = selectedCurrency?.symbol || "$";
      priceRange = `${symbol}${priceMin} - ${symbol}${priceMax}`;
    } else {
      // If no min/max prices specified or currency is NONE, set to "Explore brand for prices"
      priceRange = "Explore brand for prices";
    }

    setSaving(true);
    try {
      // Prepare the update data
      const updateData = {
        name: brand.name,
        description: formatBrandDescription(brand.description || ""),
        long_description: formatBrandDescription(brand.long_description || ""),
        category: brand.category,
        categories: brand.categories,
        location: brand.location,
        price_range: priceRange,
        currency: currency, // Add currency field to update data
        website: brand.website,
        instagram: brand.instagram,
        whatsapp: brand.whatsapp,
        founded_year: brand.founded_year,
        is_verified: brand.is_verified,
        contact_email: brand.contact_email,
        image: imageUrl,
        video_url: brand.video_url,
        video_thumbnail: brand.video_thumbnail,
      };
      
      console.log("🔄 Submitting brand update:", updateData);
      console.log("🔄 Brand ID:", brand.id);
      
      // Use the new API endpoint that handles name propagation
      const response = await fetch(`/api/studio/brands/${brand.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      console.log("📡 Response status:", response.status);
      console.log("📡 Response headers:", Object.fromEntries(response.headers.entries()));
      
      const result = await response.json();
      console.log("📡 Response data:", result);

      if (!response.ok) {
        console.error("❌ API error response:", {
          status: response.status,
          statusText: response.statusText,
          result: result
        });
        throw new Error(result.error || `Failed to update brand (${response.status})`);
      }

      console.log("✅ Brand update successful:", result);
      
      if (result.nameChanged) {
        toast.success(
          "Brand updated successfully! Name changes have been propagated across all connections."
        );
      } else {
        toast.success("Brand updated successfully");
      }
      
      // Refresh the brand data to show updated values
      if (result.brand) {
        setBrand(result.brand);
        console.log("🔄 Updated local brand state:", result.brand);
      }
    } catch (error) {
      console.error("Error updating brand:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update brand"
      );
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

  // Calculate remaining characters for short description
  const remainingChars = brand
    ? SHORT_DESCRIPTION_LIMIT - (brand.description || "").length
    : SHORT_DESCRIPTION_LIMIT;

  // Calculate remaining characters for brand name
  const remainingNameChars = brand
    ? BRAND_NAME_LIMIT - (brand.name || "").length
    : BRAND_NAME_LIMIT;

  // When rendering the MultiSelect or category chips, filter out 'High End Fashion Brands' from the displayed categories
  const displayedCategories = (brand?.categories || []).filter(
    (cat) => cat !== "High End Fashion Brands"
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-oma-plum border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">{errorMsg}</p>
        <Button asChild className="mt-4">
          <Link href="/studio/brands">Back to Brands</Link>
        </Button>
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
                    value={brand.name}
                    onChange={handleChange}
                    placeholder="Enter brand name"
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
                    value={brand.description}
                    onChange={handleChange}
                    rows={3}
                    placeholder="A brief description of the brand (max 150 characters)"
                    className={remainingChars < 0 ? "border-red-500" : ""}
                  />
                  <p className="text-xs text-muted-foreground">
                    Keep it concise - this appears in brand listings and
                    previews
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="long_description">Full Description</Label>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div>
                      <Textarea
                        id="long_description"
                        name="long_description"
                        value={brand.long_description || ""}
                        onChange={handleChange}
                        placeholder="Detailed description of the brand, its history, values, etc."
                        className="min-h-[200px]"
                      />
                      <div className="text-xs text-muted-foreground mt-1">
                        💡 Tip: Contractions (isn't, it's, don't) will be automatically converted to formal language.
                      </div>
                    </div>
                    
                    {/* Live Preview */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">Live Preview</Label>
                      <div className="min-h-[200px] p-4 bg-gray-50 rounded-md border border-gray-200">
                        {brand.long_description ? (
                          <div className="text-sm text-gray-700 whitespace-pre-wrap">
                            {formatBrandDescription(brand.long_description)}
                          </div>
                        ) : (
                          <div className="text-sm text-gray-400 italic">
                            Start typing to see the formatted preview...
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        This shows how your description will appear on the frontend
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="categories">Categories</Label>
                    <MultiSelect
                      options={categories}
                      value={displayedCategories}
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
                    {priceMin && priceMax && currency && currency !== "NONE" ? (
                      <>
                        Preview:{" "}
                        {formatPriceRange(
                          priceMin,
                          priceMax,
                          CURRENCIES.find((c) => c.code === currency)?.symbol ||
                            "$"
                        )}
                      </>
                    ) : (
                      <>Current: {(() => {
                        // Check if price range is essentially empty (like "$75 - $75" or similar)
                        if (!brand.price_range) return "Explore brand for prices";
                        
                        // Check for patterns like "$X - $X" where min = max (likely placeholder)
                        const priceMatch = brand.price_range.match(/^(.+?)(\d+(?:,\d+)*)\s*-\s*(.+?)(\d+(?:,\d+)*)$/);
                        if (priceMatch) {
                          const [, symbol1, min, symbol2, max] = priceMatch;
                          const minNum = parseFloat(min.replace(/,/g, ""));
                          const maxNum = parseFloat(max.replace(/,/g, ""));
                          
                          // If min and max are the same (like $75 - $75), treat as unspecified
                          if (minNum === maxNum && minNum <= 100) {
                            return "Explore brand for prices";
                          }
                        }
                        
                        return brand.price_range;
                      })()}</>
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
                    <Label htmlFor="whatsapp">WhatsApp</Label>
                    <Input
                      id="whatsapp"
                      name="whatsapp"
                      value={brand.whatsapp || ""}
                      onChange={handleChange}
                      placeholder="+234XXXXXXXXXX"
                      type="tel"
                    />
                    <p className="text-xs text-muted-foreground">
                      Include country code (e.g., +234 for Nigeria)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contact_email">Contact Email</Label>
                    <Input
                      id="contact_email"
                      name="contact_email"
                      type="email"
                      value={brand.contact_email || ""}
                      onChange={handleChange}
                      placeholder="hello@brand.com"
                    />
                    <p className="text-xs text-muted-foreground">
                      This email receives customer inquiry notifications. If
                      empty, inquiries go to info@oma-hub.com
                    </p>
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
                onUploadStart={handleImageUploadStart}
                onUploadProgress={handleImageUploadProgress}
                defaultValue={brand.image}
                bucket="brand-assets"
                path="brands"
                // Note: This component needs to be updated to support the new naming convention
                // For now, it will use legacy naming
              />
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Brand Video (optional)</CardTitle>
              <CardDescription>
                Upload a video to showcase your brand (MP4, WebM, QuickTime, max
                50MB)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <VideoUpload
                onUploadComplete={(url) => {
                  if (brand) setBrand({ ...brand, video_url: url });
                }}
                defaultValue={brand.video_url}
                bucket="product-videos"
                path="brands"
                accept="video/mp4,video/webm,video/quicktime"
                maxSize={50}
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
                  {brand.video_url ? (
                    <VideoPlayer
                      videoUrl={brand.video_url}
                      thumbnailUrl={brand.video_thumbnail}
                      fallbackImageUrl={imageUrl}
                      alt={brand.name}
                      aspectRatio="16/9"
                      className="w-full h-full"
                      sizes="800px"
                      quality={85}
                      autoPlay={true}
                      muted={true}
                      loop={true}
                      controls={false}
                      showPlayButton={false}
                    />
                  ) : imageUrl ? (
                    <AuthImage
                      src={imageUrl}
                      alt={brand.name}
                      aspectRatio="16/9"
                      className="w-full h-full"
                      sizes="800px"
                      quality={85}
                      isUploading={imageUploading}
                      uploadProgress={imageUploadProgress}
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
                          ? formatPriceRange(
                              priceMin,
                              priceMax,
                              CURRENCIES.find((c) => c.code === currency)
                                ?.symbol || "$"
                            )
                          : brand.price_range}
                      </span>
                    </div>
                  ) : null}
                  <p className="text-sm text-gray-600 line-clamp-3 mb-4">
                    {brand.description}
                  </p>
                  <div className="flex items-center">
                    <Star className="h-4 w-4 text-yellow-400 mr-1" />
                    {brand.rating && brand.rating > 0 ? (
                      brand.rating.toFixed(1)
                    ) : (
                      <span className="text-gray-400">No ratings yet</span>
                    )}
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

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Tailoring</CardTitle>
              <CardDescription>
                Enable or edit tailoring options for this brand
              </CardDescription>
            </CardHeader>
            <CardContent>
              {tailor ? (
                <div className="space-y-4">
                  <div className="p-4 bg-oma-beige border border-oma-plum rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-oma-plum mr-2" />
                        <span className="text-oma-plum font-medium">
                          Tailoring Enabled
                        </span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setTailorModalOpen(true)}
                        className="text-oma-plum border-oma-plum hover:bg-oma-beige"
                      >
                        Edit
                      </Button>
                    </div>
                    <div className="mt-2 text-sm text-oma-plum">
                      <p>
                        Specialties:{" "}
                        {tailorSpecialties.length > 0
                          ? tailorSpecialties.join(", ")
                          : "None specified"}
                      </p>
                      <p>Price Range: {tailorPriceRange || "Not specified"}</p>
                    </div>
                  </div>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full text-oma-plum border-oma-plum hover:bg-oma-beige"
                        disabled={disableTailoring}
                      >
                        {disableTailoring
                          ? "Disabling..."
                          : "Disable Tailoring"}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Disable Tailoring</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to disable tailoring for this
                          brand? This will remove all tailoring services and the
                          brand will no longer appear in the tailor directory or
                          service creation forms.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDisableTailoring}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Disable Tailoring
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-gray-500 text-sm">
                    No tailoring options configured for this brand.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => setTailorModalOpen(true)}
                    className="w-full text-oma-plum border-oma-plum hover:bg-oma-beige"
                  >
                    Enable Tailoring
                  </Button>
                </div>
              )}

              {/* Tailoring Modal - Always Available */}
              <Dialog open={tailorModalOpen} onOpenChange={setTailorModalOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {tailor
                        ? "Edit Tailoring Options"
                        : "Enable Tailoring for this Brand"}
                    </DialogTitle>
                    <DialogDescription>
                      {tailor
                        ? "Update tailoring options for this brand. These details will be shown on the brand profile and in the tailor directory."
                        : "Add tailoring options for this brand. These details will be shown on the brand profile and in the tailor directory."}
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleTailorSave} className="space-y-4">
                    <div>
                      <Label>Specialties</Label>
                      <MultiSelect
                        options={[
                          "Bridal",
                          "Custom Design",
                          "Alterations",
                          "Evening Gowns",
                        ]}
                        value={tailorSpecialties}
                        onValueChange={setTailorSpecialties}
                        placeholder="Select specialties"
                      />
                    </div>
                    <div>
                      <Label>Price Range</Label>
                      <Input
                        value={tailorPriceRange}
                        onChange={(e) => setTailorPriceRange(e.target.value)}
                        placeholder="e.g. $500 - $2,000"
                      />
                    </div>
                    <div>
                      <Label>Consultation Fee</Label>
                      <Input
                        type="number"
                        value={tailorConsultationFee}
                        onChange={(e) =>
                          setTailorConsultationFee(e.target.value)
                        }
                        placeholder="e.g. 100"
                      />
                    </div>
                    <div>
                      <Label>Lead Time</Label>
                      <Input
                        value={tailorLeadTime}
                        onChange={(e) => setTailorLeadTime(e.target.value)}
                        placeholder="e.g. 2-3 weeks"
                      />
                    </div>
                    <div>
                      <Label>Category</Label>
                      <Select
                        value={selectedCategory}
                        onValueChange={setSelectedCategory}
                        required
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map((cat) => (
                            <SelectItem key={cat} value={cat}>
                              {cat}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Categories (optional, multi-select)</Label>
                      <MultiSelect
                        options={CATEGORIES}
                        value={selectedCategories}
                        onValueChange={setSelectedCategories}
                        placeholder="Select categories"
                      />
                    </div>
                    <DialogFooter>
                      <Button
                        type="submit"
                        disabled={tailorSaving}
                        className="bg-oma-black hover:bg-oma-black/90 text-white"
                      >
                        {tailorSaving
                          ? "Saving..."
                          : tailor
                            ? "Update Tailoring Profile"
                            : "Save Tailoring Profile"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
