"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SimpleFileUpload } from "@/components/ui/simple-file-upload";
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
import { MultiSelect } from "@/components/ui/multi-select";
import { ArrowLeft, Save, Globe, Instagram } from "lucide-react";
import Link from "next/link";
import {
  formatPriceRange,
  formatNumberWithCommas,
} from "@/lib/utils/priceFormatter";
import { LazyImage } from "@/components/ui/lazy-image";
import { getAllCategoryNames } from "@/lib/data/unified-categories";

// Brand categories - now using unified categories (same as product)
const CATEGORIES = getAllCategoryNames();

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

// Generate founding year options from current year backwards to 1950
const FOUNDING_YEARS = Array.from(
  { length: new Date().getFullYear() - 1950 + 1 },
  (_, i) => (new Date().getFullYear() - i).toString()
);

// Character limits
const SHORT_DESCRIPTION_LIMIT = 150;
const BRAND_NAME_LIMIT = 50; // Add brand name character limit

export default function CreateBrandPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    long_description: "",
    location: "",
    price_range: "",
    price_min: "",
    price_max: "",
    currency: "NGN", // Default to Nigerian Naira
    categories: [] as string[],
    image: "",
    is_verified: false,
    website: "",
    instagram: "",
    whatsapp: "",
    contact_email: "",
    founded_year: "",
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    // Handle character limit for brand name
    if (name === "name" && value.length > BRAND_NAME_LIMIT) {
      return; // Don't update if exceeding limit
    }

    // Handle character limit for short description
    if (name === "description" && value.length > SHORT_DESCRIPTION_LIMIT) {
      return; // Don't update if exceeding limit
    }

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

  const handleCategoriesChange = (categories: string[]) => {
    setFormData({
      ...formData,
      categories,
    });
  };

  const handleImageUpload = (url: string) => {
    console.log("🖼️ Image upload completed, updating form state:", url);
    setFormData((prev) => ({
      ...prev,
      image: url,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Debug logging
    console.log("🔍 Brand Creation Debug:", {
      hasUser: !!user,
      userRole: user?.role,
      userEmail: user?.email,
      formData: {
        name: formData.name,
        description: formData.description,
        categories: formData.categories,
        location: formData.location,
        image: formData.image,
      },
    });

    // Check if user is authenticated
    if (!user) {
      toast.error("You must be logged in to create a brand");
      return;
    }

    // Validate session before proceeding
    try {
      const sessionCheck = await fetch("/api/auth/validate");
      if (!sessionCheck.ok) {
        toast.error(
          "Your session has expired. Please refresh the page and sign in again."
        );
        setTimeout(() => {
          window.location.reload();
        }, 2000);
        return;
      }
    } catch (sessionError) {
      console.error("Session validation failed:", sessionError);
      toast.error(
        "Unable to verify your session. Please refresh the page and try again."
      );
      return;
    }

    // Validation
    if (!formData.name) {
      toast.error("Brand name is required");
      return;
    }

    if (!formData.description) {
      toast.error("Brand description is required");
      return;
    }

    if (!formData.categories.length) {
      toast.error("At least one category is required");
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

    if (!formData.contact_email) {
      toast.error("Contact email is required");
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.contact_email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    // Format price range if both min and max are provided
    let priceRange = "";
    if (formData.price_min && formData.price_max) {
      const currency = CURRENCIES.find((c) => c.code === formData.currency);
      const symbol = currency?.symbol || "$";
      priceRange = formatPriceRange(
        formData.price_min,
        formData.price_max,
        symbol
      );
    }

    const payload = {
      name: formData.name,
      description: formData.description,
      long_description: formData.long_description || formData.description,
      location: formData.location,
      price_range: priceRange || "Contact for pricing",
      category: formData.categories[0],
      categories: formData.categories,
      image: formData.image,
      is_verified: false,
      website: formData.website || undefined,
      instagram: formData.instagram || undefined,
      whatsapp: formData.whatsapp || undefined,
      contact_email: formData.contact_email,
      founded_year: formData.founded_year || undefined,
    };

    console.log("📤 Sending brand creation payload:", payload);

    setSubmitting(true);
    try {
      const response = await fetch("/api/studio/brands", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      console.log("📥 API Response:", { status: response.status, data });

      if (!response.ok) {
        // Handle specific error cases
        if (response.status === 401) {
          toast.error(
            "Your session has expired. Please refresh the page and sign in again."
          );
          // Optionally redirect to login or refresh page
          setTimeout(() => {
            window.location.reload();
          }, 2000);
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
      console.error("❌ Error creating brand:", error);

      // Show more specific error messages
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

  // Calculate remaining characters for short description
  const remainingChars = SHORT_DESCRIPTION_LIMIT - formData.description.length;

  // Calculate remaining characters for brand name
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

      {/* Debug Info in Development */}
      {process.env.NODE_ENV === "development" && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm">
          <p className="font-semibold text-blue-800 mb-2">
            🔍 Debug Information:
          </p>
          <div className="space-y-1 text-blue-700">
            <p>• User Authenticated: {user ? "✅ Yes" : "❌ No"}</p>
            {user && (
              <>
                <p>• User Email: {user.email}</p>
                <p>• User Role: {user.role}</p>
                <p>• User ID: {user.id}</p>
              </>
            )}
            <p>
              • Form Valid:{" "}
              {formData.name &&
              formData.description &&
              formData.categories.length > 0 &&
              formData.location &&
              formData.image &&
              formData.contact_email
                ? "✅ Yes"
                : "❌ No"}
            </p>
            <p>
              • Missing Fields:{" "}
              {[
                !formData.name && "Name",
                !formData.description && "Description",
                !formData.categories.length && "Categories",
                !formData.location && "Location",
                !formData.image && "Image",
                !formData.contact_email && "Contact Email",
              ]
                .filter(Boolean)
                .join(", ") || "None"}
            </p>
          </div>
        </div>
      )}

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
                    <Label htmlFor="categories">Categories *</Label>
                    <MultiSelect
                      options={CATEGORIES}
                      value={formData.categories}
                      onValueChange={handleCategoriesChange}
                      placeholder="Select categories"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="price_range">Price Range</Label>
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
                          {CURRENCIES.map((currency) => (
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
                            CURRENCIES.find((c) => c.code === formData.currency)
                              ?.symbol || "$"
                          )}
                        </>
                      ) : (
                        "Enter minimum and maximum prices to see preview"
                      )}
                    </p>
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
                    <Label htmlFor="contact_email">Contact Email *</Label>
                    <Input
                      id="contact_email"
                      name="contact_email"
                      type="email"
                      value={formData.contact_email}
                      onChange={handleInputChange}
                      placeholder="hello@brand.com"
                      required
                    />
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
                />
              </CardContent>
              <CardFooter>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={submitting}
                  onClick={handleSubmit}
                >
                  {submitting ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-r-transparent" />
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
