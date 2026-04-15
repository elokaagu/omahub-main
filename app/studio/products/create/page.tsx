"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { NavigationLink } from "@/components/ui/navigation-link";
import { FileUpload } from "@/components/ui/file-upload";
import { VideoUpload } from "@/components/ui/video-upload";
import { SimpleFileUpload } from "@/components/ui/simple-file-upload";
import { createProduct } from "@/lib/services/productService";
import { getAllCollections } from "@/lib/services/collectionService";
import { getAllBrands } from "@/lib/services/brandService";
import { Brand, Catalogue } from "@/lib/supabase";
import { ArrowLeft, Trash2, Coins, Package, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { getBrandCurrency } from "@/lib/utils/currencyUtils";
import { getAllCategoryNames } from "@/lib/data/unified-categories";
import { MultiSelect } from "@/components/ui/multi-select";
import { useBrandOwnerAccess } from "@/lib/hooks/useBrandOwnerAccess";
import { StringTagListField } from "@/app/studio/products/components/StringTagListField";

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

// Brand categories - now using unified standardized categories
const CATEGORIES = getAllCategoryNames();

export default function CreateProductPage() {
  const { user, loading: authLoading } = useAuth();
  const {
    loading: accessLoading,
    userPermissions,
    ownedBrandIds,
    isBrandOwner,
    filterBrandsByOwnership,
  } = useBrandOwnerAccess();
  const router = useRouter();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [catalogues, setCatalogues] = useState<Catalogue[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedBrandCurrency, setSelectedBrandCurrency] = useState("USD");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    sale_price: "",
    image: "",
    images: [] as string[], // Array for multiple images
    video_url: "",
    video_thumbnail: "",
    video_type: "" as
      | "product_demo"
      | "styling_guide"
      | "behind_scenes"
      | "campaign"
      | "",
    video_description: "",
    brand_id: "",
    catalogue_id: "",
    categories: [] as string[],
    in_stock: true,
    sizes: [] as string[],
    colors: [] as string[],
    materials: [] as string[],
    care_instructions: "",
    is_custom: false,
    lead_time: "",
    currency: "USD", // Add currency field
    // Tailor-specific fields
    consultation_fee: "",
    specialties: [] as string[],
    fitting_sessions: "",
    measurement_guide: "",
    price_range: "",
    contact_for_pricing: false,
    service_type: "" as "product" | "service" | "consultation",
  });

  const filteredCatalogues = useMemo(() => {
    if (!formData.brand_id) return [];
    return catalogues.filter((c) => c.brand_id === formData.brand_id);
  }, [formData.brand_id, catalogues]);

  // Fetch brands and catalogues (brand list uses shared ownership rules from profile)
  useEffect(() => {
    if (!user?.id) return;

    let cancelled = false;

    const run = async () => {
      setLoading(true);
      try {
        const [brandsData, cataloguesData] = await Promise.all([
          getAllBrands().catch(() => [] as Brand[]),
          getAllCollections().catch(() => [] as Catalogue[]),
        ]);
        if (cancelled) return;
        setBrands(filterBrandsByOwnership(brandsData));
        setCatalogues(cataloguesData);
      } catch {
        if (!cancelled) {
          setBrands([]);
          setCatalogues([]);
          toast.error("Failed to load data. Please refresh the page.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [user?.id, filterBrandsByOwnership]);

  // Keep helper text in sync when brand list loads or selection changes
  useEffect(() => {
    if (!formData.brand_id) {
      setSelectedBrandCurrency("");
      return;
    }
    const selectedBrand = brands.find((b) => b.id === formData.brand_id);
    if (!selectedBrand) return;
    const brandCurrency = getBrandCurrency(selectedBrand);
    setSelectedBrandCurrency(brandCurrency?.code ?? "");
  }, [formData.brand_id, brands]);

  const hasProductPermission =
    userPermissions.includes("studio.products.manage") ||
    user?.role === "super_admin" ||
    user?.role === "brand_admin" ||
    user?.role === "admin";

  const isAuthOrAccessResolving = authLoading || accessLoading;

  // Auth + studio access profile (useBrandOwnerAccess) — do not conflate with !user
  if (isAuthOrAccessResolving) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-oma-beige/30 to-white">
        <div className="max-w-4xl mx-auto px-6 py-24">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-oma-plum mx-auto mb-4"></div>
              <p className="text-gray-600">Loading product creation form...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error if user is not authenticated or doesn't have proper permissions
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-oma-beige/30 to-white">
        <div className="max-w-4xl mx-auto px-6 py-24">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">
              Authentication Required
            </h1>
            <p className="text-gray-600 mb-4">
              You must be logged in to create products.
            </p>
            <Button asChild>
              <NavigationLink href="/login">Go to Login</NavigationLink>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (user && !hasProductPermission) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-oma-beige/30 to-white">
        <div className="max-w-4xl mx-auto px-6 py-24">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">
              Insufficient Permissions
            </h1>
            <p className="text-gray-600 mb-4">
              You don't have permission to create products.
            </p>
            <Button asChild>
              <NavigationLink href="/studio">Go to Studio</NavigationLink>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Brand admins need at least one assigned brand (after access hook has finished)
  if (
    user &&
    hasProductPermission &&
    isBrandOwner &&
    (!ownedBrandIds || ownedBrandIds.length === 0)
  ) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-oma-beige/30 to-white">
        <div className="max-w-4xl mx-auto px-6 py-24">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-oma-plum mb-4">
              Brand Assignment Needed
            </h1>
            <p className="text-gray-600 mb-4">
              Your account is set up as a brand admin, but no brands are assigned
              yet. Please contact the OmaHub team to assign your brand before
              creating products.
            </p>
            <Button asChild>
              <NavigationLink href="/studio">Go to Studio</NavigationLink>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Function to get currency symbol from currency code
  const getCurrencySymbol = (currencyCode: string): string => {
    const currency = CURRENCIES.find((c) => c.code === currencyCode);
    return currency ? currency.symbol : "$";
  };

  // Tailor-specific categories
  const tailoredCategories = [
    "Bridal",
    "Custom Design",
    "Evening Gowns",
    "Alterations",
    "Tailored",
    "Event Wear",
    "Wedding Guest",
    "Birthday",
  ];

  // Check if selected brand is a tailor brand
  const isTailorBrand = (): boolean => {
    const selectedBrand = brands.find(
      (brand) => brand.id === formData.brand_id
    );
    return selectedBrand
      ? tailoredCategories.includes(selectedBrand.category)
      : false;
  };

  // Common tailor specialties
  const tailorSpecialties = [
    "Bridal Wear",
    "Wedding Dresses",
    "Evening Gowns",
    "Cocktail Dresses",
    "Formal Wear",
    "Business Attire",
    "Casual Wear",
    "Alterations",
    "Custom Design",
    "Bespoke Tailoring",
    "Made-to-Measure",
    "Fitting Services",
    "Pattern Making",
    "Embroidery",
    "Beadwork",
  ];

  const handleInputChange = (name: string, value: string | boolean) => {
    if (
      (name === "price" || name === "sale_price") &&
      typeof value === "string"
    ) {
      const numericValue = value.replace(/[^\d.]/g, "");
      if (numericValue === "" || !isNaN(parseFloat(numericValue))) {
        setFormData((prev) => ({ ...prev, [name]: numericValue }));
      }
      return;
    }

    if (name === "brand_id" && typeof value === "string") {
      const selectedBrand = brands.find((brand) => brand.id === value);
      const brandCur = selectedBrand ? getBrandCurrency(selectedBrand) : null;
      const nextCurrency = brandCur?.code ?? "USD";
      setSelectedBrandCurrency(brandCur?.code ?? "");
      setFormData((prev) => ({
        ...prev,
        brand_id: value,
        catalogue_id: "",
        currency: nextCurrency,
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageUpload = (url: string, index?: number) => {
    if (index !== undefined) {
      // Handle multiple images
      setFormData((prev) => {
        const newImages = [...prev.images];
        newImages[index] = url;
        return {
          ...prev,
          images: newImages,
          // Set the first image as the main image for backward compatibility
          image: index === 0 ? url : prev.image || url,
        };
      });
    } else {
      // Handle single image (backward compatibility)
      setFormData((prev) => ({
        ...prev,
        image: url,
        images: prev.images.length === 0 ? [url] : prev.images,
      }));
    }
  };

  const handleCategoriesChange = (categories: string[]) => {
    setFormData((prev) => ({
      ...prev,
      categories,
    }));
  };

  const removeImage = (index: number) => {
    setFormData((prev) => {
      const newImages = prev.images.filter((_, i) => i !== index);
      return {
        ...prev,
        images: newImages,
        // Update main image if we removed the first one
        image: index === 0 && newImages.length > 0 ? newImages[0] : prev.image,
      };
    });
  };

  const handleArrayChange = (
    field: "sizes" | "colors" | "materials",
    value: string
  ) => {
    if (!value.trim()) return;

    setFormData((prev) => ({
      ...prev,
      [field]: [...prev[field], value.trim()],
    }));
  };

  const removeArrayItem = (
    field: "sizes" | "colors" | "materials",
    index: number
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }));
  };

  const handleVideoUpload = (url: string) => {
    setFormData((prev) => ({
      ...prev,
      video_url: url,
    }));
  };

  const handleVideoThumbnailUpload = (url: string) => {
    setFormData((prev) => ({
      ...prev,
      video_thumbnail: url,
    }));
  };

  // Handle tailor specialties
  const handleSpecialtyChange = (value: string) => {
    if (!value.trim()) return;

    setFormData((prev) => ({
      ...prev,
      specialties: [...prev.specialties, value.trim()],
    }));
  };

  // Handle service type change
  const handleServiceTypeChange = (
    serviceType: "product" | "service" | "consultation"
  ) => {
    setFormData((prev) => ({
      ...prev,
      service_type: serviceType,
      // Reset pricing fields when changing service type
      contact_for_pricing: serviceType === "consultation",
      price: serviceType === "consultation" ? "" : prev.price,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (submitting) return;

    // Validate session before proceeding
    try {
      const sessionCheck = await fetch("/api/auth/validate");
      if (!sessionCheck.ok) {
        toast.error(
          "Your session has expired. Please refresh the page and sign in again."
        );
        setTimeout(() => {
          router.refresh();
        }, 1500);
        return;
      }
    } catch (sessionError) {
      console.error("Session validation failed:", sessionError);
      toast.error(
        "Unable to verify your session. Please refresh the page and try again."
      );
      return;
    }

    // Validate required fields
    if (!formData.title?.trim()) {
      toast.error("Please enter a product title");
      return;
    }

    if (!formData.description?.trim()) {
      toast.error("Please enter a product description");
      return;
    }

    if (!formData.brand_id) {
      toast.error("Please select a brand");
      return;
    }

    const selectedBrand = brands.find((b) => b.id === formData.brand_id);
    if (selectedBrand) {
      const brandCurrency = getBrandCurrency(selectedBrand);
      if (brandCurrency && formData.currency !== brandCurrency.code) {
        toast.error(
          `Currency must match this brand (${brandCurrency.symbol}${brandCurrency.code}). ` +
            "Change the currency selector or pick a different brand."
        );
        return;
      }
    }

    // Validate pricing based on service type
    if (!formData.contact_for_pricing && !formData.price?.trim()) {
      toast.error("Please enter a price or enable 'Contact for Pricing'");
      return;
    }

    if (!formData.categories.length) {
      toast.error("Please select at least one category");
      return;
    }

    // Check if at least one image is uploaded
    const hasImages = formData.image || formData.images.some((img) => img);
    if (!hasImages) {
      toast.error("Please upload at least one product image");
      return;
    }

    try {
      setSubmitting(true);

      // Prepare product data with only the fields that exist in the database
      const productData = {
        title: formData.title,
        description: formData.description,
        price: formData.contact_for_pricing ? 0 : parseFloat(formData.price),
        sale_price: formData.sale_price
          ? parseFloat(formData.sale_price)
          : undefined,
        image:
          formData.image ||
          formData.images[0] ||
          "https://via.placeholder.com/400x400?text=Product+Image",
        images:
          formData.images.length > 0
            ? formData.images.filter((img) => img) // Filter out empty strings
            : [
                formData.image ||
                  "https://via.placeholder.com/400x400?text=Product+Image",
              ],
        brand_id: formData.brand_id,
        catalogue_id: formData.catalogue_id || undefined,
        category: formData.categories[0], // Use first category as primary for backward compatibility
        categories: formData.categories, // Save the full categories array
        in_stock: formData.in_stock,
        sizes: formData.sizes.length > 0 ? formData.sizes : [],
        colors: formData.colors.length > 0 ? formData.colors : [],
        currency: formData.currency, // Add currency field
        // Only include these fields if they exist in the database schema
        ...(formData.materials.length > 0 && { materials: formData.materials }),
        ...(formData.care_instructions && {
          care_instructions: formData.care_instructions,
        }),
        ...(formData.is_custom !== undefined && {
          is_custom: formData.is_custom,
        }),
        ...(formData.lead_time && { lead_time: formData.lead_time }),
        // Video fields
        ...(formData.video_url && { video_url: formData.video_url }),
        ...(formData.video_thumbnail && {
          video_thumbnail: formData.video_thumbnail,
        }),
        ...(formData.video_type && { video_type: formData.video_type }),
        ...(formData.video_description && {
          video_description: formData.video_description,
        }),
        // Tailor-specific fields
        ...(isTailorBrand() && {
          consultation_fee: formData.consultation_fee
            ? parseFloat(formData.consultation_fee)
            : undefined,
          specialties:
            formData.specialties.length > 0 ? formData.specialties : [],
          fitting_sessions: formData.fitting_sessions || undefined,
          measurement_guide: formData.measurement_guide || undefined,
          price_range: formData.price_range || undefined,
          contact_for_pricing: formData.contact_for_pricing,
          service_type: formData.service_type || "product",
        }),
      };

      const newProduct = await createProduct(productData);

      if (newProduct) {
        toast.success("Product created successfully!");
        router.push("/studio/products");
      } else {
        throw new Error("Product creation returned null");
      }
    } catch (error) {
      console.error("❌ Error creating product:", error);

      // Provide more specific error messages
      if (
        error instanceof Error &&
        (error.message?.includes("schema cache") ||
          error.message?.includes("column"))
      ) {
        toast.error(
          "Database schema error. Some fields may not be supported yet. Please try again with fewer fields."
        );
      } else if (
        error instanceof Error &&
        (error.message?.includes("Authentication") ||
          error.message?.includes("session") ||
          error.message?.includes("401") ||
          error.message?.includes("403"))
      ) {
        toast.error(
          "Your session has expired. Please refresh the page and sign in again."
        );
        setTimeout(() => {
          router.refresh();
        }, 1500);
      } else if (error instanceof Error && error.message?.includes("currency")) {
        toast.error(`Currency error: ${error.message}`);
      } else if (error instanceof Error) {
        toast.error(`Failed to create product: ${error.message}`);
      } else {
        toast.error("Failed to create product. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Show loading state while data is being fetched
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-oma-beige/30 to-white">
        <div className="max-w-4xl mx-auto px-6 py-24">
          <div className="flex items-center gap-4 mb-12">
            <Button variant="outline" size="icon" asChild>
              <NavigationLink href="/studio/products">
                <ArrowLeft className="h-4 w-4" />
              </NavigationLink>
            </Button>
            <div>
              <h1 className="text-4xl font-canela text-black mb-2">
                Create Product
              </h1>
              <p className="text-black/80">Add a new product to the platform</p>
            </div>
          </div>
          
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-oma-plum mx-auto mb-4"></div>
              <p className="text-gray-600">Loading brands and catalogues...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-oma-beige/30 to-white">
      <div className="max-w-4xl mx-auto px-6 py-24">
        {/* Header */}
        <div className="flex items-center gap-4 mb-12">
          <Button variant="outline" size="icon" asChild>
            <NavigationLink href="/studio/products">
              <ArrowLeft className="h-4 w-4" />
            </NavigationLink>
          </Button>
          <div>
            <h1 className="text-4xl font-canela text-black mb-2">
              Create Product
            </h1>
            <p className="text-black/80">Add a new product to the platform</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <Card className="border border-oma-gold/10 bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-black">
                <Package className="h-5 w-5" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-black">
                    Product Title *
                  </Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    placeholder="Enter product title"
                    className="border-oma-cocoa/20 focus:border-oma-plum"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="categories" className="text-black">
                    Categories *
                  </Label>
                  <MultiSelect
                    options={CATEGORIES}
                    value={formData.categories}
                    onValueChange={handleCategoriesChange}
                    placeholder="Select categories"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-black">
                  Description *
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    handleInputChange("description", e.target.value)
                  }
                  placeholder="Describe the product..."
                  rows={4}
                  className="border-oma-cocoa/20 focus:border-oma-plum"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="text-black">
                  Product Images (Up to 4 images)
                </Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[0, 1, 2, 3].map((index) => (
                    <div key={index} className="space-y-2">
                      <Label className="text-sm text-gray-600">
                        Image {index + 1} {index === 0 && "(Main)"}
                      </Label>
                      <div className="relative">
                        <FileUpload
                          key={`image-${index}-${formData.images[index] || "empty"}`}
                          onUploadComplete={(url) =>
                            handleImageUpload(url, index)
                          }
                          defaultValue={formData.images[index] || ""}
                          bucket="product-images"
                          path="products"
                          accept={{
                            "image/png": [".png"],
                            "image/jpeg": [".jpg", ".jpeg"],
                            "image/webp": [".webp"],
                          }}
                          maxSize={5}
                        />
                        {formData.images[index] && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="mt-2 text-red-600 border-red-200 hover:bg-red-50"
                            onClick={() => removeImage(index)}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Remove
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-black/70 mt-2">
                  Upload up to 4 high-quality product images. The first image
                  will be used as the main product image.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Product Video */}
          <Card className="border border-oma-gold/10 bg-white">
            <CardHeader>
              <CardTitle className="text-black">
                Product Video (Optional)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="video_url" className="text-black">
                    Product Video
                  </Label>
                  <VideoUpload
                    onUploadComplete={handleVideoUpload}
                    defaultValue={formData.video_url}
                    bucket="product-videos"
                    path="demos"
                    accept="video/mp4,video/webm,video/quicktime"
                    maxSize={50}
                  />
                  <p className="text-xs text-muted-foreground">
                    Upload product demonstration or styling video (max 50MB)
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="video_thumbnail" className="text-black">
                    Video Thumbnail (Optional)
                  </Label>
                  <SimpleFileUpload
                    onUploadComplete={handleVideoThumbnailUpload}
                    defaultValue={formData.video_thumbnail}
                    bucket="product-images"
                    path="thumbnails"
                    accept="image/png,image/jpeg,image/webp"
                    maxSize={5}
                  />
                  <p className="text-xs text-muted-foreground">
                    Custom thumbnail for video preview (falls back to main
                    product image)
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="video_type" className="text-black">
                    Video Type
                  </Label>
                  <Select
                    value={formData.video_type}
                    onValueChange={(value) =>
                      handleInputChange("video_type", value)
                    }
                  >
                    <SelectTrigger className="border-oma-cocoa/20 focus:border-oma-plum">
                      <SelectValue placeholder="Select video type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Select video type</SelectItem>
                      <SelectItem value="product_demo">Product Demo</SelectItem>
                      <SelectItem value="styling_guide">
                        Styling Guide
                      </SelectItem>
                      <SelectItem value="behind_scenes">
                        Behind the Scenes
                      </SelectItem>
                      <SelectItem value="campaign">Campaign</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="video_description" className="text-black">
                    Video Description
                  </Label>
                  <Input
                    id="video_description"
                    value={formData.video_description}
                    onChange={(e) =>
                      handleInputChange("video_description", e.target.value)
                    }
                    placeholder="Brief description of the video content"
                    className="border-oma-cocoa/20 focus:border-oma-plum"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Brand and Collection */}
          <Card className="border border-oma-gold/10 bg-white">
            <CardHeader>
              <CardTitle className="text-black">Brand & Collection</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="brand" className="text-black">
                    Brand *
                  </Label>
                  <Select
                    value={formData.brand_id}
                    onValueChange={(value) =>
                      handleInputChange("brand_id", value)
                    }
                  >
                    <SelectTrigger className="border-oma-cocoa/20 focus:border-oma-plum">
                      <SelectValue placeholder="Select a brand" />
                    </SelectTrigger>
                    <SelectContent>
                      {brands.map((brand) => (
                        <SelectItem key={brand.id} value={brand.id}>
                          <div className="flex items-center gap-2">
                            <span>{brand.name}</span>
                            {brand.is_verified && (
                              <Badge
                                variant="secondary"
                                className="text-xs bg-oma-plum text-white"
                              >
                                Verified
                              </Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currency" className="text-black">
                    Currency *
                  </Label>
                  <Select
                    value={formData.currency}
                    onValueChange={(value) =>
                      handleInputChange("currency", value)
                    }
                  >
                    <SelectTrigger className="border-oma-cocoa/20 focus:border-oma-plum">
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">No currency specified</span>
                          <span className="text-xs text-gray-400">(Contact designer for pricing)</span>
                        </div>
                      </SelectItem>
                      {CURRENCIES.map((currency) => (
                        <SelectItem key={currency.code} value={currency.code}>
                          <div className="flex items-center gap-2">
                            <span>{currency.symbol}</span>
                            <span>{currency.code}</span>
                            <span className="text-gray-500">({currency.name})</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formData.brand_id && (
                    <div className="space-y-1">
                      {selectedBrandCurrency ? (
                        <p className="text-xs text-muted-foreground">
                          Brand default is {selectedBrandCurrency}. The product currency must match
                          the brand when you save (same rule as on the edit screen).
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          No currency specified for this brand
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="catalogue" className="text-black">
                    Collection (Optional)
                  </Label>
                  <Select
                    value={formData.catalogue_id}
                    onValueChange={(value) =>
                      handleInputChange("catalogue_id", value)
                    }
                  >
                    <SelectTrigger className="border-gray-300 focus:border-gray-500">
                      <SelectValue placeholder="Select a collection (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No Collection</SelectItem>
                      {filteredCatalogues.map((catalogue) => (
                        <SelectItem key={catalogue.id} value={catalogue.id}>
                          {catalogue.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Service Type - Only for Tailor Brands */}
          {isTailorBrand() && (
            <Card className="border border-oma-gold/10 bg-white">
              <CardHeader>
                <CardTitle className="text-black">Service Type</CardTitle>
                <p className="text-sm text-black/70">
                  Choose what type of offering this is
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      formData.service_type === "product"
                        ? "border-oma-plum bg-oma-plum/10"
                        : "border-gray-200 hover:border-oma-plum/50"
                    }`}
                    onClick={() => handleServiceTypeChange("product")}
                  >
                    <div className="flex flex-col items-center text-center">
                      <Package className="h-8 w-8 mb-2 text-oma-plum" />
                      <h3 className="font-medium text-black">Product</h3>
                      <p className="text-xs text-black/70">
                        Ready-made items with fixed pricing
                      </p>
                    </div>
                  </div>
                  <div
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      formData.service_type === "service"
                        ? "border-oma-plum bg-oma-plum/10"
                        : "border-gray-200 hover:border-oma-plum/50"
                    }`}
                    onClick={() => handleServiceTypeChange("service")}
                  >
                    <div className="flex flex-col items-center text-center">
                      <Coins className="h-8 w-8 mb-2 text-oma-plum" />
                      <h3 className="font-medium text-black">Service</h3>
                      <p className="text-xs text-black/70">
                        Custom tailoring with flexible pricing
                      </p>
                    </div>
                  </div>
                  <div
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      formData.service_type === "consultation"
                        ? "border-oma-plum bg-oma-plum/10"
                        : "border-gray-200 hover:border-oma-plum/50"
                    }`}
                    onClick={() => handleServiceTypeChange("consultation")}
                  >
                    <div className="flex flex-col items-center text-center">
                      <MessageCircle className="h-8 w-8 mb-2 text-oma-plum" />
                      <h3 className="font-medium text-black">Consultation</h3>
                      <p className="text-xs text-black/70">
                        Design consultation and planning
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Pricing */}
          <Card className="border border-oma-gold/10 bg-white">
            <CardHeader>
              <CardTitle className="text-black">
                {isTailorBrand() && formData.service_type === "consultation"
                  ? "Consultation Pricing"
                  : "Pricing"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Contact for Pricing Option - For Tailors */}
              {isTailorBrand() && (
                <div className="flex items-center justify-between p-4 bg-oma-beige/30 rounded-lg">
                  <div className="space-y-0.5">
                    <Label
                      htmlFor="contact_for_pricing"
                      className="text-black font-medium"
                    >
                      Contact for Pricing
                    </Label>
                    <p className="text-sm text-black/70">
                      Let customers contact you for custom pricing
                    </p>
                  </div>
                  <Checkbox
                    id="contact_for_pricing"
                    checked={formData.contact_for_pricing}
                    onCheckedChange={(checked) =>
                      handleInputChange("contact_for_pricing", checked)
                    }
                  />
                </div>
              )}

              {/* Price Range - For Tailors with Contact for Pricing */}
              {isTailorBrand() && formData.contact_for_pricing ? (
                <div className="space-y-2">
                  <Label htmlFor="price_range" className="text-black">
                    Price Range (Optional)
                  </Label>
                  <Input
                    id="price_range"
                    value={formData.price_range}
                    onChange={(e) =>
                      handleInputChange("price_range", e.target.value)
                    }
                    placeholder="e.g., $500 - $2,000"
                    className="border-oma-cocoa/20 focus:border-oma-plum"
                  />
                  <p className="text-xs text-muted-foreground">
                    Give customers an idea of your pricing range
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="price" className="text-black">
                      {isTailorBrand() &&
                      formData.service_type === "consultation"
                        ? "Consultation Fee *"
                        : "Regular Price *"}
                    </Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) =>
                        handleInputChange("price", e.target.value)
                      }
                      placeholder="0.00"
                      inputMode="decimal"
                      className="border-oma-cocoa/20 focus:border-oma-plum"
                      required={!formData.contact_for_pricing}
                    />
                    <p className="text-xs text-muted-foreground">
                      {isTailorBrand() &&
                      formData.service_type === "consultation"
                        ? "Enter your consultation fee (e.g., 100.00)"
                        : "Enter the regular selling price (e.g., 15,000.50)"}
                    </p>
                  </div>
                </>
              )}
              <div className="space-y-2">
                <Label htmlFor="sale_price" className="text-black">
                  Sale Price (Optional)
                </Label>
                <Input
                  id="sale_price"
                  type="number"
                  step="0.01"
                  value={formData.sale_price}
                  onChange={(e) =>
                    handleInputChange("sale_price", e.target.value)
                  }
                  placeholder="0.00"
                  inputMode="decimal"
                  className="border-oma-cocoa/20 focus:border-oma-plum"
                />
                <p className="text-xs text-muted-foreground">
                  Optional discounted price (must be less than regular price,
                  decimals allowed)
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Product Details */}
          <Card className="border border-oma-gold/10 bg-white">
            <CardHeader>
              <CardTitle className="text-black">Product Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <StringTagListField
                label="Available Sizes"
                placeholder="Add size (e.g., S, M, L, XL)"
                items={formData.sizes}
                onAdd={(v) => handleArrayChange("sizes", v)}
                onRemove={(index) => removeArrayItem("sizes", index)}
              />

              <StringTagListField
                label="Available Colours"
                placeholder="Add colour (e.g., Red, Blue, Black)"
                items={formData.colors}
                onAdd={(v) => handleArrayChange("colors", v)}
                onRemove={(index) => removeArrayItem("colors", index)}
              />

              <StringTagListField
                label="Materials"
                placeholder="Add material (e.g., Cotton, Silk, Polyester)"
                items={formData.materials}
                onAdd={(v) => handleArrayChange("materials", v)}
                onRemove={(index) => removeArrayItem("materials", index)}
              />

              <div className="space-y-2">
                <Label htmlFor="care_instructions" className="text-black">
                  Care Instructions
                </Label>
                <Textarea
                  id="care_instructions"
                  value={formData.care_instructions}
                  onChange={(e) =>
                    handleInputChange("care_instructions", e.target.value)
                  }
                  placeholder="e.g., Hand wash only, Dry clean recommended"
                  rows={3}
                  className="border-oma-cocoa/20 focus:border-oma-plum"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lead_time" className="text-black">
                  Lead Time (for custom items)
                </Label>
                <Input
                  id="lead_time"
                  value={formData.lead_time}
                  onChange={(e) =>
                    handleInputChange("lead_time", e.target.value)
                  }
                  placeholder="e.g., 2-3 weeks"
                  className="border-oma-cocoa/20 focus:border-oma-plum"
                />
              </div>
            </CardContent>
          </Card>

          {/* Tailor Specialties - Only for Tailor Brands */}
          {isTailorBrand() && (
            <Card className="border border-oma-gold/10 bg-white">
              <CardHeader>
                <CardTitle className="text-black">
                  Specialties & Services
                </CardTitle>
                <p className="text-sm text-black/70">
                  Add your areas of expertise and services offered
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Specialties */}
                <div className="space-y-2">
                  <Label className="text-black">Your Specialties</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
                    {tailorSpecialties.map((specialty) => (
                      <div
                        key={specialty}
                        className={`p-3 border rounded-lg cursor-pointer transition-all text-sm ${
                          formData.specialties.includes(specialty)
                            ? "border-oma-plum bg-oma-plum/10 text-oma-plum"
                            : "border-gray-200 hover:border-oma-plum/50"
                        }`}
                        onClick={() => {
                          if (formData.specialties.includes(specialty)) {
                            setFormData((prev) => ({
                              ...prev,
                              specialties: prev.specialties.filter(
                                (s) => s !== specialty
                              ),
                            }));
                          } else {
                            setFormData((prev) => ({
                              ...prev,
                              specialties: [...prev.specialties, specialty],
                            }));
                          }
                        }}
                      >
                        {specialty}
                      </div>
                    ))}
                  </div>

                  <StringTagListField
                    label="Custom specialties"
                    placeholder="Add custom specialty"
                    items={formData.specialties.filter(
                      (s) => !tailorSpecialties.includes(s)
                    )}
                    onAdd={(v) => handleSpecialtyChange(v)}
                    onRemove={(index) => {
                      const customOnly = formData.specialties.filter(
                        (s) => !tailorSpecialties.includes(s)
                      );
                      const toRemove = customOnly[index];
                      if (toRemove === undefined) return;
                      setFormData((prev) => ({
                        ...prev,
                        specialties: prev.specialties.filter((s) => s !== toRemove),
                      }));
                    }}
                  />
                </div>

                {/* Fitting Sessions */}
                <div className="space-y-2">
                  <Label htmlFor="fitting_sessions" className="text-black">
                    Fitting Sessions
                  </Label>
                  <Input
                    id="fitting_sessions"
                    value={formData.fitting_sessions}
                    onChange={(e) =>
                      handleInputChange("fitting_sessions", e.target.value)
                    }
                    placeholder="e.g., 2-3 fittings included"
                    className="border-oma-cocoa/20 focus:border-oma-plum"
                  />
                  <p className="text-xs text-muted-foreground">
                    Describe your fitting process and number of sessions
                  </p>
                </div>

                {/* Measurement Guide */}
                <div className="space-y-2">
                  <Label htmlFor="measurement_guide" className="text-black">
                    Measurement Guide
                  </Label>
                  <Textarea
                    id="measurement_guide"
                    value={formData.measurement_guide}
                    onChange={(e) =>
                      handleInputChange("measurement_guide", e.target.value)
                    }
                    placeholder="Describe your measurement process, what measurements you need, or any special requirements..."
                    rows={4}
                    className="border-oma-cocoa/20 focus:border-oma-plum"
                  />
                  <p className="text-xs text-muted-foreground">
                    Help customers understand your measurement requirements
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Settings */}
          <Card className="border border-oma-gold/10 bg-white">
            <CardHeader>
              <CardTitle className="text-black">Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-oma-beige/30 rounded-lg">
                <div className="space-y-0.5">
                  <Label htmlFor="in_stock" className="text-black font-medium">
                    In Stock
                  </Label>
                  <p className="text-sm text-black/70">
                    Whether this product is currently available
                  </p>
                </div>
                <Checkbox
                  id="in_stock"
                  checked={formData.in_stock}
                  onCheckedChange={(checked) =>
                    handleInputChange("in_stock", checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-oma-beige/30 rounded-lg">
                <div className="space-y-0.5">
                  <Label htmlFor="is_custom" className="text-black font-medium">
                    Custom/Tailored Item
                  </Label>
                  <p className="text-sm text-black/70">
                    Mark if this is a custom or made-to-order item
                  </p>
                </div>
                <Checkbox
                  id="is_custom"
                  checked={formData.is_custom}
                  onCheckedChange={(checked) =>
                    handleInputChange("is_custom", checked)
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex gap-4 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/studio/products")}
              disabled={submitting}
              className="border-oma-cocoa text-black hover:bg-oma-cocoa hover:text-white"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-oma-plum hover:bg-oma-plum/90"
              disabled={submitting}
            >
              {submitting ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Creating Product...
                </div>
              ) : (
                "Create Product"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
