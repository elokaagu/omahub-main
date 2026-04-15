"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useBrandOwnerAccess } from "@/lib/hooks/useBrandOwnerAccess";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, X } from "lucide-react";
import { toast } from "sonner";
import { SimpleFileUpload } from "@/components/ui/simple-file-upload";
import { MultiSelect } from "@/components/ui/multi-select";
import { getBrandsEligibleForPortfolio } from "@/lib/studio/tailorPortfolioBrands";
import type { Brand } from "@/lib/supabase";
import { AuthImage } from "@/components/ui/auth-image";

const MAX_PORTFOLIO_IMAGES = 15;
const LEAD_TIME_MAX_LEN = 200;

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

export default function CreatePortfolioPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const {
    loading: accessLoading,
    filterBrandsByOwnership,
    isAdmin,
    isBrandOwner,
  } = useBrandOwnerAccess();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBrandsLoading, setIsBrandsLoading] = useState(true);
  const [brands, setBrands] = useState<Brand[]>([]);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    brand_id: "",
    category: "",
    price_range: "",
    specialties: [] as string[],
    lead_time: "",
    consultation_fee: "",
    images: [] as string[],
    materials: [] as string[],
    techniques: [] as string[],
    inspiration: "",
  });

  useEffect(() => {
    if (authLoading || !user?.id || accessLoading) return;

    let cancelled = false;

    const run = async () => {
      setIsBrandsLoading(true);
      try {
        const eligible = await getBrandsEligibleForPortfolio();
        if (cancelled) return;
        setBrands(filterBrandsByOwnership(eligible));
      } catch (error) {
        console.error("Error fetching brands:", error);
        if (!cancelled) toast.error("Failed to load brands");
      } finally {
        if (!cancelled) setIsBrandsLoading(false);
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [user?.id, authLoading, accessLoading, filterBrandsByOwnership]);

  useEffect(() => {
    setFormData((prev) => {
      if (!prev.brand_id) {
        return prev.category === "" ? prev : { ...prev, category: "" };
      }
      const brand = brands.find((b) => b.id === prev.brand_id);
      if (!brand) return prev;
      return prev.category === brand.category ? prev : { ...prev, category: brand.category };
    });
  }, [formData.brand_id, brands]);

  const handleInputChange = (
    name: string,
    value: string | string[] | boolean
  ) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (url: string) => {
    setFormData((prev) => {
      if (prev.images.length >= MAX_PORTFOLIO_IMAGES) {
        toast.error(`You can upload at most ${MAX_PORTFOLIO_IMAGES} images`);
        return prev;
      }
      return { ...prev, images: [...prev.images, url] };
    });
  };

  const handleRemoveImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const validate = (): string | null => {
    const title = formData.title.trim();
    const description = formData.description.trim();
    if (!title) return "Please enter a portfolio title";
    if (title.length > 200) return "Title must be 200 characters or fewer";
    if (!description) return "Please enter a description";
    if (description.length < 10) return "Description should be at least 10 characters";
    if (!formData.brand_id) return "Please select a brand";
    if (!formData.category) return "Brand category is missing; pick a valid brand";
    if (formData.images.length === 0) return "Please upload at least one portfolio image";
    if (formData.images.length > MAX_PORTFOLIO_IMAGES) {
      return `Please use at most ${MAX_PORTFOLIO_IMAGES} images`;
    }

    if (formData.consultation_fee.trim() !== "") {
      const fee = Number(formData.consultation_fee);
      if (Number.isNaN(fee) || fee < 0) {
        return "Consultation fee must be a non-negative number";
      }
    }

    const lt = formData.lead_time.trim();
    if (lt.length > LEAD_TIME_MAX_LEN) {
      return `Lead time must be ${LEAD_TIME_MAX_LEN} characters or fewer`;
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const err = validate();
    if (err) {
      toast.error(err);
      return;
    }

    try {
      setIsSubmitting(true);

      const consultationFeeParsed =
        formData.consultation_fee.trim() === ""
          ? undefined
          : Number(formData.consultation_fee);

      const portfolioData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        price: 0,
        image: formData.images[0],
        images: formData.images,
        brand_id: formData.brand_id,
        category: formData.category,
        in_stock: true,
        is_custom: true,
        service_type: "portfolio" as const,
        contact_for_pricing: true,
        price_range: formData.price_range.trim() || undefined,
        specialties: formData.specialties,
        lead_time: formData.lead_time.trim() || undefined,
        consultation_fee: consultationFeeParsed,
        materials: formData.materials,
        techniques: formData.techniques,
        inspiration: formData.inspiration.trim() || undefined,
      };

      const response = await fetch("/api/studio/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(portfolioData),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(
          typeof error.error === "string" ? error.error : "Failed to create portfolio"
        );
      }

      toast.success("Portfolio created successfully!");
      router.push("/studio/portfolio");
    } catch (error) {
      console.error("Error creating portfolio:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to create portfolio"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex justify-center items-center min-h-[40vh]">
        <div className="animate-spin h-8 w-8 border-4 border-oma-plum border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <Card>
          <CardContent className="pt-6 text-center space-y-4">
            <h2 className="text-xl font-canela text-oma-plum">Sign in required</h2>
            <p className="text-muted-foreground">
              Log in to create portfolio entries for your brands.
            </p>
            <Button asChild className="bg-oma-plum hover:bg-oma-plum/90">
              <Link href="/login">Log in</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (accessLoading) {
    return (
      <div className="flex justify-center items-center min-h-[40vh]">
        <div className="animate-spin h-8 w-8 border-4 border-oma-plum border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAdmin && !isBrandOwner) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16">
        <Card>
          <CardContent className="pt-6 text-center space-y-4">
            <h2 className="text-xl font-canela text-oma-plum">Access restricted</h2>
            <p className="text-muted-foreground">
              Only brand owners and administrators can create portfolio entries.
            </p>
            <Button variant="outline" asChild>
              <Link href="/studio/portfolio">Back to portfolio</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isBrandsLoading) {
    return (
      <div className="flex justify-center items-center min-h-[40vh]">
        <div className="animate-spin h-8 w-8 border-4 border-oma-plum border-t-transparent rounded-full" />
      </div>
    );
  }

  const showForm = brands.length > 0;

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

      {!showForm ? (
        <Card>
          <CardHeader>
            <CardTitle>No tailoring brands available</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-muted-foreground">
            <p>
              Portfolio entries are tied to brands in tailoring-related categories (e.g. bridal,
              custom design). None of your brands match yet, or you have not been assigned a brand.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button asChild className="bg-oma-plum hover:bg-oma-plum/90">
                <Link href="/studio/brands">Manage brands</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/studio/brands/create">Create a brand</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
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
                  maxLength={200}
                />
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  placeholder="Describe your portfolio, your style, and what makes your work unique..."
                  rows={4}
                  className="border-oma-cocoa/20 focus:border-oma-plum"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Brand *</Label>
                  <Select
                    value={formData.brand_id || undefined}
                    onValueChange={(v) => handleInputChange("brand_id", v)}
                  >
                    <SelectTrigger className="border-oma-cocoa/20 focus:border-oma-plum">
                      <SelectValue placeholder="Select a brand" />
                    </SelectTrigger>
                    <SelectContent>
                      {brands.map((brand) => (
                        <SelectItem key={brand.id} value={brand.id}>
                          {brand.name} ({brand.category})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Category</Label>
                  <p className="text-sm text-muted-foreground mt-2 min-h-[40px] rounded-md border border-oma-cocoa/20 px-3 py-2 bg-muted/30">
                    {formData.brand_id && formData.category ? (
                      <>
                        Taken from your brand:{" "}
                        <span className="font-medium text-foreground">{formData.category}</span>
                      </>
                    ) : (
                      "Select a brand to use its category for this portfolio."
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

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
                  First image is the cover. Up to {MAX_PORTFOLIO_IMAGES} images (
                  {formData.images.length}/{MAX_PORTFOLIO_IMAGES}).
                </p>
              </div>

              {formData.images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {formData.images.map((image, index) => (
                    <div key={`${image}-${index}`} className="relative group">
                      <div className="relative w-full h-32 rounded-lg overflow-hidden bg-muted">
                        <AuthImage
                          src={image}
                          alt={`Portfolio image ${index + 1}`}
                          width={400}
                          height={256}
                          className="w-full h-32 object-cover"
                        />
                      </div>
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
                    onChange={(e) => handleInputChange("price_range", e.target.value)}
                    placeholder="e.g., £500 - £5,000"
                    className="border-oma-cocoa/20 focus:border-oma-plum"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    General range for your work (not individual items)
                  </p>
                </div>

                <div>
                  <Label htmlFor="consultation_fee">Consultation Fee (Optional)</Label>
                  <Input
                    id="consultation_fee"
                    type="number"
                    min={0}
                    step="0.01"
                    value={formData.consultation_fee}
                    onChange={(e) => handleInputChange("consultation_fee", e.target.value)}
                    placeholder="e.g., 100"
                    className="border-oma-cocoa/20 focus:border-oma-plum"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Non-negative amount for initial consultations
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
                  maxLength={LEAD_TIME_MAX_LEN}
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
                  onChange={(e) => handleInputChange("inspiration", e.target.value)}
                  placeholder="What inspires your designs? (optional)"
                  rows={3}
                  className="border-oma-cocoa/20 focus:border-oma-plum"
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-oma-plum hover:bg-oma-plum/90 text-white"
            >
              {isSubmitting ? "Creating..." : "Create Portfolio"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
