"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { NavigationLink } from "@/components/ui/navigation-link";
import {
  createHeroSlide,
  getAllHeroSlides,
  type CreateHeroSlideData,
} from "@/lib/services/heroService";
import { validateHeroSlideForm } from "@/lib/studio/heroSlideForm";
import { HeroSlideFormFields } from "../components/HeroSlideFormFields";
import { HeroSlidePreview } from "../components/HeroSlidePreview";
import { SuperAdminHeroGate } from "../SuperAdminHeroGate";

export default function CreateHeroSlidePage() {
  return (
    <SuperAdminHeroGate capabilityPhrase="create hero slides">
      <CreateHeroSlideInner />
    </SuperAdminHeroGate>
  );
}

function CreateHeroSlideInner() {
  const { user } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSeedStatus, setOrderSeedStatus] = useState<
    "idle" | "loading" | "done"
  >("idle");
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

  useEffect(() => {
    if (!user) return;

    let cancelled = false;
    setOrderSeedStatus("loading");

    (async () => {
      try {
        const slides = await getAllHeroSlides();
        if (cancelled) return;
        const maxOrder = Math.max(0, ...slides.map((s) => s.display_order));
        const nextOrder = maxOrder + 1;
        setFormData((prev) => ({ ...prev, display_order: nextOrder }));
      } catch (error) {
        console.error("Error getting next display order:", error);
        if (cancelled) return;
        toast.info(
          "Couldn’t suggest the next display order. You can set it manually (default is 1)."
        );
      } finally {
        if (!cancelled) setOrderSeedStatus("done");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

  const handleFieldChange = (
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

    const validationError = validateHeroSlideForm(formData);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    try {
      setIsSubmitting(true);
      await createHeroSlide(user.id, formData);
      toast.success("Hero slide created successfully");
      router.push("/studio/hero");
    } catch (error) {
      console.error("Error creating hero slide:", error);
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
      setIsSubmitting(false);
    }
  };

  const orderHint =
    orderSeedStatus === "loading"
      ? "Loading suggested display order…"
      : null;

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
        <HeroSlideFormFields
          formData={formData}
          onFieldChange={handleFieldChange}
          onImageUpload={handleImageUpload}
          orderSuggestionHint={orderHint}
        />
        <HeroSlidePreview formData={formData} />

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" asChild>
            <NavigationLink href="/studio/hero">Cancel</NavigationLink>
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-oma-plum hover:bg-oma-plum/90"
          >
            {isSubmitting ? (
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
