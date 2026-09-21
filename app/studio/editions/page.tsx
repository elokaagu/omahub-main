"use client";

import { useEffect, useState } from "react";
import { getAllEditions } from "@/lib/data/editions";
import { getAllEditionImages, type EditionImage } from "@/lib/services/editionImagesService";
import { getAllEditionLineupBrands } from "@/lib/services/editionLineupService";
import { getAllEditionContent, type EditionContentRecord } from "@/lib/services/editionContentService";
import { AuthImage } from "@/components/ui/auth-image";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { NavigationLink } from "@/components/ui/navigation-link";
import { Loading } from "@/components/ui/loading";
import { SuperAdminHeroGate } from "@/components/studio/SuperAdminGate";
import { BlurIn, blurStagger } from "@/components/studio/BlurIn";

export default function EditionsStudioPage() {
  return (
    <SuperAdminHeroGate capabilityPhrase="manage editions">
      <EditionsStudioContent />
    </SuperAdminHeroGate>
  );
}

function EditionsStudioContent() {
  const editions = getAllEditions();
  const [imagesBySlug, setImagesBySlug] = useState<Record<string, EditionImage[]> | null>(
    null
  );
  const [lineupCountBySlug, setLineupCountBySlug] = useState<Record<string, number> | null>(
    null,
  );
  const [contentBySlug, setContentBySlug] = useState<
    Record<string, EditionContentRecord> | null
  >(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [images, lineupRows, contentRows] = await Promise.all([
        getAllEditionImages(),
        getAllEditionLineupBrands(),
        getAllEditionContent(),
      ]);
      if (cancelled) return;
      const grouped: Record<string, EditionImage[]> = {};
      for (const image of images) {
        (grouped[image.edition_slug] ??= []).push(image);
      }
      const lineupCounts: Record<string, number> = {};
      for (const row of lineupRows) {
        lineupCounts[row.edition_slug] = (lineupCounts[row.edition_slug] ?? 0) + 1;
      }
      setImagesBySlug(grouped);
      setLineupCountBySlug(lineupCounts);
      setContentBySlug(
        Object.fromEntries(contentRows.map((row) => [row.edition_slug, row])),
      );
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!imagesBySlug || !lineupCountBySlug || !contentBySlug) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loading />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <BlurIn className="mb-8">
        <h1 className="text-3xl font-canela text-oma-black mb-2">Editions</h1>
        <p className="text-oma-cocoa">
          Create and edit each edition like a blog post — story, metadata, cover,
          gallery, lineup, and partners in one place.
        </p>
      </BlurIn>

      <div className="space-y-4">
        {editions.map((edition, index) => {
          const images = imagesBySlug[edition.slug] || [];
          const dynamicCover = images.find((i) => i.kind === "cover")?.image_url;
          const galleryCount = images.filter((i) => i.kind === "gallery").length;
          const lineupCount = lineupCountBySlug[edition.slug] || 0;
          const partnerCount = images.filter((i) => i.kind === "partner").length;
          const previewImage = dynamicCover || edition.coverImage;
          const saved = contentBySlug[edition.slug];
          const displayTitle = saved?.title?.trim() || edition.title;
          const displayNumber =
            saved?.edition_number?.trim() || edition.number;
          const displayDate = saved?.date_label?.trim() || edition.dateLabel;

          return (
            <BlurIn key={edition.slug} delay={blurStagger(index)}>
            <Card className="overflow-hidden">
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
                          {displayTitle}
                        </h3>
                        <Badge variant={edition.status === "past" ? "secondary" : "default"}>
                          {edition.status === "past" ? "Past" : "Upcoming"}
                        </Badge>
                        {dynamicCover && <Badge variant="outline">Custom cover</Badge>}
                      </div>
                      <p className="text-sm text-oma-cocoa">
                        Edition {displayNumber} · {displayDate}
                      </p>
                      <p className="mt-2 text-sm text-oma-cocoa">
                        {galleryCount} gallery · {lineupCount} lineup · {partnerCount}{" "}
                        {partnerCount === 1 ? "partner" : "partners"}
                      </p>
                    </div>

                    <Button
                      asChild
                      className="bg-oma-plum hover:bg-oma-plum/90 w-full sm:w-auto"
                    >
                      <NavigationLink href={`/studio/editions/${edition.slug}`}>
                        Edit edition
                      </NavigationLink>
                    </Button>
                  </div>
                </CardContent>
              </div>
            </Card>
            </BlurIn>
          );
        })}
      </div>
    </div>
  );
}
