"use client";



import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Plus, X, Upload } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { SimpleFileUpload } from "@/components/ui/simple-file-upload";
import { MultiSelect } from "@/components/ui/multi-select";
import { getAllBrands } from "@/lib/services/brandService";

interface Brand {
  id: string;
  name: string;
  category: string;
  image: string;
}

export default function CreatePortfolioPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    brand_id: "",
    category: "",
    price_range: "",
    specialties: [] as string[],
    lead_time: "",
    consultation_fee: "",
    // Portfolio images (no individual pricing)
    images: [] as string[],
    // Optional fields
    materials: [] as string[],
    techniques: [] as string[],
    inspiration: "",
  });

  // Tailor categories that can have portfolios
  const tailorCategories = [
    "Bridal",
    "Custom Design",
    "Evening Gowns",
    "Alterations",
    "Tailored",
    "Event Wear",
    "Wedding Guest",
    "Birthday",
  ];

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
    "Lace Work",
    "Sequins & Rhinestones",
    "Hand Stitching",
    "Custom Fitting",
  ];

  // Common materials
  const commonMaterials = [
    "Silk",
    "Satin",
    "Chiffon",
    "Lace",
    "Tulle",
    "Velvet",
    "Crepe",
    "Jersey",
    "Denim",
    "Cotton",
    "Wool",
    "Linen",
    "Polyester",
    "Viscose",
    "Rayon",
  ];

  // Common techniques
  const commonTechniques = [
    "Hand Stitching",
    "Machine Stitching",
    "Embroidery",
    "Beading",
    "Appliqué",
    "Pleating",
    "Gathering",
    "Draping",
    "Pattern Making",
    "Fitting",
    "Alterations",
    "Custom Design",
    "Bespoke Tailoring",
    "Made-to-Measure",
  ];

  useEffect(() => {
    fetchBrands();
  }, []);

  const fetchBrands = async () => {
    try {
      const brandsData = await getAllBrands();
      // Only show brands that are tailors
      const tailorBrands = brandsData.filter((brand: Brand) =>
        tailorCategories.includes(brand.category)
      );
      setBrands(tailorBrands);
    } catch (error) {
      console.error("Error fetching brands:", error);
      toast.error("Failed to load brands");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    name: string,
    value: string | string[] | boolean
  ) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (url: string) => {
    setFormData((prev) => ({
      ...prev,
      images: [...prev.images, url],
    }));
  };

  const handleRemoveImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.description || !formData.brand_id) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (formData.images.length === 0) {
      toast.error("Please upload at least one portfolio image");
      return;
    }

    try {
      setIsLoading(true);

      // Create portfolio as a special product type
      const portfolioData = {
        title: formData.title,
        description: formData.description,
        price: 0, // No individual pricing for portfolio items
        image: formData.images[0],
        images: formData.images,
        brand_id: formData.brand_id,
        category: formData.category || "Custom Design",
        in_stock: true,
        is_custom: true,
        // Portfolio-specific metadata
        service_type: "portfolio" as const,
        contact_for_pricing: true, // Always true for portfolios
        price_range: formData.price_range,
        specialties: formData.specialties,
        lead_time: formData.lead_time,
        consultation_fee: formData.consultation_fee
          ? parseFloat(formData.consultation_fee)
          : undefined,
        // Portfolio fields
        materials: formData.materials,
        techniques: formData.techniques,
        inspiration: formData.inspiration,
      };

      const response = await fetch("/api/studio/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(portfolioData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create portfolio");
      }

      toast.success("Portfolio created successfully!");
      router.push("/studio/portfolio");
    } catch (error) {
      console.error("Error creating portfolio:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to create portfolio"
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-oma-plum border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="outline" size="icon" asChild className="h-8 w-8">
          <Link href="/studio/portfolio">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-3xl font-canela text-gray-900">Create Portfolio</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Portfolio Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Portfolio Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                placeholder="e.g., Bridal Collection 2024, Custom Evening Wear"
                className="border-oma-cocoa/20 focus:border-oma-plum"
              />
            </div>

            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                placeholder="Describe your portfolio, your style, and what makes your work unique..."
                rows={4}
                className="border-oma-cocoa/20 focus:border-oma-plum"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="brand_id">Brand *</Label>
                <select
                  id="brand_id"
                  value={formData.brand_id}
                  onChange={(e) =>
                    handleInputChange("brand_id", e.target.value)
                  }
                  className="w-full p-2 border border-oma-cocoa/20 rounded-md focus:border-oma-plum"
                >
                  <option value="">Select a brand</option>
                  {brands.map((brand) => (
                    <option key={brand.id} value={brand.id}>
                      {brand.name} ({brand.category})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="category">Category</Label>
                <select
                  id="category"
                  value={formData.category}
                  onChange={(e) =>
                    handleInputChange("category", e.target.value)
                  }
                  className="w-full p-2 border border-oma-cocoa/20 rounded-md focus:border-oma-plum"
                >
                  <option value="">Select category</option>
                  {tailorCategories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Portfolio Images */}
        <Card>
          <CardHeader>
            <CardTitle>Portfolio Images *</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Upload Portfolio Images</Label>
              <SimpleFileUpload
                onUploadComplete={handleImageUpload}
                bucket="brand-assets"
                path="portfolio"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                maxSize={10}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Upload high-quality images of your work. No individual pricing
                needed.
              </p>
            </div>

            {/* Display uploaded images */}
            {formData.images.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {formData.images.map((image, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={image}
                      alt={`Portfolio image ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleRemoveImage(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pricing & Business Info */}
        <Card>
          <CardHeader>
            <CardTitle>Business Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price_range">General Price Range</Label>
                <Input
                  id="price_range"
                  value={formData.price_range}
                  onChange={(e) =>
                    handleInputChange("price_range", e.target.value)
                  }
                  placeholder="e.g., Starting from $500 or $500 - $5,000"
                  className="border-oma-cocoa/20 focus:border-oma-plum"
                />
                        <p className="text-xs text-muted-foreground mt-1">
          Use "Starting from X" for minimum pricing, or provide a range like "500 - 5,000"
        </p>
              </div>

              <div>
                <Label htmlFor="consultation_fee">
                  Consultation Fee (Optional)
                </Label>
                <Input
                  id="consultation_fee"
                  type="number"
                  value={formData.consultation_fee}
                  onChange={(e) =>
                    handleInputChange("consultation_fee", e.target.value)
                  }
                  placeholder="e.g., 100"
                  className="border-oma-cocoa/20 focus:border-oma-plum"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Fee for initial design consultations
                </p>
              </div>
            </div>

            <div>
              <Label htmlFor="lead_time">Lead Time</Label>
              <Input
                id="lead_time"
                value={formData.lead_time}
                onChange={(e) => handleInputChange("lead_time", e.target.value)}
                placeholder="e.g., 4-6 weeks, 2-3 months"
                className="border-oma-cocoa/20 focus:border-oma-plum"
              />
            </div>

            <div>
              <Label>Specialties</Label>
              <MultiSelect
                options={tailorSpecialties}
                value={formData.specialties}
                onValueChange={(selected: string[]) =>
                  handleInputChange("specialties", selected)
                }
                placeholder="Select your specialties"
              />
            </div>
          </CardContent>
        </Card>

        {/* Additional Details */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Details (Optional)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Materials You Work With</Label>
              <MultiSelect
                options={commonMaterials}
                value={formData.materials}
                onValueChange={(selected: string[]) =>
                  handleInputChange("materials", selected)
                }
                placeholder="Select materials you commonly use"
              />
            </div>

            <div>
              <Label>Techniques You Use</Label>
              <MultiSelect
                options={commonTechniques}
                value={formData.techniques}
                onValueChange={(selected: string[]) =>
                  handleInputChange("techniques", selected)
                }
                placeholder="Select techniques you specialize in"
              />
            </div>

            <div>
              <Label htmlFor="inspiration">Design Inspiration</Label>
              <Textarea
                id="inspiration"
                value={formData.inspiration}
                onChange={(e) =>
                  handleInputChange("inspiration", e.target.value)
                }
                placeholder="What inspires your designs? (optional)"
                rows={3}
                className="border-oma-cocoa/20 focus:border-oma-plum"
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={isLoading}
            className="bg-oma-plum hover:bg-oma-plum/90 text-white"
          >
            {isLoading ? "Creating..." : "Create Portfolio"}
          </Button>
        </div>
      </form>
    </div>
  );
}
