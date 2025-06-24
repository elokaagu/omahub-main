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
import { FileUpload } from "@/components/ui/file-upload";
import {
  getSpotlightContent,
  updateSpotlightContent,
  type UpdateSpotlightData,
  type SpotlightContent,
  type FeaturedProduct,
} from "@/lib/services/spotlightService";
import { ArrowLeft, Plus, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Loading } from "@/components/ui/loading";
import Link from "next/link";

export default function EditSpotlightPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const spotlightId = params.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [spotlightContent, setSpotlightContent] =
    useState<SpotlightContent | null>(null);
  const [formData, setFormData] = useState<UpdateSpotlightData>({
    title: "",
    subtitle: "",
    brand_name: "",
    brand_description: "",
    brand_quote: "",
    brand_quote_author: "",
    main_image: "",
    featured_products: [],
    brand_link: "",
    is_active: false,
  });

  // Check if user is super admin
  useEffect(() => {
    if (user && user.role !== "super_admin") {
      router.push("/studio");
      return;
    }
  }, [user, router]);

  // Fetch spotlight content
  useEffect(() => {
    const fetchSpotlightContent = async () => {
      if (!spotlightId) return;

      try {
        setIsLoading(true);
        const content = await getSpotlightContent(spotlightId);

        if (!content) {
          toast.error("Spotlight content not found");
          router.push("/studio/spotlight");
          return;
        }

        setSpotlightContent(content);
        setFormData({
          title: content.title,
          subtitle: content.subtitle,
          brand_name: content.brand_name,
          brand_description: content.brand_description,
          brand_quote: content.brand_quote,
          brand_quote_author: content.brand_quote_author,
          main_image: content.main_image,
          featured_products: content.featured_products,
          brand_link: content.brand_link,
          is_active: content.is_active,
        });
      } catch (error) {
        console.error("Error fetching spotlight content:", error);
        toast.error("Failed to load spotlight content");
        router.push("/studio/spotlight");
      } finally {
        setIsLoading(false);
      }
    };

    if (user?.role === "super_admin") {
      fetchSpotlightContent();
    }
  }, [spotlightId, user, router]);

  const handleInputChange = (
    field: keyof UpdateSpotlightData,
    value: string | boolean
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleMainImageUpload = (url: string) => {
    setFormData((prev) => ({
      ...prev,
      main_image: url,
    }));
  };

  const handleProductChange = (
    index: number,
    field: keyof FeaturedProduct,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      featured_products:
        prev.featured_products?.map((product, i) =>
          i === index ? { ...product, [field]: value } : product
        ) || [],
    }));
  };

  const handleProductImageUpload = (index: number, url: string) => {
    handleProductChange(index, "image", url);
  };

  const addProduct = () => {
    setFormData((prev) => ({
      ...prev,
      featured_products: [
        ...(prev.featured_products || []),
        { name: "", collection: "", image: "" },
      ],
    }));
  };

  const removeProduct = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      featured_products:
        prev.featured_products?.filter((_, i) => i !== index) || [],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !spotlightId) {
      toast.error("Missing required information");
      return;
    }

    // Validation
    if (!formData.title?.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!formData.subtitle?.trim()) {
      toast.error("Subtitle is required");
      return;
    }
    if (!formData.brand_name?.trim()) {
      toast.error("Brand name is required");
      return;
    }
    if (!formData.brand_description?.trim()) {
      toast.error("Brand description is required");
      return;
    }
    if (!formData.brand_quote?.trim()) {
      toast.error("Brand quote is required");
      return;
    }
    if (!formData.brand_quote_author?.trim()) {
      toast.error("Quote author is required");
      return;
    }
    if (!formData.main_image?.trim()) {
      toast.error("Main image is required");
      return;
    }
    if (!formData.brand_link?.trim()) {
      toast.error("Brand link is required");
      return;
    }

    try {
      setIsSaving(true);
      await updateSpotlightContent(user.id, spotlightId, formData);
      toast.success("Spotlight content updated successfully");
      router.push("/studio/spotlight");
    } catch (error) {
      console.error("Error updating spotlight content:", error);
      toast.error("Failed to update spotlight content");
    } finally {
      setIsSaving(false);
    }
  };

  if (user?.role !== "super_admin") {
    return <Loading />;
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loading />
      </div>
    );
  }

  if (!spotlightContent) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-canela text-oma-black mb-4">
            Spotlight Content Not Found
          </h1>
          <Button asChild>
            <Link href="/studio/spotlight">Back to Spotlight</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="flex items-center gap-4 mb-8">
        <Button asChild variant="outline" size="sm">
          <Link href="/studio/spotlight">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Spotlight
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-canela text-oma-black mb-2">
            Edit Spotlight Content
          </h1>
          <p className="text-oma-cocoa">
            Update the featured brand content for the homepage spotlight section
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Spotlight Title *</Label>
                <Input
                  id="title"
                  value={formData.title || ""}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  placeholder="e.g., Spotlight On: Mbali Studio"
                  required
                />
              </div>
              <div>
                <Label htmlFor="brand_name">Brand Name *</Label>
                <Input
                  id="brand_name"
                  value={formData.brand_name || ""}
                  onChange={(e) =>
                    handleInputChange("brand_name", e.target.value)
                  }
                  placeholder="e.g., Mbali Studio"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="subtitle">Subtitle *</Label>
              <Textarea
                id="subtitle"
                value={formData.subtitle || ""}
                onChange={(e) => handleInputChange("subtitle", e.target.value)}
                placeholder="Brief description that appears under the title"
                rows={2}
                required
              />
            </div>

            <div>
              <Label htmlFor="brand_description">Brand Description *</Label>
              <Textarea
                id="brand_description"
                value={formData.brand_description || ""}
                onChange={(e) =>
                  handleInputChange("brand_description", e.target.value)
                }
                placeholder="Detailed description of the brand and their story"
                rows={4}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="brand_quote">Brand Quote *</Label>
                <Input
                  id="brand_quote"
                  value={formData.brand_quote || ""}
                  onChange={(e) =>
                    handleInputChange("brand_quote", e.target.value)
                  }
                  placeholder="e.g., Where elegance comes stitched with meaning"
                  required
                />
              </div>
              <div>
                <Label htmlFor="brand_quote_author">Quote Author *</Label>
                <Input
                  id="brand_quote_author"
                  value={formData.brand_quote_author || ""}
                  onChange={(e) =>
                    handleInputChange("brand_quote_author", e.target.value)
                  }
                  placeholder="e.g., Thandi Mbali, Founder"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="main_image">Main Image *</Label>
                <FileUpload
                  onUploadComplete={handleMainImageUpload}
                  defaultValue={formData.main_image}
                  bucket="spotlight-images"
                  path="main"
                  accept={{
                    "image/png": [".png"],
                    "image/jpeg": [".jpg", ".jpeg"],
                    "image/webp": [".webp"],
                  }}
                  maxSize={10}
                />
                <p className="text-xs text-oma-cocoa/70 mt-1">
                  High-resolution main spotlight image
                </p>
              </div>
              <div>
                <Label htmlFor="brand_link">Brand Link *</Label>
                <Input
                  id="brand_link"
                  value={formData.brand_link || ""}
                  onChange={(e) =>
                    handleInputChange("brand_link", e.target.value)
                  }
                  placeholder="/brand/brand-slug or external URL"
                  required
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active || false}
                onCheckedChange={(checked) =>
                  handleInputChange("is_active", checked)
                }
              />
              <Label htmlFor="is_active">
                Set as active spotlight (will deactivate others)
              </Label>
            </div>
          </CardContent>
        </Card>

        {/* Featured Products */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Featured Products</CardTitle>
              <Button
                type="button"
                onClick={addProduct}
                variant="outline"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {!formData.featured_products ||
            formData.featured_products.length === 0 ? (
              <div className="text-center py-8 text-oma-cocoa">
                <Upload className="h-12 w-12 mx-auto mb-4 opacity-40" />
                <p>No featured products added yet</p>
                <p className="text-sm">
                  Add products to showcase in the spotlight section
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {formData.featured_products.map((product, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium">Product {index + 1}</h4>
                      <Button
                        type="button"
                        onClick={() => removeProduct(index)}
                        variant="outline"
                        size="sm"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <Label htmlFor={`product_name_${index}`}>
                          Product Name
                        </Label>
                        <Input
                          id={`product_name_${index}`}
                          value={product.name}
                          onChange={(e) =>
                            handleProductChange(index, "name", e.target.value)
                          }
                          placeholder="e.g., Silk Scarf"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`product_collection_${index}`}>
                          Collection
                        </Label>
                        <Input
                          id={`product_collection_${index}`}
                          value={product.collection}
                          onChange={(e) =>
                            handleProductChange(
                              index,
                              "collection",
                              e.target.value
                            )
                          }
                          placeholder="e.g., Heritage Collection"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`product_image_${index}`}>
                          Product Image
                        </Label>
                        <FileUpload
                          onUploadComplete={(url: string) =>
                            handleProductImageUpload(index, url)
                          }
                          defaultValue={product.image}
                          bucket="spotlight-images"
                          path="products"
                          accept={{
                            "image/png": [".png"],
                            "image/jpeg": [".jpg", ".jpeg"],
                            "image/webp": [".webp"],
                          }}
                          maxSize={5}
                          className="h-32"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" asChild>
            <Link href="/studio/spotlight">Cancel</Link>
          </Button>
          <Button
            type="submit"
            disabled={isSaving}
            className="bg-oma-plum hover:bg-oma-plum/90"
          >
            {isSaving ? (
              <>
                <div className="h-4 w-4 mr-2 animate-spin rounded-full border border-current border-t-transparent" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
