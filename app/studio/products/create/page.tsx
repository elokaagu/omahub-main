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
import { createProduct } from "@/lib/services/productService";
import { getAllCatalogues } from "@/lib/services/catalogueService";
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

export default function CreateProductPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [catalogues, setCatalogues] = useState<Catalogue[]>([]);
  const [filteredCatalogues, setFilteredCatalogues] = useState<Catalogue[]>([]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    sale_price: "",
    image: "",
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
  });

  // Check if user is super admin or brand owner
  useEffect(() => {
    // Don't redirect if we're still loading or if user is null (temporary state)
    if (!user) return;

    if (user.role !== "super_admin" && user.role !== "brand_admin") {
      router.push("/studio");
      return;
    }
  }, [user, router]);

  // Fetch brands and catalogues
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [brandsData, cataloguesData] = await Promise.all([
          getAllBrands(),
          getAllCatalogues(),
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

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Reset catalogue when brand changes
    if (field === "brand_id") {
      setFormData((prev) => ({
        ...prev,
        catalogue_id: "",
      }));
    }
  };

  const handleImageUpload = (url: string) => {
    setFormData((prev) => ({
      ...prev,
      image: url,
    }));
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

    try {
      setIsLoading(true);

      // Prepare product data with only the fields that exist in the database
      const productData = {
        title: formData.title,
        description: formData.description,
        price: parseFloat(formData.price),
        sale_price: formData.sale_price
          ? parseFloat(formData.sale_price)
          : undefined,
        image:
          formData.image ||
          "https://via.placeholder.com/400x400?text=Product+Image",
        brand_id: formData.brand_id,
        catalogue_id: formData.catalogue_id || undefined,
        category: formData.category || "General",
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
                    Category
                  </Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) =>
                      handleInputChange("category", e.target.value)
                    }
                    placeholder="e.g., Dresses, Accessories"
                    className="border-oma-cocoa/20 focus:border-oma-plum"
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
                <Label htmlFor="image" className="text-black">
                  Product Image
                </Label>
                <FileUpload
                  onUploadComplete={handleImageUpload}
                  defaultValue={formData.image}
                  bucket="product-images"
                  path="products"
                  accept={{
                    "image/png": [".png"],
                    "image/jpeg": [".jpg", ".jpeg"],
                    "image/webp": [".webp"],
                  }}
                  maxSize={5}
                />
                <p className="text-xs text-black/70 mt-1">
                  Upload a high-quality product image
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Brand and Catalogue */}
          <Card className="border border-oma-gold/10 bg-white">
            <CardHeader>
              <CardTitle className="text-black">Brand & Catalogue</CardTitle>
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
                    Catalogue (Optional)
                  </Label>
                  <Select
                    value={formData.catalogue_id}
                    onValueChange={(value) =>
                      handleInputChange("catalogue_id", value)
                    }
                  >
                    <SelectTrigger className="border-gray-300 focus:border-gray-500">
                      <SelectValue placeholder="Select a catalogue (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No Catalogue</SelectItem>
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
          <Card className="border border-oma-gold/10 bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-black">
                <DollarSign className="h-5 w-5" />
                Pricing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="price" className="text-black">
                    Regular Price *
                  </Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => handleInputChange("price", e.target.value)}
                    placeholder="0.00"
                    className="border-oma-cocoa/20 focus:border-oma-plum"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sale_price" className="text-black">
                    Sale Price (Optional)
                  </Label>
                  <Input
                    id="sale_price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.sale_price}
                    onChange={(e) =>
                      handleInputChange("sale_price", e.target.value)
                    }
                    placeholder="0.00"
                    className="border-oma-cocoa/20 focus:border-oma-plum"
                  />
                </div>
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

              {/* Colors */}
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
                <Switch
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
                <Switch
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
