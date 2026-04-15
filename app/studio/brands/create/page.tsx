"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
import { ArrowLeft, Save, Globe, Instagram } from "lucide-react";
import Link from "next/link";
import { SimpleFileUpload } from "@/components/ui/simple-file-upload";
import { VideoUpload } from "@/components/ui/video-upload";
import { MultiSelect } from "@/components/ui/multi-select";
import { formatPriceRange } from "@/lib/utils/priceFormatter";
import { formatBrandDescription } from "@/lib/utils/textFormatter";
import {
  STUDIO_CURRENCIES_FOR_PRICE_SELECT,
  SHORT_DESCRIPTION_LIMIT,
  BRAND_NAME_LIMIT,
  getStudioBrandCategoryNames,
  getFoundingYearOptions,
} from "@/lib/brands/studioBrandFormConstants";
import {
  createBrandFormSchema,
  firstCreateBrandValidationMessage,
} from "@/lib/validation/createBrandFormSchema";
import { brandFormDevLog } from "../brandFormDevLog";

const CATEGORIES = getStudioBrandCategoryNames();
const FOUNDING_YEARS = getFoundingYearOptions();

type CreateBrandFormState = {
  name: string;
  description: string;
  long_description: string;
  location: string;
  price_min: string;
  price_max: string;
  contact_for_pricing: boolean;
  currency: string;
  categories: string[];
  image: string;
  website: string;
  instagram: string;
  whatsapp: string;
  contact_email: string;
  founded_year: string;
  video_url: string;
  video_thumbnail: string;
};

const initialFormState = (): CreateBrandFormState => ({
  name: "",
  description: "",
  long_description: "",
  location: "",
  price_min: "",
  price_max: "",
  contact_for_pricing: false,
  currency: "USD",
  categories: [],
  image: "",
  website: "",
  instagram: "",
  whatsapp: "",
  contact_email: "",
  founded_year: "",
  video_url: "",
  video_thumbnail: "",
});

export default function CreateBrandPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<CreateBrandFormState>(initialFormState);

  if (authLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="rounded-full h-12 w-12 border-b-2 border-oma-plum mx-auto mb-4" />
            <p className="text-gray-600">Loading brand creation form...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            Authentication Required
          </h1>
          <p className="text-gray-600 mb-4">
            You must be logged in to create a brand.
          </p>
          <Button asChild>
            <Link href="/login">Go to Login</Link>
          </Button>
        </div>
      </div>
    );
  }

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    if (name === "name" && value.length > BRAND_NAME_LIMIT) {
      return;
    }
    if (name === "description" && value.length > SHORT_DESCRIPTION_LIMIT) {
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCategoriesChange = (categories: string[]) => {
    setFormData((prev) => ({ ...prev, categories }));
  };

  const handleImageUpload = (url: string) => {
    brandFormDevLog("Image upload completed:", url);
    setFormData((prev) => ({ ...prev, image: url }));
  };

  const handleVideoUpload = (url: string) => {
    setFormData((prev) => ({ ...prev, video_url: url }));
  };

  const handleVideoThumbnailUpload = (url: string) => {
    setFormData((prev) => ({ ...prev, video_thumbnail: url }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error("You must be logged in to create a brand");
      return;
    }

    const parsed = createBrandFormSchema.safeParse(formData);
    if (!parsed.success) {
      toast.error(firstCreateBrandValidationMessage(parsed));
      return;
    }

    const d = parsed.data;

    let priceRange = "";
    if (d.contact_for_pricing) {
      priceRange = "explore brand for prices";
    } else {
      const currencyRow = STUDIO_CURRENCIES_FOR_PRICE_SELECT.find(
        (c) => c.code === d.currency
      );
      const symbol = currencyRow?.symbol || "$";
      priceRange = formatPriceRange(d.price_min, d.price_max, symbol);
    }

    const payload = {
      name: d.name,
      description: formatBrandDescription(d.description),
      long_description: formatBrandDescription(
        d.long_description.trim() || d.description
      ),
      location: d.location,
      price_range: priceRange || "explore brand for prices",
      currency: d.currency,
      category: d.categories[0],
      categories: d.categories,
      image: d.image,
      is_verified: false,
      website: d.website.trim() || undefined,
      instagram: d.instagram.trim() || undefined,
      whatsapp: d.whatsapp.trim() || undefined,
      contact_email: d.contact_email.trim() || undefined,
      founded_year: d.founded_year.trim() || undefined,
      video_url: d.video_url.trim() || undefined,
      video_thumbnail: d.video_thumbnail.trim() || undefined,
    };

    brandFormDevLog("Brand creation payload:", payload);

    setSubmitting(true);
    try {
      const response = await fetch("/api/studio/brands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      brandFormDevLog("Create brand API response:", response.status, data);

      if (!response.ok) {
        if (response.status === 401) {
          toast.error(
            "Your session has expired. Please refresh the page and sign in again."
          );
          setTimeout(() => window.location.reload(), 2000);
          return;
        }
        if (response.status === 403) {
          toast.error(
            "You don't have permission to create brands. Contact an administrator."
          );
          return;
        }
        throw new Error(data.error || "Failed to create brand");
      }

      toast.success("Brand created successfully!");
      router.push(`/studio/brands/${data.brand.id}`);
    } catch (error) {
      console.error("Error creating brand:", error);
      if (error instanceof Error) {
        if (error.message.includes("fetch")) {
          toast.error(
            "Network error. Please check your connection and try again."
          );
        } else {
          toast.error(error.message);
        }
      } else {
        toast.error("Failed to create brand");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const remainingChars = SHORT_DESCRIPTION_LIMIT - formData.description.length;
  const remainingNameChars = BRAND_NAME_LIMIT - formData.name.length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
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
                  <div className="flex items-center justify-between">
                    <Label htmlFor="name">Brand Name *</Label>
                    <span
                      className={`text-sm ${remainingNameChars < 10 ? "text-red-500" : "text-muted-foreground"}`}
                    >
                      {remainingNameChars} characters remaining
                    </span>
                  </div>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g. Adire Designs"
                    required
                    className={remainingNameChars < 0 ? "border-red-500" : ""}
                  />
                  <p className="text-xs text-muted-foreground">
                    Keep it concise and memorable (max 50 characters)
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="description">Short Description *</Label>
                    <span
                      className={`text-sm ${remainingChars < 20 ? "text-red-500" : "text-muted-foreground"}`}
                    >
                      {remainingChars} characters remaining
                    </span>
                  </div>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="A brief description of the brand (max 150 characters)"
                    required
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
                        value={formData.long_description}
                        onChange={handleInputChange}
                        placeholder="Detailed description of the brand, its history, values, etc."
                        className="min-h-[200px]"
                      />
                      <div className="text-xs text-muted-foreground mt-1">
                        💡 Tip: Contractions (isn&apos;t, it&apos;s, don&apos;t)
                        will be automatically converted to formal language.
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">
                        Live Preview
                      </Label>
                      <div className="min-h-[200px] p-4 bg-gray-50 rounded-md border border-gray-200">
                        {formData.long_description ? (
                          <div className="text-sm text-gray-700 whitespace-pre-wrap">
                            {formatBrandDescription(formData.long_description)}
                          </div>
                        ) : (
                          <div className="text-sm text-gray-400 italic">
                            Start typing to see the formatted preview...
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        This shows how your description will appear on the
                        frontend
                      </div>
                    </div>
                  </div>
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
                    <Label htmlFor="categories">Categories *</Label>
                    <MultiSelect
                      options={CATEGORIES}
                      value={formData.categories}
                      onValueChange={handleCategoriesChange}
                      placeholder="Select categories"
                    />
                    <p className="text-xs text-muted-foreground">
                      Select one or more categories that best describe your
                      brand
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Pricing</Label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      <Select
                        value={formData.currency}
                        onValueChange={(value) =>
                          handleSelectChange("currency", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Currency" />
                        </SelectTrigger>
                        <SelectContent>
                          {STUDIO_CURRENCIES_FOR_PRICE_SELECT.map((currency) => (
                            <SelectItem
                              key={currency.code}
                              value={currency.code}
                            >
                              {currency.symbol} - {currency.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Input
                        name="price_min"
                        value={formData.price_min}
                        onChange={handleInputChange}
                        placeholder="Min price (e.g. 15000)"
                        type="number"
                      />

                      <Input
                        name="price_max"
                        value={formData.price_max}
                        onChange={handleInputChange}
                        placeholder="Max price (e.g. 120000)"
                        type="number"
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {formData.price_min &&
                      formData.price_max &&
                      formData.currency ? (
                        <>
                          Preview:{" "}
                          {formatPriceRange(
                            formData.price_min,
                            formData.price_max,
                            STUDIO_CURRENCIES_FOR_PRICE_SELECT.find(
                              (c) => c.code === formData.currency
                            )?.symbol || "$"
                          )}
                        </>
                      ) : (
                        "Enter minimum and maximum prices to see preview"
                      )}
                    </p>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="contact_for_pricing"
                        checked={formData.contact_for_pricing}
                        onCheckedChange={(checked) =>
                          setFormData((prev) => ({
                            ...prev,
                            contact_for_pricing: checked === true,
                          }))
                        }
                      />
                      <Label
                        htmlFor="contact_for_pricing"
                        className="text-sm font-normal cursor-pointer"
                      >
                        explore brand for prices (if you prefer not to show
                        specific prices)
                      </Label>
                    </div>
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <div className="flex items-center rounded-md border border-input ring-offset-background">
                      <div className="flex items-center justify-center h-9 w-9 border-r">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <Input
                        id="website"
                        name="website"
                        value={formData.website}
                        onChange={handleInputChange}
                        placeholder="https://example.com"
                        className="border-0"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="instagram">Instagram</Label>
                    <div className="flex items-center rounded-md border border-input ring-offset-background">
                      <div className="flex items-center justify-center h-9 w-9 border-r">
                        <Instagram className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <Input
                        id="instagram"
                        name="instagram"
                        value={formData.instagram}
                        onChange={handleInputChange}
                        placeholder="@username"
                        className="border-0"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="whatsapp">WhatsApp</Label>
                    <Input
                      id="whatsapp"
                      name="whatsapp"
                      value={formData.whatsapp}
                      onChange={handleInputChange}
                      placeholder="+234 123 456 7890"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contact_email">Contact Email</Label>
                    <Input
                      id="contact_email"
                      name="contact_email"
                      type="email"
                      value={formData.contact_email}
                      onChange={handleInputChange}
                      placeholder="hello@brand.com"
                    />
                    <p className="text-xs text-muted-foreground">
                      This email will receive notifications when customers
                      contact you. If left empty, inquiries will be sent to
                      info@oma-hub.com
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="founded_year">Founded Year</Label>
                  <Select
                    value={formData.founded_year}
                    onValueChange={(value) =>
                      handleSelectChange("founded_year", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select founding year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Not specified</SelectItem>
                      {FOUNDING_YEARS.map((year) => (
                        <SelectItem key={year} value={year}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>Brand Image</CardTitle>
                <CardDescription>
                  Upload a logo or representative image
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SimpleFileUpload
                  onUploadComplete={handleImageUpload}
                  defaultValue={formData.image}
                  bucket="brand-assets"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  maxSize={5}
                  imageType="brand"
                  imageRole="cover"
                />
                <div className="mt-6 space-y-4">
                  <Label>Brand Video (optional)</Label>
                  <VideoUpload
                    onUploadComplete={handleVideoUpload}
                    defaultValue={formData.video_url}
                    bucket="product-videos"
                    path="brands"
                    accept="video/mp4,video/webm,video/quicktime"
                    maxSize={50}
                  />
                  <Label className="mt-4">Video Thumbnail (optional)</Label>
                  <SimpleFileUpload
                    onUploadComplete={handleVideoThumbnailUpload}
                    defaultValue={formData.video_thumbnail}
                    bucket="brand-assets"
                    path="thumbnails"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    maxSize={5}
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={submitting}
                >
                  {submitting ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 rounded-full border-2 border-r-transparent" />
                      Creating...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Save className="h-4 w-4" />
                      Create Brand
                    </span>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
