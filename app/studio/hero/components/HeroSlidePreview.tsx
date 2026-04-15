"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LazyImage } from "@/components/ui/lazy-image";
import {
  heroSlidePreviewCtaLabel,
  type HeroSlideFormShape,
} from "@/lib/studio/heroSlideForm";

export function HeroSlidePreview({ formData }: { formData: HeroSlideFormShape }) {
  if (!formData.image) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Preview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100">
          <LazyImage
            src={formData.image}
            alt={formData.title || "Hero slide"}
            aspectRatio="video"
            className="w-full h-full"
            sizes="(max-width: 768px) 100vw, 800px"
            quality={90}
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
              {heroSlidePreviewCtaLabel(!!formData.is_editorial)}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
