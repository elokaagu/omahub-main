"use client";

import { useEffect, useState } from "react";
import { getAllEditions } from "@/lib/data/editions";
import { getAllEditionImages, type EditionImage } from "@/lib/services/editionImagesService";
import { AuthImage } from "@/components/ui/auth-image";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { NavigationLink } from "@/components/ui/navigation-link";
import { Loading } from "@/components/ui/loading";
import { SuperAdminHeroGate } from "@/app/studio/hero/SuperAdminHeroGate";

export default function EditionsPhotoManagementPage() {
  return (
    <SuperAdminHeroGate capabilityPhrase="manage edition photos">
      <EditionsPhotoManagementContent />
    </SuperAdminHeroGate>
  );
}

function EditionsPhotoManagementContent() {
  const editions = getAllEditions();
  const [imagesBySlug, setImagesBySlug] = useState<Record<string, EditionImage[]> | null>(
    null
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const images = await getAllEditionImages();
      if (cancelled) return;
      const grouped: Record<string, EditionImage[]> = {};
      for (const image of images) {
        (grouped[image.edition_slug] ??= []).push(image);
      }
      setImagesBySlug(grouped);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!imagesBySlug) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loading />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-canela text-oma-black mb-2">
          Edition Photos
        </h1>
        <p className="text-oma-cocoa">
          Add or remove the cover photo and gallery images for each edition.
          Edition copy (title, story, lineup) still lives in code.
        </p>
      </div>

      <div className="space-y-4">
        {editions.map((edition) => {
          const images = imagesBySlug[edition.slug] || [];
          const dynamicCover = images.find((i) => i.kind === "cover")?.image_url;
          const galleryCount = images.filter((i) => i.kind === "gallery").length;
          const previewImage = dynamicCover || edition.coverImage;

          return (
            <Card key={edition.slug} className="overflow-hidden">
              <div className="flex flex-col sm:flex-row">
                <div className="sm:w-48 shrink-0">
                  <div className="aspect-video sm:aspect-square relative bg-oma-plum/10">
                    {previewImage ? (
                      <AuthImage
                        src={previewImage}
                        alt={edition.title}
                        aspectRatio="square"
                        className="w-full h-full"
                        sizes="200px"
                        quality={70}
                      />
                    ) : null}
                  </div>
                </div>

                <CardContent className="flex-1 p-6">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h3 className="text-xl font-semibold text-oma-black">
                          {edition.title}
                        </h3>
                        <Badge variant={edition.status === "past" ? "secondary" : "default"}>
                          {edition.status === "past" ? "Past" : "Upcoming"}
                        </Badge>
                        {dynamicCover && <Badge variant="outline">Custom cover</Badge>}
                      </div>
                      <p className="text-sm text-oma-cocoa">
                        Edition {edition.number} · {edition.dateLabel}
                      </p>
                      <p className="mt-2 text-sm text-oma-cocoa">
                        {galleryCount} admin-added gallery{" "}
                        {galleryCount === 1 ? "photo" : "photos"}
                      </p>
                    </div>

                    <Button
                      asChild
                      className="bg-oma-plum hover:bg-oma-plum/90 w-full sm:w-auto"
                    >
                      <NavigationLink href={`/studio/editions/${edition.slug}`}>
                        Manage photos
                      </NavigationLink>
                    </Button>
                  </div>
                </CardContent>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
