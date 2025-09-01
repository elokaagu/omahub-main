"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter, useParams } from "next/navigation";
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
import { getProductById, updateProduct } from "@/lib/services/productService";
import { getAllCollections } from "@/lib/services/collectionService";
import { getAllBrands } from "@/lib/services/brandService";
import { Product, Brand, Catalogue } from "@/lib/supabase";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Upload,
  DollarSign,
  Package,
  Image as ImageIcon,
  Save,
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
import { getBrandCurrency } from "@/lib/utils/currencyUtils";
import { Checkbox } from "@/components/ui/checkbox";

// Brand categories - now using standardized categories
const CATEGORIES = [
  "Bridal",
  "Custom Design",
  "Evening Gowns",
  "Alterations",
  "Ready to Wear",
  "Casual Wear",
  "Accessories",
  "Jewelry",
  "Vacation",
  "Couture",
  "Luxury",
  "Streetwear & Urban",
];

// Curated product categories for dropdown
const PRODUCT_CATEGORIES: string[] = [
  "High End Fashion Brands",
  "Ready to Wear",
  "Made to Measure",
  "Streetwear & Urban",
  "Accessories",
  "Bridal",
  "Custom Design",
  "Evening Gowns",
  "Alterations",
];

export default function EditProductPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;

  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingProduct, setIsLoadingProduct] = useState(true);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [catalogues, setCatalogues] = useState<Catalogue[]>([]);
  const [filteredCatalogues, setFilteredCatalogues] = useState<Catalogue[]>([]);
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedBrandCurrency, setSelectedBrandCurrency] = useState("USD"); // Default to USD instead of Naira
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    sale_price: "",
    image: "",
    images: [] as string[], // Array for multiple images
    brand_id: "",
    catalogue_id: "",
    category: "",
    in_stock: true,
    sizes: [] as string[],
    colors: [] as string[],
    materials: [] as string[],
    tags: [] as string[],
    care_instructions: "",
    is_custom: false,
    lead_time: "",
    video_url: "",
    video_thumbnail: "",
    currency: "USD",
    is_featured: false,
    is_active: true,
  });

  // Check user permissions by fetching profile directly
  const [userProfile, setUserProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user?.id) return;
      
      try {
        setProfileLoading(true);
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("role, owned_brands")
          .eq("id", user.id)
          .single();

        if (error) {
          console.error("Error fetching profile:", error);
          return;
        }

        console.log("🔍 Product Edit - Actual Profile:", profile);
        setUserProfile(profile);
      } catch (error) {
        console.error("Error fetching user profile:", error);
      } finally {
        setProfileLoading(false);
      }
    };

    fetchUserProfile();
  }, [user?.id]);

  // Set selected brand currency for display purposes only (no auto-sync)
  useEffect(() => {
    if (formData.brand_id) {
      const selectedBrand = brands.find((b) => b.id === formData.brand_id);
      if (selectedBrand) {
        if (selectedBrand.currency) {
          setSelectedBrandCurrency(selectedBrand.currency);
        } else {
          setSelectedBrandCurrency("");
        }
      }
    }
  }, [formData.brand_id, brands]);

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

  // Fetch product data and populate form
  useEffect(() => {
    const fetchProductData = async () => {
      try {
        setIsLoadingProduct(true);

        const [productData, brandsData, cataloguesData] = await Promise.all([
          getProductById(productId),
          getAllBrands(),
          getAllCollections(),
        ]);

        if (!productData) {
          toast.error("Product not found");
          router.push("/studio/products");
          return;
        }

        // Check if brand owner has access to this product
        if (user?.role === "brand_admin") {
          if (!supabase) {
            console.error("Supabase client not available");
            router.push("/studio/products");
            return;
          }

          const userProfile = await supabase
            .from("profiles")
            .select("owned_brands")
            .eq("id", user.id)
            .single();

          const ownedBrandIds = userProfile.data?.owned_brands || [];

          if (!ownedBrandIds.includes(productData.brand_id)) {
            toast.error("You don't have permission to edit this product");
            router.push("/studio/products");
            return;
          }
        }

        setProduct(productData);

        // Filter brands based on user role
        if (user?.role === "super_admin") {
          setBrands(brandsData);
        } else if (user?.role === "brand_admin") {
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

        // Populate form with existing product data
        setFormData({
          title: productData.title || "",
          description: productData.description || "",
          price: productData.price?.toString() || "",
          sale_price: productData.sale_price?.toString() || "",
          image: productData.image || "",
          images: productData.images || [], // Load existing images array
          brand_id: productData.brand_id || "",
          catalogue_id: productData.catalogue_id || "",
          category: productData.category || "",
          in_stock: productData.in_stock ?? true,
          sizes: productData.sizes || [],
          colors: productData.colors || [],
          materials: productData.materials || [],
          tags: [],
          care_instructions: productData.care_instructions || "",
          is_custom: productData.is_custom ?? false,
          lead_time: productData.lead_time || "",
          video_url: productData.video_url || "",
          video_thumbnail: productData.video_thumbnail || "",
          currency: productData.currency || "USD", // Set currency from product
          is_featured: false,
          is_active: true,
        });

        // Set initial currency based on product's brand
        if (productData.brand_id) {
          const brand = brandsData.find((b) => b.id === productData.brand_id);
          if (brand && brand.currency) {
            setSelectedBrandCurrency(brand.currency);
          }
        }
      } catch (error) {
        console.error("Error fetching product data:", error);
        toast.error("Failed to load product data");
        router.push("/studio/products");
      } finally {
        setIsLoadingProduct(false);
      }
    };

    if (user && productId) {
      fetchProductData();
    }
  }, [user, productId, router]);

  // Show loading state while auth is initializing
  if (authLoading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-4xl mx-auto px-6 py-24">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-oma-plum mx-auto mb-4"></div>
              <p className="text-gray-600">Loading product edit form...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-4xl mx-auto px-6 py-24">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">
              Authentication Required
            </h1>
            <p className="text-gray-600 mb-4">
              You must be logged in to edit products.
            </p>
            <Button asChild>
              <NavigationLink href="/login">Go to Login</NavigationLink>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show loading while fetching profile
  if (profileLoading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-4xl mx-auto px-6 py-24">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-oma-plum mx-auto mb-4"></div>
              <p className="text-gray-600">Loading permissions...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Check permissions based on actual profile
  const hasPermission = userProfile?.role === "super_admin" || userProfile?.role === "brand_admin";

  if (!hasPermission) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-4xl mx-auto px-6 py-24">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">
              Insufficient Permissions
            </h1>
            <p className="text-gray-600 mb-4">
              You don't have permission to edit products.
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Your role: {userProfile?.role || 'unknown'}
            </p>
            <Button asChild>
              <NavigationLink href="/studio">Go to Studio</NavigationLink>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show loading state while product is being fetched
  if (isLoadingProduct) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-4xl mx-auto px-6 py-24">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-oma-plum mx-auto mb-4"></div>
              <p className="text-gray-600">Loading product data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error if product not found
  if (!product) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-4xl mx-auto px-6 py-24">
          <div className="text-center">
            <h1 className="text-2xl font-canela text-black mb-4">
              Product Not Found
            </h1>
            <Button asChild className="bg-black hover:bg-gray-800">
              <NavigationLink href="/studio/products">
                Back to Products
              </NavigationLink>
            </Button>
          </div>
        </div>
      </div>
    );
  }

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

    setFormData({
      ...formData,
      [name]: value,
    });

    // Update currency when brand changes
    if (name === "brand_id" && typeof value === "string") {
      const selectedBrand = brands.find((brand) => brand.id === value);
      if (selectedBrand) {
        const brandCurrency = getBrandCurrency(selectedBrand);
        if (brandCurrency) {
          setSelectedBrandCurrency(brandCurrency.code);

          // Automatically set the product currency to match the brand
          setFormData((prev) => ({
            ...prev,
            currency: brandCurrency.code,
          }));
        }
      }
    }
  };

  // Format price for display - use centralized utility
  const formatPriceForDisplay = (price: string): string => {
    const numericPrice = parseFloat(price.replace(/,/g, ""));
    if (isNaN(numericPrice)) return price;
    return formatNumberWithCommas(numericPrice);
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
    if (value.trim()) {
      setFormData((prev) => ({
        ...prev,
        [field]: [...prev[field], value.trim()],
      }));
    }
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.title ||
      !formData.description ||
      !formData.price ||
      !formData.brand_id
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!formData.category) {
      toast.error("Please select a category");
      return;
    }

    // 🔒 ENFORCE CURRENCY VALIDATION
    const selectedBrand = brands.find(
      (brand) => brand.id === formData.brand_id
    );
    if (selectedBrand) {
      const brandCurrency = getBrandCurrency(selectedBrand);
      if (brandCurrency && formData.currency !== brandCurrency.code) {
        toast.error(
          `Currency mismatch! This brand uses ${brandCurrency.symbol}${brandCurrency.code}. ` +
            `Please change the product currency to ${brandCurrency.code} or contact support if you need to use a different currency.`
        );
        return;
      }
    }

    try {
      setIsLoading(true);

      const updateData: Partial<Product> = {
        title: formData.title,
        description: formData.description,
        price: parseFloat(formData.price),
        sale_price: formData.sale_price
          ? parseFloat(formData.sale_price)
          : undefined,
        image:
          formData.image ||
          formData.images[0] ||
          "https://via.placeholder.com/400x400?text=Product+Image",
        images:
          formData.images.length > 0
            ? formData.images.filter((img) => img)
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
        // Only include optional fields if they have values
        ...(formData.materials.length > 0 && { materials: formData.materials }),
        ...(formData.care_instructions && {
          care_instructions: formData.care_instructions,
        }),
        ...(formData.is_custom !== undefined && {
          is_custom: formData.is_custom,
        }),
        ...(formData.lead_time && { lead_time: formData.lead_time }),
        ...(formData.video_url && { video_url: formData.video_url }),
        ...(formData.video_thumbnail && {
          video_thumbnail: formData.video_thumbnail,
        }),
        currency: formData.currency, // Add currency to update data
      };

      console.log("Updating product with data:", updateData);

      const updatedProduct = await updateProduct(productId, updateData);

      if (updatedProduct) {
        toast.success("Product updated successfully! You can continue editing or go back to products.");
        // Don't auto-redirect to avoid getting stuck on loading spinner
        // User can manually navigate back using the back button
      } else {
        throw new Error("Product update returned null");
      }
    } catch (error: any) {
      console.error("Error updating product:", error);

      if (
        error?.message?.includes("schema cache") ||
        error?.message?.includes("column")
      ) {
        toast.error(
          "Database schema issue detected. Please contact administrator."
        );
      } else if (error?.message?.includes("foreign key")) {
        toast.error("Invalid brand or collection selected");
      } else if (error?.message?.includes("permission")) {
        toast.error("You don't have permission to update products");
      } else {
        toast.error("Failed to update product. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-6 py-24">
        {/* Header */}
        <div className="flex items-center gap-4 mb-12">
          <Button
            variant="outline"
            size="icon"
            asChild
            className="border-gray-300 hover:bg-gray-100"
          >
            <NavigationLink href="/studio/products">←</NavigationLink>
          </Button>
          <div>
            <h1 className="text-4xl font-canela text-black mb-2">
              Edit Product
            </h1>
            <p className="text-gray-600">Update product information</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <Card className="border border-gray-200 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-black font-canela">
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
                    className="border-gray-300 focus:border-gray-500"
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
                    <SelectTrigger className="border-gray-300 focus:border-gray-500">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {PRODUCT_CATEGORIES.map((category) => (
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
                  className="border-gray-300 focus:border-gray-500"
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
                <p className="text-xs text-gray-600 mt-2">
                  Upload up to 4 high-quality product images. The first image
                  will be used as the main product image.
                </p>
              </div>
              {/* Video Upload */}
              <div className="space-y-2">
                <Label className="text-black">Product Video (Optional)</Label>
                <VideoUpload
                  onUploadComplete={(url) =>
                    handleInputChange("video_url", url)
                  }
                  defaultValue={formData.video_url}
                  bucket="product-videos"
                  path="videos"
                  accept="video/mp4,video/webm,video/quicktime"
                  maxSize={100}
                />
                <p className="text-xs text-gray-600 mt-2">
                  Upload a product video (MP4, WebM, or MOV, up to 100MB).
                </p>
              </div>
              {/* Video Thumbnail Upload */}
              <div className="space-y-2">
                <Label className="text-black">Video Thumbnail (Optional)</Label>
                <FileUpload
                  onUploadComplete={(url) =>
                    handleInputChange("video_thumbnail", url)
                  }
                  defaultValue={formData.video_thumbnail}
                  bucket="product-images"
                  path="thumbnails"
                  accept={{
                    "image/png": [".png"],
                    "image/jpeg": [".jpg", ".jpeg"],
                    "image/webp": [".webp"],
                  }}
                  maxSize={5}
                />
                {formData.video_thumbnail && (
                  <img
                    src={formData.video_thumbnail}
                    alt="Video Thumbnail"
                    className="mt-2 w-32 h-32 object-cover rounded"
                  />
                )}
                <p className="text-xs text-gray-600 mt-2">
                  Upload a thumbnail image for the video (PNG, JPG, WEBP, up to
                  5MB).
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Brand and Collection */}
          <Card className="border border-gray-200 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-black font-canela">
                Brand & Collection
              </CardTitle>
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
                    <SelectTrigger className="border-gray-300 focus:border-gray-500">
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
                                className="text-xs bg-blue-500 text-white"
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
                    <SelectTrigger className="border-gray-300 focus:border-gray-500">
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      {[
                        { code: "NGN", symbol: "₦", name: "Nigerian Naira" },
                        { code: "KES", symbol: "KSh", name: "Kenyan Shilling" },
                        { code: "GHS", symbol: "GHS", name: "Ghanaian Cedi" },
                        {
                          code: "ZAR",
                          symbol: "R",
                          name: "South African Rand",
                        },
                        { code: "EGP", symbol: "EGP", name: "Egyptian Pound" },
                        { code: "MAD", symbol: "MAD", name: "Moroccan Dirham" },
                        { code: "TND", symbol: "TND", name: "Tunisian Dinar" },
                        {
                          code: "XOF",
                          symbol: "XOF",
                          name: "West African CFA Franc",
                        },
                        { code: "DZD", symbol: "DA", name: "Algerian Dinar" },
                        { code: "USD", symbol: "$", name: "US Dollar" },
                        { code: "EUR", symbol: "€", name: "Euro" },
                        { code: "GBP", symbol: "£", name: "British Pound" },
                      ].map((currency) => (
                        <SelectItem key={currency.code} value={currency.code}>
                          <div className="flex items-center gap-2">
                            <span>{currency.symbol}</span>
                            <span>{currency.code}</span>
                            <span className="text-gray-500">
                              ({currency.name})
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formData.brand_id && (
                    <p className="text-xs text-muted-foreground">
                      Auto-synced with{" "}
                      {brands.find((b) => b.id === formData.brand_id)?.name}{" "}
                      {selectedBrandCurrency
                        ? `(${selectedBrandCurrency})`
                        : "(Contact designer for pricing)"}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="collection" className="text-black">
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

          {/* Pricing */}
          <Card className="border border-gray-200 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-black font-canela">Pricing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="price" className="text-black">
                    Regular Price *
                  </Label>
                  <div className="relative">
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) =>
                        handleInputChange("price", e.target.value)
                      }
                      placeholder="0"
                      className="border-gray-300 focus:border-gray-500"
                      required
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Enter the regular selling price (e.g., 15,000)
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sale_price" className="text-black">
                    Sale Price (Optional)
                  </Label>
                  <div className="relative">
                    <Input
                      id="sale_price"
                      type="number"
                      step="0.01"
                      value={formData.sale_price}
                      onChange={(e) =>
                        handleInputChange("sale_price", e.target.value)
                      }
                      placeholder="0"
                      className="border-gray-300 focus:border-gray-500"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Optional discounted price (must be less than regular price)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Product Details */}
          <Card className="border border-gray-200 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-black font-canela">
                Product Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Available Sizes */}
              <div className="space-y-2">
                <Label className="text-black">Available Sizes</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add size (e.g., S, M, L, XL)"
                    className="border-gray-300 focus:border-gray-500"
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        const input = e.target as HTMLInputElement;
                        handleArrayChange("sizes", input.value);
                        input.value = "";
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="border-gray-300 hover:bg-gray-100"
                    onClick={(e) => {
                      const input = (e.target as HTMLElement)
                        .previousElementSibling as HTMLInputElement;
                      if (input?.value) {
                        handleArrayChange("sizes", input.value);
                        input.value = "";
                      }
                    }}
                  >
                    +
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.sizes.map((size, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="flex items-center gap-1 bg-gray-100 text-black"
                    >
                      {size}
                      <button
                        type="button"
                        onClick={() => removeArrayItem("sizes", index)}
                        className="ml-1 hover:text-red-600"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Available Colours */}
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
                      className="flex items-center gap-1 bg-gray-100 text-black"
                    >
                      {color}
                      <button
                        type="button"
                        onClick={() => removeArrayItem("colors", index)}
                        className="ml-1 hover:text-red-600"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Materials */}
              <div className="space-y-2">
                <Label className="text-black">Materials</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add material (e.g., Cotton, Silk, Polyester)"
                    className="border-gray-300 focus:border-gray-500"
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        const input = e.target as HTMLInputElement;
                        handleArrayChange("materials", input.value);
                        input.value = "";
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="border-gray-300 hover:bg-gray-100"
                    onClick={(e) => {
                      const input = (e.target as HTMLElement)
                        .previousElementSibling as HTMLInputElement;
                      if (input?.value) {
                        handleArrayChange("materials", input.value);
                        input.value = "";
                      }
                    }}
                  >
                    +
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.materials.map((material, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="flex items-center gap-1 bg-gray-100 text-black"
                    >
                      {material}
                      <button
                        type="button"
                        onClick={() => removeArrayItem("materials", index)}
                        className="ml-1 hover:text-red-600"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Care Instructions */}
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
                  className="border-gray-300 focus:border-gray-500"
                />
              </div>

              {/* Lead Time */}
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
                  className="border-gray-300 focus:border-gray-500"
                />
              </div>
            </CardContent>
          </Card>

          {/* Settings */}
          <Card className="border border-gray-200 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-black font-canela">Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-black">In Stock</Label>
                  <p className="text-sm text-gray-600">
                    Whether this product is currently available
                  </p>
                </div>
                <Switch
                  checked={formData.in_stock}
                  onCheckedChange={(checked) =>
                    handleInputChange("in_stock", checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-black">Custom/Tailored Item</Label>
                  <p className="text-sm text-gray-600">
                    Mark if this is a custom or made-to-order item
                  </p>
                </div>
                <Switch
                  checked={formData.is_custom}
                  onCheckedChange={(checked) =>
                    handleInputChange("is_custom", checked)
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/studio/products")}
              className="border-gray-300 text-black hover:bg-gray-100"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-black hover:bg-gray-800 text-white"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                  Updating Product...
                </>
              ) : (
                <>Update Product</>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
