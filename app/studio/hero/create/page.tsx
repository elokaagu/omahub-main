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
import { FileUpload } from "@/components/ui/file-upload";
import {
  createHeroSlide,
  getAllHeroSlides,
  type CreateHeroSlideData,
} from "@/lib/services/heroService";
import { ArrowLeft, Upload } from "lucide-react";
import { toast } from "sonner";
import { Loading } from "@/components/ui/loading";
import { NavigationLink } from "@/components/ui/navigation-link";

export default function CreateHeroSlidePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [nextDisplayOrder, setNextDisplayOrder] = useState(1);
  const [formData, setFormData] = useState<CreateHeroSlideData>({
    image: "",
    title: "",
    subtitle: "",
    link: "",
    hero_title: "",
    is_editorial: true,
    display_order: 1,
    is_active: true,
  });

  // Check if user is super admin
  useEffect(() => {
    if (user && user.role !== "super_admin") {
      router.push("/studio");
      return;
    }
  }, [user, router]);

  // Get next display order
  useEffect(() => {
    const getNextDisplayOrder = async () => {
      try {
        const slides = await getAllHeroSlides();
        const maxOrder = Math.max(
          ...slides.map((slide) => slide.display_order),
          0
        );
        const nextOrder = maxOrder + 1;
        setNextDisplayOrder(nextOrder);
        setFormData((prev) => ({ ...prev, display_order: nextOrder }));
      } catch (error) {
        console.error("Error getting next display order:", error);
      }
    };

    if (user?.role === "super_admin") {
      getNextDisplayOrder();
    }
  }, [user]);

  const handleInputChange = (
    field: keyof CreateHeroSlideData,
    value: string | boolean | number
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleImageUpload = (url: string) => {
    setFormData((prev) => ({
      ...prev,
      image: url,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error("You must be logged in to create hero slides");
      return;
    }

    // Validation
    if (!formData.image.trim()) {
      toast.error("Hero image is required");
      return;
    }
    if (!formData.title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!formData.hero_title?.trim()) {
      toast.error("Hero title is required");
      return;
    }

    try {
      setIsLoading(true);
      console.log("Creating hero slide with data:", formData);
      console.log("User ID:", user.id);
      console.log("User role:", user.role);

      const result = await createHeroSlide(user.id, formData);
      console.log("Hero slide created successfully:", result);

      toast.success("Hero slide created successfully");
      router.push("/studio/hero");
    } catch (error) {
      console.error("Error creating hero slide:", error);

      // More detailed error handling
      if (error instanceof Error) {
        if (error.message.includes("permission")) {
          toast.error("Permission denied. Please check your admin privileges.");
        } else if (error.message.includes("network")) {
          toast.error("Network error. Please check your connection.");
        } else if (error.message.includes("validation")) {
          toast.error("Validation error. Please check your input data.");
        } else {
          toast.error(`Failed to create hero slide: ${error.message}`);
        }
      } else {
        toast.error("Failed to create hero slide. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (user?.role !== "super_admin") {
    return <Loading />;
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="flex items-center gap-4 mb-8">
        <Button asChild variant="outline" size="sm">
          <NavigationLink href="/studio/hero">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Hero Slides
          </NavigationLink>
        </Button>
        <div>
          <h1 className="text-3xl font-canela text-oma-black mb-2">
            Create Hero Slide
          </h1>
          <p className="text-oma-cocoa">
            Create a new hero slide for the homepage carousel
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
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  placeholder="e.g., Collections"
                  required
                />
                <p className="text-xs text-oma-cocoa/70 mt-1">
                  Internal title for identification
                </p>
              </div>
              <div>
                <Label htmlFor="hero_title">Hero Title *</Label>
                <Input
                  id="hero_title"
                  value={formData.hero_title}
                  onChange={(e) =>
                    handleInputChange("hero_title", e.target.value)
                  }
                  placeholder="e.g., New Season"
                  required
                />
                <p className="text-xs text-oma-cocoa/70 mt-1">
                  Large title displayed on the slide
                </p>
              </div>
            </div>

            <div>
              <Label htmlFor="subtitle">Subtitle</Label>
              <Textarea
                id="subtitle"
                value={formData.subtitle}
                onChange={(e) => handleInputChange("subtitle", e.target.value)}
                placeholder="Brief description that appears under the hero title"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="image">Hero Image *</Label>
                <FileUpload
                  onUploadComplete={handleImageUpload}
                  defaultValue={formData.image}
                  bucket="hero-images"
                  path="slides"
                  accept={{
                    "image/png": [".png"],
                    "image/jpeg": [".jpg", ".jpeg"],
                    "image/webp": [".webp"],
                  }}
                  maxSize={20}
                />
                <p className="text-xs text-oma-cocoa/70 mt-1">
                  High-resolution image (recommended: 1920x1080 or larger, max
                  20MB)
                </p>
              </div>
              <div>
                <Label htmlFor="link">Link URL</Label>
                <Input
                  id="link"
                  value={formData.link || ""}
                  onChange={(e) => handleInputChange("link", e.target.value)}
                  placeholder="/directory?category=Collections"
                />
                <p className="text-xs text-oma-cocoa/70 mt-1">
                  Where users go when they click the CTA button. Use internal
                  paths (e.g., /directory, directory?category=Collections) or
                  full URLs (e.g., https://example.com)
                </p>
                {formData.link &&
                  !formData.link.startsWith("/") &&
                  !formData.link.startsWith("http") &&
                  !formData.link.includes(".") &&
                  !formData.link.includes("?") &&
                  !formData.link.includes("#") && (
                    <p className="text-xs text-amber-600 mt-1">
                      ⚠️ Simple paths like "directory" will be automatically
                      prefixed with "/" for internal navigation
                    </p>
                  )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="display_order">Display Order</Label>
                <Input
                  id="display_order"
                  type="number"
                  min="1"
                  value={formData.display_order}
                  onChange={(e) =>
                    handleInputChange(
                      "display_order",
                      parseInt(e.target.value) || 1
                    )
                  }
                />
                <p className="text-xs text-oma-cocoa/70 mt-1">
                  Order in which this slide appears (lower numbers first)
                </p>
              </div>
              <div className="flex flex-col gap-4 pt-6">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_editorial"
                    checked={formData.is_editorial}
                    onCheckedChange={(checked) =>
                      handleInputChange("is_editorial", checked)
                    }
                  />
                  <Label htmlFor="is_editorial">Editorial style</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) =>
                      handleInputChange("is_active", checked)
                    }
                  />
                  <Label htmlFor="is_active">
                    Active (visible on homepage)
                  </Label>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Preview */}
        {formData.image && (
          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100">
                <img
                  src={formData.image}
                  alt={formData.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center">
                  {formData.hero_title && (
                    <h1 className="font-canela text-4xl md:text-6xl mb-4 tracking-tight">
                      {formData.hero_title}
                    </h1>
                  )}
                  {formData.subtitle && (
                    <p className="text-lg md:text-xl max-w-2xl mx-auto mb-8">
                      {formData.subtitle}
                    </p>
                  )}
                  <div className="bg-white text-black px-6 py-3 rounded font-medium">
                    {formData.is_editorial
                      ? "View Catalogue"
                      : "Explore Designers"}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" asChild>
            <NavigationLink href="/studio/hero">Cancel</NavigationLink>
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
            className="bg-oma-plum hover:bg-oma-plum/90"
          >
            {isLoading ? (
              <>
                <div className="h-4 w-4 mr-2 animate-spin rounded-full border border-current border-t-transparent" />
                Creating...
              </>
            ) : (
              "Create Hero Slide"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
