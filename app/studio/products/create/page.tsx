"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAllBrands } from "@/lib/services/brandService";
import { getBrandCollections } from "@/lib/services/brandService";
import { createProduct } from "@/lib/services/productService";
import { Brand, Collection } from "@/lib/supabase";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { FileUpload } from "@/components/ui/file-upload";
import { ArrowLeft, Save, Plus, X } from "lucide-react";
import { toast } from "sonner";

// Product categories
const CATEGORIES = [
  "Dresses",
  "Tops",
  "Bottoms",
  "Outerwear",
  "Footwear",
  "Accessories",
  "Traditional",
  "Jewelry",
  "Bridal",
  "Other",
];

export default function CreateProductPage() {
  const router = useRouter();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [brandId, setBrandId] = useState("");
  const [collectionId, setCollectionId] = useState("");
  const [category, setCategory] = useState("");
  const [image, setImage] = useState("");
  const [inStock, setInStock] = useState(true);
  const [sizes, setSizes] = useState<string[]>([]);
  const [newSize, setNewSize] = useState("");
  const [colors, setColors] = useState<string[]>([]);
  const [newColor, setNewColor] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch brands for dropdown
        const brandsData = await getAllBrands();
        setBrands(brandsData);

        // If there are brands, select the first one by default
        if (brandsData.length > 0) {
          setBrandId(brandsData[0].id);

          // Fetch collections for the selected brand
          const collectionsData = await getBrandCollections(brandsData[0].id);
          setCollections(collectionsData);
        }

        // Set default category
        if (CATEGORIES.length > 0) {
          setCategory(CATEGORIES[0]);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const fetchCollections = async () => {
      if (brandId) {
        try {
          const collectionsData = await getBrandCollections(brandId);
          setCollections(collectionsData);
          setCollectionId(""); // Reset collection when brand changes
        } catch (error) {
          console.error("Error fetching collections:", error);
          toast.error("Failed to load collections");
        }
      }
    };

    fetchCollections();
  }, [brandId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    if (!title.trim()) {
      toast.error("Please enter a product title");
      return;
    }

    if (!brandId) {
      toast.error("Please select a brand");
      return;
    }

    if (!category) {
      toast.error("Please select a category");
      return;
    }

    if (!image) {
      toast.error("Please upload an image");
      return;
    }

    if (!price || isNaN(Number(price)) || Number(price) <= 0) {
      toast.error("Please enter a valid price");
      return;
    }

    if (salePrice && (isNaN(Number(salePrice)) || Number(salePrice) <= 0)) {
      toast.error("Please enter a valid sale price");
      return;
    }

    setSaving(true);
    try {
      await createProduct({
        title,
        description,
        price: Number(price),
        sale_price: salePrice ? Number(salePrice) : undefined,
        brand_id: brandId,
        collection_id: collectionId || undefined,
        category,
        image,
        in_stock: inStock,
        sizes: sizes.length > 0 ? sizes : undefined,
        colors: colors.length > 0 ? colors : undefined,
      });

      toast.success("Product created successfully");
      router.push("/studio/products");
    } catch (error) {
      console.error("Error creating product:", error);
      toast.error("Failed to create product");
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = (url: string) => {
    setImage(url);
  };

  const addSize = () => {
    if (newSize && !sizes.includes(newSize)) {
      setSizes([...sizes, newSize]);
      setNewSize("");
    }
  };

  const removeSize = (size: string) => {
    setSizes(sizes.filter((s) => s !== size));
  };

  const addColor = () => {
    if (newColor && !colors.includes(newColor)) {
      setColors([...colors, newColor]);
      setNewColor("");
    }
  };

  const removeColor = (color: string) => {
    setColors(colors.filter((c) => c !== color));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-oma-plum border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center mb-8">
        <Button
          variant="outline"
          size="icon"
          className="mr-4"
          onClick={() => router.push("/studio/products")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-canela text-gray-900">Create Product</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Product Details</CardTitle>
                <CardDescription>
                  Basic information about your product
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Product Title</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter product title"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter product description"
                    className="min-h-32"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Price ($)</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="salePrice">Sale Price ($) (Optional)</Label>
                    <Input
                      id="salePrice"
                      type="number"
                      step="0.01"
                      min="0"
                      value={salePrice}
                      onChange={(e) => setSalePrice(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Organization</CardTitle>
                <CardDescription>Categorize your product</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="brand">Brand</Label>
                    <Select value={brandId} onValueChange={setBrandId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a brand" />
                      </SelectTrigger>
                      <SelectContent>
                        {brands.map((brand) => (
                          <SelectItem key={brand.id} value={brand.id}>
                            {brand.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="collection">Collection (Optional)</Label>
                    <Select
                      value={collectionId}
                      onValueChange={setCollectionId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a collection" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {collections.map((collection) => (
                          <SelectItem key={collection.id} value={collection.id}>
                            {collection.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger>
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

                  <div className="space-y-2 flex items-center pt-8">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="inStock"
                        checked={inStock}
                        onCheckedChange={(checked) =>
                          setInStock(checked as boolean)
                        }
                      />
                      <Label htmlFor="inStock">In Stock</Label>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Variants</CardTitle>
                <CardDescription>Available sizes and colors</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <Label>Sizes</Label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {sizes.map((size) => (
                      <div
                        key={size}
                        className="flex items-center bg-gray-100 rounded-full px-3 py-1"
                      >
                        <span className="text-sm">{size}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-5 w-5 p-0 ml-1"
                          onClick={() => removeSize(size)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      value={newSize}
                      onChange={(e) => setNewSize(e.target.value)}
                      placeholder="Add a size (e.g. S, M, L)"
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      onClick={addSize}
                      className="bg-oma-plum hover:bg-oma-plum/90"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  <Label>Colors</Label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {colors.map((color) => (
                      <div
                        key={color}
                        className="flex items-center bg-gray-100 rounded-full px-3 py-1"
                      >
                        <span className="text-sm">{color}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-5 w-5 p-0 ml-1"
                          onClick={() => removeColor(color)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      value={newColor}
                      onChange={(e) => setNewColor(e.target.value)}
                      placeholder="Add a color (e.g. Red, Blue)"
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      onClick={addColor}
                      className="bg-oma-plum hover:bg-oma-plum/90"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle>Product Image</CardTitle>
                <CardDescription>Upload your product image</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FileUpload
                  onUploadComplete={handleImageUpload}
                  bucket="brand-assets"
                  path="products"
                />

                {image && (
                  <div className="mt-4 rounded-md overflow-hidden border border-gray-200">
                    <img
                      src={image}
                      alt="Product preview"
                      className="w-full h-auto"
                    />
                  </div>
                )}

                <div className="pt-4">
                  <Button
                    type="submit"
                    className="w-full bg-oma-plum hover:bg-oma-plum/90 flex items-center justify-center gap-2"
                    disabled={saving}
                  >
                    <Save className="h-4 w-4" />
                    {saving ? "Creating..." : "Create Product"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
