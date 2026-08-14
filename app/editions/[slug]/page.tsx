import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { editions, getEditionBySlug } from "@/lib/data/editions";
import { getBrandsByIds, getBrandsByNames } from "@/lib/home/getEditorialHomeData";
import { getEditionImages } from "@/lib/services/editionImagesService";
import { getEditionLineup } from "@/lib/services/editionLineupService";
import {
  getEditionContent,
  mergeEditionWithContent,
} from "@/lib/services/editionContentService";
import {
  generateEditionEventStructuredData,
  generateSEOMetadata,
  optimizeMetaDescription,
} from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  getStoryParagraphs,
  groupInlineStoryPhotos,
} from "@/lib/editions/storyContent";
import { hasRichStoryHtml, mergeLegacyStoryPhotosIntoHtml } from "@/lib/editions/storyHtml";
import { FullWidthBrandRow } from "@/components/ui/full-width-brand-row";
import { LazyImage } from "@/components/ui/lazy-image";
import { EmailCaptureForm } from "@/app/home/editorial/EmailCaptureForm";
import { EditionVideo } from "./EditionVideo";
import { EditionHero } from "./EditionHero";
import { EditionInlinePhoto } from "./EditionInlinePhoto";
import { EditionStoryBody } from "./EditionStoryBody";
import { EditionPartnersSection } from "./EditionPartnersSection";
import { hasEditionVideo } from "@/lib/editions/editionVideoUrl";
import { cn } from "@/lib/utils";

export const revalidate = 120;

export function generateStaticParams() {
  return editions.map((edition) => ({ slug: edition.slug }));
}

export function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Metadata {
  const edition = getEditionBySlug(params.slug);
  if (!edition) return { title: "Edition not found | OmaHub" };

  const geoLabel = [edition.city, edition.country].filter(Boolean).join(", ");

  return generateSEOMetadata({
    title: `${edition.title} | OmaHub Edition ${edition.number}`,
    description: optimizeMetaDescription(
      edition.excerpt ||
        `OmaHub Edition ${edition.number} in ${geoLabel} — verified African designers, editorial storytelling, and the full brand lineup.`,
    ),
    keywords: [
      "OmaHub edition",
      edition.title.toLowerCase(),
      edition.city.toLowerCase(),
      edition.country.toLowerCase(),
      "African fashion event",
      "verified African designers",
      "fashion pop-up",
      "curated fashion",
    ],
    url: `/editions/${params.slug}`,
    type: "article",
    image: edition.coverImage || "/OmaHubBanner.png",
    section: "Editions",
    tags: [edition.city, edition.country, "African fashion", "OmaHub editions"],
  });
}

export default async function EditionPage({
  params,
}: {
  params: { slug: string };
}) {
  const staticEdition = getEditionBySlug(params.slug);
  if (!staticEdition) notFound();

  let editionContent = null;
  try {
    editionContent = await getEditionContent(params.slug);
  } catch (e) {
    console.error("edition_content_error", e);
  }

  const mergedEdition = mergeEditionWithContent(staticEdition, editionContent);
  const richStoryHtml = hasRichStoryHtml(mergedEdition.storyHtml)
    ? mergedEdition.storyHtml!
    : null;

  let lineupBrands: Awaited<ReturnType<typeof getBrandsByIds>> = [];
  try {
    const lineupEntries = await getEditionLineup(params.slug);
    if (lineupEntries.length > 0) {
      lineupBrands = await getBrandsByIds(
        lineupEntries.map((entry) => entry.brand_id),
      );
    } else if (staticEdition.brandNames.length > 0) {
      lineupBrands = await getBrandsByNames(staticEdition.brandNames);
    }
  } catch (e) {
    console.error("edition_lineup_brands_error", e);
  }

  // Admin-managed photos (Studio > Edition Photos) overlay the codebase's
  // seed data: a new cover replaces the static one, gallery photos append.
  let adminImages: Awaited<ReturnType<typeof getEditionImages>> = [];
  try {
    adminImages = await getEditionImages(params.slug);
  } catch (e) {
    console.error("edition_admin_images_error", e);
  }
  const adminCover = adminImages.find((i) => i.kind === "cover")?.image_url;
  const adminVideo = adminImages.find((i) => i.kind === "video");
  const adminGallery: NonNullable<typeof staticEdition.gallery> = adminImages
    .filter((i) => i.kind === "gallery")
    .map((i) => ({
      src: i.image_url,
      alt: i.alt_text || staticEdition.title,
    }));

  const edition = {
    ...mergedEdition,
    coverImage: adminCover || mergedEdition.coverImage,
    videoUrl: adminVideo?.image_url || mergedEdition.videoUrl,
    videoThumbnail: adminVideo?.alt_text || mergedEdition.videoThumbnail,
    gallery: [...(mergedEdition.gallery || []), ...adminGallery],
  };

  const storyPhotos = adminImages.filter((image) => image.kind === "story");
  const displayStoryHtml = richStoryHtml
    ? mergeLegacyStoryPhotosIntoHtml(richStoryHtml, storyPhotos)
    : null;

  // Legacy plain-text story with paragraph-indexed photos (pre–rich editor).
  const storyParagraphs = displayStoryHtml
    ? []
    : getStoryParagraphs(edition.story);
  const inlineStoryPhotos = displayStoryHtml
    ? new Map<number, never[]>()
    : groupInlineStoryPhotos(adminImages);

  const partnerLogos = adminImages
    .filter((i) => i.kind === "partner")
    .sort((a, b) => a.display_order - b.display_order);

  // Video position: display_order doubles as a left/right flag on the
  // video's own row (1 = left, 0/default = right), set from Studio.
  const videoOnLeft = adminVideo?.display_order === 1;

  const snapshot = [
    { label: "City", value: edition.city },
    { label: "Country", value: edition.country },
    ...(edition.venue ? [{ label: "Venue", value: edition.venue }] : []),
    { label: "Date", value: edition.dateLabel },
    ...(edition.lineupLabel
      ? [{ label: "Lineup", value: edition.lineupLabel }]
      : []),
  ];

  const hasStoryVideo = hasEditionVideo(edition.videoUrl);

  return (
    <>
      <JsonLd
        data={generateEditionEventStructuredData({
          slug: edition.slug,
          title: edition.title,
          description: edition.excerpt,
          startDate: edition.sortDate,
          city: edition.city,
          country: edition.country,
          venue: edition.venue,
          image: edition.coverImage,
          status: edition.status,
        })}
      />
      <main className="min-h-screen bg-oma-cream">
      <EditionHero edition={edition} coverImage={edition.coverImage} />

      {/* Geography & event snapshot */}
      <section className="border-b border-oma-cocoa/15 bg-oma-beige">
        <div className="mx-auto grid max-w-7xl grid-cols-1 divide-y divide-oma-cocoa/15 sm:grid-cols-2 sm:divide-x sm:divide-y-0 md:grid-cols-5">
          {snapshot.map((item) => (
            <div
              key={item.label}
              className="px-4 py-6 sm:px-5 sm:py-8 md:px-4 md:first:pl-0 lg:px-8"
            >
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-oma-cocoa sm:text-[11px] sm:tracking-[0.25em]">
                {item.label}
              </p>
              <p className="mt-1.5 font-canela text-lg text-oma-black sm:mt-2 sm:text-xl">
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* The story, with optional recap video in the sidebar */}
      <section className="bg-oma-cream py-12 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div
            className={cn(
              "grid gap-8 sm:gap-10 lg:gap-16",
              hasStoryVideo &&
                "lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:items-start",
            )}
          >
            <div
              className={cn(
                !hasStoryVideo && "max-w-3xl",
                hasStoryVideo && videoOnLeft && "lg:order-2",
              )}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-oma-cocoa">
                The story
              </p>

              {displayStoryHtml ? (
                <EditionStoryBody storyHtml={displayStoryHtml} />
              ) : (
                <>
                  {inlineStoryPhotos.get(-1)?.map((photo) => (
                    <EditionInlinePhoto
                      key={photo.id}
                      src={photo.image_url}
                      alt={photo.alt_text || edition.title}
                    />
                  ))}

                  {storyParagraphs.map((paragraph, index) => (
                    <div key={index}>
                      <p className="mt-5 font-canela text-xl leading-relaxed text-oma-black sm:mt-6 sm:text-2xl lg:text-3xl">
                        {paragraph}
                      </p>
                      {inlineStoryPhotos.get(index)?.map((photo) => (
                        <EditionInlinePhoto
                          key={photo.id}
                          src={photo.image_url}
                          alt={photo.alt_text || edition.title}
                        />
                      ))}
                    </div>
                  ))}
                </>
              )}
            </div>

            {hasStoryVideo && (
              <div
                className={cn(
                  "lg:sticky lg:top-24 lg:self-start",
                  videoOnLeft && "lg:order-1",
                )}
              >
                <p className="mb-4 text-xs font-semibold uppercase tracking-[0.3em] text-oma-cocoa">
                  Watch the edition
                </p>
                <EditionVideo
                  videoUrl={edition.videoUrl!}
                  thumbnailUrl={edition.videoThumbnail}
                  title={edition.title}
                />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Event gallery */}
      {edition.gallery && edition.gallery.length > 0 && (
        <section className="bg-oma-beige py-12 sm:py-16 lg:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-oma-cocoa">
              In pictures
            </p>
            <h2 className="mt-3 font-canela text-3xl text-oma-black sm:text-4xl">
              Moments from the edition
            </h2>
            <div className="mt-10 grid grid-cols-2 gap-3 sm:mt-10 sm:gap-6 lg:grid-cols-4">
              {edition.gallery.map((photo, i) => (
                <div
                  key={photo.src}
                  className={`group relative self-start overflow-hidden rounded-2xl ${
                    i % 2 === 1 ? "sm:mt-10" : ""
                  }`}
                >
                  <LazyImage
                    src={photo.src}
                    alt={photo.alt}
                    aspectRatio="portrait"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    quality={80}
                  />
                  <a
                    href={photo.downloadSrc || photo.src}
                    download
                    aria-label={`Download original photo: ${photo.alt}`}
                    title="Download original"
                    className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-oma-black/50 text-white backdrop-blur-sm transition-opacity duration-200 hover:bg-oma-black/70 focus-visible:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-4 w-4"
                      aria-hidden
                    >
                      <path d="M12 3v12" />
                      <path d="M7 10l5 5 5-5" />
                      <path d="M5 21h14" />
                    </svg>
                  </a>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Brand lineup — brands that showed at this edition */}
      {lineupBrands.length > 0 && (
        <section className="border-t border-oma-cocoa/10 bg-white py-12 sm:py-16 lg:py-20">
          <FullWidthBrandRow
            title="The lineup"
            subtitle={
              edition.lineupLabel
                ? `${edition.lineupLabel} from ${edition.title}`
                : `The brands that showed at ${edition.title}`
            }
            brands={lineupBrands}
          />
        </section>
      )}

      {/* Partners — always the last content block before the CTA */}
      <EditionPartnersSection
        partnerLogos={partnerLogos}
        staticPartnerName={edition.partner}
      />

      {/* Next-edition CTA */}
      <section className="bg-oma-plum py-12 text-white sm:py-20">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h2 className="font-canela text-2xl sm:text-4xl">
            Don&apos;t miss the next edition
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-white/70 sm:mt-4">
            Early access to drops, event previews, and exclusive edition
            content, before it goes public.
          </p>
          <div className="mt-6 flex justify-center sm:mt-8">
            <EmailCaptureForm
              source="website"
              variant="dark"
              buttonLabel="Notify me"
              className="w-full"
            />
          </div>
        </div>
      </section>
    </main>
    </>
  );
}
