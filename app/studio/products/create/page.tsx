"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Loading } from "@/components/ui/loading";
import { NavigationLink } from "@/components/ui/navigation-link";
import { FileUpload } from "@/components/ui/file-upload";
import { VideoUpload } from "@/components/ui/video-upload";
import { SimpleFileUpload } from "@/components/ui/simple-file-upload";
import { createProduct } from "@/lib/services/productService";
import { getAllCollections } from "@/lib/services/collectionService";
import { getAllBrands } from "@/lib/services/brandService";
import { Product, Brand, Catalogue } from "@/lib/supabase";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Upload,
  Coins,
  Package,
  Image as ImageIcon,
  MessageCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import {
  formatNumberWithCommas,
  parseFormattedNumber,
} from "@/lib/utils/priceFormatter";
import { Checkbox } from "@/components/ui/checkbox";
import { getBrandCurrency } from "@/lib/utils/currencyUtils";
import {
  getCategoriesForStudio,
  getAllCategoryNames,
} from "@/lib/data/unified-categories";

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
  const { user } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [catalogues, setCatalogues] = useState<Catalogue[]>([]);
  const [filteredCatalogues, setFilteredCatalogues] = useState<Catalogue[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedBrandCurrency, setSelectedBrandCurrency] = useState("$"); // Default to USD symbol
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
    category: "",
    in_stock: true,
    sizes: [] as string[],
    colors: [] as string[],
    materials: [] as string[],
    care_instructions: "",
    is_custom: false,
    lead_time: "",
    // Tailor-specific fields
    consultation_fee: "",
    specialties: [] as string[],
    fitting_sessions: "",
    measurement_guide: "",
    price_range: "",
    contact_for_pricing: false,
    service_type: "" as "product" | "service" | "consultation",
  });

  // Check if user is super admin or brand owner
  // useEffect(() => {
  //   // Don't redirect if we're still loading or if user is null (temporary state)
  //   if (!user) return;

  //   if (user.role !== "super_admin" && user.role !== "brand_admin") {
  //     router.push("/studio");
  //     return;
  //   }
  // }, [user, router]);

  // Fetch brands and catalogues
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [brandsData, cataloguesData] = await Promise.all([
          getAllBrands(),
          getAllCollections(),
        ]);

        // Filter brands based on user role
        if (user?.role === "super_admin") {
          // Super admins see all brands
          setBrands(brandsData);
        } else if (user?.role === "brand_admin") {
          // Brand owners see only their owned brands
          if (!supabase) {
            console.error("Supabase client not available");
            setBrands([]);
            return;
          }

          const userProfile = await supabase
            .from("profiles")
            .select("owned_brands")
            .eq("id", user.id)
            .single();

          if (userProfile.data?.owned_brands) {
            const ownedBrandIds = userProfile.data.owned_brands;
            const ownedBrands = brandsData.filter((brand) =>
              ownedBrandIds.includes(brand.id)
            );
            setBrands(ownedBrands);
          } else {
            setBrands([]);
          }
        }

        setCatalogues(cataloguesData);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load brands and catalogues");
      }
    };

    if (user?.role === "super_admin" || user?.role === "brand_admin") {
      fetchData();
    }
  }, [user]);

  // Filter catalogues based on selected brand
  useEffect(() => {
    if (formData.brand_id) {
      const brandCatalogues = catalogues.filter(
        (catalogue) => catalogue.brand_id === formData.brand_id
      );
      setFilteredCatalogues(brandCatalogues);
    } else {
      setFilteredCatalogues([]);
    }
  }, [formData.brand_id, catalogues]);

  // Function to extract currency symbol from brand price range
  const extractCurrencyFromBrand = (brandId: string): string => {
    const selectedBrand = brands.find((brand) => brand.id === brandId);
    if (!selectedBrand || !selectedBrand.price_range) {
      return "$"; // Default to USD
    }

    // Parse price range to extract currency symbol (e.g., "₦15,000 - ₦120,000")
    const priceRangeMatch = selectedBrand.price_range.match(
      /^(.+?)(\d+(?:,\d+)*)\s*-\s*(.+?)(\d+(?:,\d+)*)$/
    );

    if (priceRangeMatch) {
      const [, symbol1] = priceRangeMatch;
      const foundCurrency = CURRENCIES.find((c) => c.symbol === symbol1.trim());
      if (foundCurrency) {
        return foundCurrency.symbol;
      }
    }

    return "$"; // Default fallback
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
    // Handle price formatting for price and sale_price fields
    if (
      (name === "price" || name === "sale_price") &&
      typeof value === "string"
    ) {
      // Remove any non-numeric characters except decimal point
      const numericValue = value.replace(/[^\d.]/g, "");

      // Validate that it's a valid number
      if (numericValue === "" || !isNaN(parseFloat(numericValue))) {
        setFormData({
          ...formData,
          [name]: numericValue,
        });
      }
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Reset catalogue when brand changes
    if (name === "brand_id") {
      setFormData((prev) => ({
        ...prev,
        catalogue_id: "",
      }));

      // Update currency symbol based on selected brand
      const newCurrency = extractCurrencyFromBrand(value as string);
      setSelectedBrandCurrency(newCurrency);
    }
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

  const removeSpecialty = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      specialties: prev.specialties.filter((_, i) => i !== index),
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

    if (!formData.title || !formData.description || !formData.brand_id) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Validate pricing based on service type
    if (!formData.contact_for_pricing && !formData.price) {
      toast.error("Please enter a price or enable 'Contact for Pricing'");
      return;
    }

    if (!formData.category) {
      toast.error("Please select a category");
      return;
    }

    // Check if at least one image is uploaded
    const hasImages = formData.image || formData.images.some((img) => img);
    if (!hasImages) {
      toast.error("Please upload at least one product image");
      return;
    }

    try {
      setIsLoading(true);

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
        category: formData.category,
        in_stock: formData.in_stock,
        sizes: formData.sizes.length > 0 ? formData.sizes : [],
        colors: formData.colors.length > 0 ? formData.colors : [],
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

      console.log("Creating product with data:", productData);

      const newProduct = await createProduct(productData);

      if (newProduct) {
        toast.success("Product created successfully");
        router.push("/studio/products");
      } else {
        throw new Error("Product creation returned null");
      }
    } catch (error) {
      console.error("Error creating product:", error);

      // Provide more specific error messages
      if (
        error instanceof Error &&
        (error.message?.includes("schema cache") ||
          error.message?.includes("column"))
      ) {
        toast.error(
          "Database schema error. Some fields may not be supported yet."
        );
      } else if (error instanceof Error) {
        toast.error(`Failed to create product: ${error.message}`);
      } else {
        toast.error("Failed to create product. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Format price for display - use centralized utility
  const formatPriceForDisplay = (price: string): string => {
    const numericPrice = parseFloat(price.replace(/,/g, ""));
    if (isNaN(numericPrice)) return price;
    return formatNumberWithCommas(numericPrice);
  };

  // Don't render the form if user doesn't have proper permissions or is still loading
  if (!user || (user.role !== "super_admin" && user.role !== "brand_admin")) {
    return <Loading />;
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
                  <Label htmlFor="category" className="text-black">
                    Category *
                  </Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) =>
                      handleInputChange("category", value)
                    }
                  >
                    <SelectTrigger className="border-oma-cocoa/20 focus:border-oma-plum">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              {/* Sizes */}
              <div className="space-y-2">
                <Label className="text-black">Available Sizes</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    placeholder="Add size (e.g., S, M, L, XL)"
                    className="border-oma-cocoa/20 focus:border-oma-plum"
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleArrayChange("sizes", e.currentTarget.value);
                        e.currentTarget.value = "";
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="border-oma-plum text-oma-plum hover:bg-oma-plum hover:text-white"
                    onClick={(e) => {
                      const input = e.currentTarget
                        .previousElementSibling as HTMLInputElement;
                      handleArrayChange("sizes", input.value);
                      input.value = "";
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.sizes.map((size, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="flex items-center gap-1 bg-oma-beige text-oma-plum"
                    >
                      {size}
                      <button
                        type="button"
                        onClick={() => removeArrayItem("sizes", index)}
                        className="ml-1 hover:text-red-600"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Colours */}
              <div className="space-y-2">
                <Label className="text-black">Available Colours</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    placeholder="Add colour (e.g., Red, Blue, Black)"
                    className="border-oma-cocoa/20 focus:border-oma-plum"
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleArrayChange("colors", e.currentTarget.value);
                        e.currentTarget.value = "";
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="border-oma-plum text-oma-plum hover:bg-oma-plum hover:text-white"
                    onClick={(e) => {
                      const input = e.currentTarget
                        .previousElementSibling as HTMLInputElement;
                      handleArrayChange("colors", input.value);
                      input.value = "";
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.colors.map((color, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="flex items-center gap-1 bg-oma-beige text-oma-plum"
                    >
                      {color}
                      <button
                        type="button"
                        onClick={() => removeArrayItem("colors", index)}
                        className="ml-1 hover:text-red-600"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Materials */}
              <div className="space-y-2">
                <Label className="text-black">Materials</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    placeholder="Add material (e.g., Cotton, Silk, Polyester)"
                    className="border-oma-cocoa/20 focus:border-oma-plum"
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleArrayChange("materials", e.currentTarget.value);
                        e.currentTarget.value = "";
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="border-oma-plum text-oma-plum hover:bg-oma-plum hover:text-white"
                    onClick={(e) => {
                      const input = e.currentTarget
                        .previousElementSibling as HTMLInputElement;
                      handleArrayChange("materials", input.value);
                      input.value = "";
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.materials.map((material, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="flex items-center gap-1 bg-oma-beige text-oma-plum"
                    >
                      {material}
                      <button
                        type="button"
                        onClick={() => removeArrayItem("materials", index)}
                        className="ml-1 hover:text-red-600"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

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

                  {/* Custom Specialty Input */}
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add custom specialty"
                      className="border-oma-cocoa/20 focus:border-oma-plum"
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleSpecialtyChange(e.currentTarget.value);
                          e.currentTarget.value = "";
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="border-oma-plum text-oma-plum hover:bg-oma-plum hover:text-white"
                      onClick={(e) => {
                        const input = e.currentTarget
                          .previousElementSibling as HTMLInputElement;
                        handleSpecialtyChange(input.value);
                        input.value = "";
                      }}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
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
              disabled={isLoading}
              className="border-oma-cocoa text-black hover:bg-oma-cocoa hover:text-white"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-oma-plum hover:bg-oma-plum/90"
              disabled={isLoading}
            >
              {isLoading ? "Creating..." : "Create Product"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
