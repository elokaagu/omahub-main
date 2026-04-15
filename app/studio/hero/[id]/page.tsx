"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  getHeroSlide,
  updateHeroSlide,
  type UpdateHeroSlideData,
} from "@/lib/services/heroService";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Loading } from "@/components/ui/loading";
import { NavigationLink } from "@/components/ui/navigation-link";
import {
  validateHeroSlideForm,
  type HeroSlideFormShape,
} from "@/lib/studio/heroSlideForm";
import { HeroSlideFormFields } from "../components/HeroSlideFormFields";
import { HeroSlidePreview } from "../components/HeroSlidePreview";
import { SuperAdminHeroGate } from "../SuperAdminHeroGate";

type HeroEditLoadState =
  | { type: "loading" }
  | { type: "ready" }
  | { type: "not_found" }
  | { type: "error"; message: string };

function resolveSlideId(
  params: ReturnType<typeof useParams>
): string | undefined {
  const raw = params?.id;
  if (typeof raw === "string" && raw.trim()) return raw.trim();
  if (Array.isArray(raw) && typeof raw[0] === "string" && raw[0].trim()) {
    return raw[0].trim();
  }
  return undefined;
}

export default function EditHeroSlidePage() {
  return (
    <SuperAdminHeroGate capabilityPhrase="edit hero slides">
      <EditHeroSlideInner />
    </SuperAdminHeroGate>
  );
}

function EditHeroSlideInner() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const slideId = resolveSlideId(params);

  const [loadState, setLoadState] = useState<HeroEditLoadState>({
    type: "loading",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<UpdateHeroSlideData>({
    image: "",
    title: "",
    subtitle: "",
    link: "",
    hero_title: "",
    is_editorial: true,
    display_order: 1,
    is_active: true,
  });

  const loadHeroSlide = useCallback(async () => {
    if (!slideId) return;

    setLoadState({ type: "loading" });
    try {
      const slide = await getHeroSlide(slideId);

      if (!slide) {
        setLoadState({ type: "not_found" });
        return;
      }

      setFormData({
        image: slide.image,
        title: slide.title,
        subtitle: slide.subtitle || "",
        link: slide.link || "",
        hero_title: slide.hero_title || "",
        is_editorial: slide.is_editorial,
        display_order: slide.display_order,
        is_active: slide.is_active,
      });
      setLoadState({ type: "ready" });
    } catch (error) {
      console.error("Error fetching hero slide:", error);
      setLoadState({
        type: "error",
        message:
          error instanceof Error ? error.message : "Failed to load hero slide",
      });
    }
  }, [slideId]);

  useEffect(() => {
    if (!user || !slideId) return;
    void loadHeroSlide();
  }, [user, slideId, loadHeroSlide]);

  const handleInputChange = (
    field: keyof HeroSlideFormShape,
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

    if (!user || !slideId) {
      toast.error("Missing required information");
      return;
    }

    const validationError = validateHeroSlideForm(
      formData as HeroSlideFormShape
    );
    if (validationError) {
      toast.error(validationError);
      return;
    }

    try {
      setIsSaving(true);
      await updateHeroSlide(user.id, slideId, formData);
      toast.success("Hero slide updated successfully");
      router.push("/studio/hero");
    } catch (error) {
      console.error("Error updating hero slide:", error);
      toast.error("Failed to update hero slide");
    } finally {
      setIsSaving(false);
    }
  };

  if (!slideId) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-canela text-oma-black mb-4">
            Invalid slide link
          </h1>
          <p className="text-oma-cocoa mb-6">
            This URL is missing a valid slide id.
          </p>
          <Button asChild>
            <NavigationLink href="/studio/hero">
              Back to Hero Slides
            </NavigationLink>
          </Button>
        </div>
      </div>
    );
  }

  if (loadState.type === "loading") {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loading />
      </div>
    );
  }

  if (loadState.type === "error") {
    return (
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-canela text-oma-black">
            Couldn&apos;t load hero slide
          </h1>
          <p className="text-oma-cocoa max-w-md mx-auto">{loadState.message}</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button
              type="button"
              variant="default"
              className="bg-oma-plum hover:bg-oma-plum/90"
              onClick={() => void loadHeroSlide()}
            >
              Try again
            </Button>
            <Button asChild variant="outline">
              <NavigationLink href="/studio/hero">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Hero Slides
              </NavigationLink>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (loadState.type === "not_found") {
    return (
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-canela text-oma-black mb-4">
            Hero Slide Not Found
          </h1>
          <p className="text-oma-cocoa mb-6">
            There is no hero slide with this id, or it may have been removed.
          </p>
          <Button asChild>
            <NavigationLink href="/studio/hero">
              Back to Hero Slides
            </NavigationLink>
          </Button>
        </div>
      </div>
    );
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
            Edit Hero Slide
          </h1>
          <p className="text-oma-cocoa">
            Update the hero slide for the homepage carousel
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <HeroSlideFormFields
          formData={formData as HeroSlideFormShape}
          onFieldChange={handleInputChange}
          onImageUpload={handleImageUpload}
        />
        <HeroSlidePreview formData={formData as HeroSlideFormShape} />

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" asChild>
            <NavigationLink href="/studio/hero">Cancel</NavigationLink>
          </Button>
          <Button
            type="submit"
            disabled={isSaving}
            className="bg-oma-plum hover:bg-oma-plum/90"
          >
            {isSaving ? (
              <>
                <div className="h-4 w-4 mr-2 rounded-full border border-current border-t-transparent" />
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
