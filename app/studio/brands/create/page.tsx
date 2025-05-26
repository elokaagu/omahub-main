"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrand } from "@/lib/services/studioService";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FileUpload } from "@/components/ui/file-upload";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";

// Brand categories
const CATEGORIES = [
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

// Price range options
const PRICE_RANGES = ["$", "$$", "$$$", "$$$$", "$$$$$"];

export default function CreateBrandPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    long_description: "",
    location: "",
    price_range: "",
    category: "",
    image: "",
    is_verified: false,
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleImageUpload = (url: string) => {
    setFormData({
      ...formData,
      image: url,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.name) {
      toast.error("Brand name is required");
      return;
    }

    if (!formData.description) {
      toast.error("Brand description is required");
      return;
    }

    if (!formData.category) {
      toast.error("Category is required");
      return;
    }

    if (!formData.location) {
      toast.error("Location is required");
      return;
    }

    if (!formData.image) {
      toast.error("Brand image is required");
      return;
    }

    setSubmitting(true);
    try {
      const brand = await createBrand({
        name: formData.name,
        description: formData.description,
        long_description: formData.long_description || formData.description,
        location: formData.location,
        price_range: formData.price_range || "$",
        category: formData.category,
        image: formData.image,
        is_verified: false,
      });

      toast.success("Brand created successfully!");
      router.push(`/studio/brands/${brand.id}`);
    } catch (error) {
      console.error("Error creating brand:", error);
      toast.error("Failed to create brand. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-4 mb-8">
        <Button variant="outline" size="icon" asChild className="h-8 w-8">
          <Link href="/studio/brands">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-3xl font-canela text-gray-900">Create New Brand</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Brand Information</CardTitle>
                <CardDescription>
                  Enter the basic information about the brand
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Brand Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g. Adire Designs"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Short Description *</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="A brief description of the brand (100-150 characters)"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="long_description">Full Description</Label>
                  <Textarea
                    id="long_description"
                    name="long_description"
                    value={formData.long_description}
                    onChange={handleInputChange}
                    placeholder="Detailed description of the brand, its history, values, etc."
                    className="min-h-[200px]"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Details</CardTitle>
                <CardDescription>
                  Additional information about the brand
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) =>
                        handleSelectChange("category", value)
                      }
                    >
                      <SelectTrigger>
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

                  <div className="space-y-2">
                    <Label htmlFor="price_range">Price Range</Label>
                    <Select
                      value={formData.price_range}
                      onValueChange={(value) =>
                        handleSelectChange("price_range", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select price range" />
                      </SelectTrigger>
                      <SelectContent>
                        {PRICE_RANGES.map((range) => (
                          <SelectItem key={range} value={range}>
                            {range}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location *</Label>
                  <Input
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    placeholder="e.g. Lagos, Nigeria"
                    required
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Brand Image</CardTitle>
                <CardDescription>
                  Upload a main image for the brand
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FileUpload
                  onUploadComplete={handleImageUpload}
                  bucket="brand-assets"
                  path="brands"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardFooter className="flex flex-col space-y-2">
                <Button
                  type="submit"
                  className="w-full bg-oma-plum hover:bg-oma-plum/90 flex items-center gap-2"
                  disabled={submitting}
                >
                  <Save className="h-4 w-4" />
                  {submitting ? "Creating..." : "Create Brand"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push("/studio/brands")}
                  disabled={submitting}
                >
                  Cancel
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
