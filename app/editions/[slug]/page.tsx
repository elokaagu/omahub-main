import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { editions, getEditionBySlug } from "@/lib/data/editions";
import { getBrandsByNames } from "@/lib/home/getEditorialHomeData";
import { getEditionImages } from "@/lib/services/editionImagesService";
import { FullWidthBrandRow } from "@/components/ui/full-width-brand-row";
import { LazyImage } from "@/components/ui/lazy-image";
import { EmailCaptureForm } from "@/app/home/editorial/EmailCaptureForm";
import { EditionVideo } from "./EditionVideo";

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
  return {
    title: `${edition.title} | OmaHub Editions`,
    description: edition.excerpt,
  };
}

export default async function EditionPage({
  params,
}: {
  params: { slug: string };
}) {
  const staticEdition = getEditionBySlug(params.slug);
  if (!staticEdition) notFound();

  let lineupBrands: Awaited<ReturnType<typeof getBrandsByNames>> = [];
  try {
    lineupBrands = await getBrandsByNames(staticEdition.brandNames);
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
  const adminGallery: NonNullable<typeof staticEdition.gallery> = adminImages
    .filter((i) => i.kind === "gallery")
    .map((i) => ({
      src: i.image_url,
      alt: i.alt_text || staticEdition.title,
    }));

  const edition = {
    ...staticEdition,
    coverImage: adminCover || staticEdition.coverImage,
    gallery: [...(staticEdition.gallery || []), ...adminGallery],
  };

  // Story photos: admin-placed images that drop in after a given paragraph
  // (display_order holds the 0-indexed paragraph they follow).
  const storyParagraphs = edition.story.split(/\n+/).map((p) => p.trim()).filter(Boolean);
  const storyPhotosByParagraph = new Map<number, typeof adminImages>();
  for (const image of adminImages) {
    if (image.kind !== "story") continue;
    const list = storyPhotosByParagraph.get(image.display_order) || [];
    list.push(image);
    storyPhotosByParagraph.set(image.display_order, list);
  }

  const partnerLogos = adminImages
    .filter((i) => i.kind === "partner")
    .sort((a, b) => a.display_order - b.display_order);

  const snapshot = [
    { label: "City", value: edition.city },
    { label: "Country", value: edition.country },
    ...(edition.venue ? [{ label: "Venue", value: edition.venue }] : []),
    { label: "Date", value: edition.dateLabel },
    ...(edition.lineupLabel
      ? [{ label: "Lineup", value: edition.lineupLabel }]
      : []),
  ];

  return (
    <main className="min-h-screen bg-oma-cream">
      {/* Edition hero */}
      <section
        className="relative flex min-h-[85vh] flex-col justify-end bg-oma-plum bg-cover bg-top pb-16 pt-10 text-white sm:min-h-screen sm:pb-20 sm:pt-14"
        style={
          edition.coverImage
            ? { backgroundImage: `url(${edition.coverImage})` }
            : undefined
        }
      >
        <div
          className="relative mx-auto w-full max-w-7xl px-4 [text-shadow:0_2px_16px_rgb(0_0_0_/_45%)] sm:px-6 lg:px-8"
        >
          <Link
            href="/editions"
            className="text-xs font-semibold uppercase tracking-[0.25em] text-white/50 transition-colors hover:text-oma-gold"
          >
            ← The Archive
          </Link>
          <p className="mt-8 text-xs font-semibold uppercase tracking-[0.3em] text-oma-gold">
            Edition {edition.number} · {edition.dateLabel}
          </p>
          <h1 className="mt-4 max-w-3xl font-canela text-5xl leading-tight sm:text-7xl">
            {edition.status === "upcoming" && !edition.themeAnnounced
              ? `Edition ${edition.number}: TBA`
              : edition.title}
          </h1>
          <p className="mt-6 text-sm uppercase tracking-[0.2em] text-white/70">
            {edition.city}
            {edition.venue ? ` · ${edition.venue}` : ""} · {edition.country}
          </p>
        </div>
      </section>

      {/* Geography & event snapshot */}
      <section className="border-b border-oma-cocoa/15 bg-oma-beige">
        <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-oma-cocoa/15 px-4 sm:px-6 md:grid-cols-5 lg:px-8">
          {snapshot.map((item) => (
            <div key={item.label} className="px-4 py-8 first:pl-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-oma-cocoa">
                {item.label}
              </p>
              <p className="mt-2 font-canela text-xl text-oma-black">
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* The story, with the event recap video alongside it */}
      <section className="bg-oma-cream py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-3 lg:gap-16">
            <div className="max-w-3xl lg:col-span-2">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-oma-cocoa">
                The story
              </p>
              {storyParagraphs.map((paragraph, i) => (
                <div key={i}>
                  <p className="mt-6 font-canela text-2xl leading-relaxed text-oma-black sm:text-3xl">
                    {paragraph}
                  </p>
                  {storyPhotosByParagraph.get(i)?.map((photo) => (
                    <div key={photo.id} className="mt-6 overflow-hidden rounded-2xl">
                      <LazyImage
                        src={photo.image_url}
                        alt={photo.alt_text || edition.title}
                        aspectRatio="landscape"
                        sizes="(max-width: 1024px) 100vw, 640px"
                        quality={85}
                      />
                    </div>
                  ))}
                </div>
              ))}
              {edition.partner && (
                <p className="mt-6 text-sm uppercase tracking-[0.2em] text-oma-cocoa">
                  In partnership with {edition.partner}
                </p>
              )}
            </div>

            {edition.videoUrl && (
              <div className="lg:col-span-1">
                <p className="mb-4 text-xs font-semibold uppercase tracking-[0.3em] text-oma-cocoa">
                  Watch the edition
                </p>
                <EditionVideo
                  videoUrl={edition.videoUrl}
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
        <section className="bg-oma-beige py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-oma-cocoa">
              In pictures
            </p>
            <h2 className="mt-3 font-canela text-3xl text-oma-black sm:text-4xl">
              Moments from the edition
            </h2>
            <div className="mt-10 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
              {edition.gallery.map((photo, i) => (
                <div
                  key={photo.src}
                  className={`group relative self-start overflow-hidden rounded-2xl ${
                    i % 2 === 1 ? "mt-6 sm:mt-10" : ""
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
                    className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-oma-black/50 text-white opacity-0 backdrop-blur-sm transition-opacity duration-200 hover:bg-oma-black/70 focus-visible:opacity-100 group-hover:opacity-100"
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

      {/* Brand lineup, in motion */}
      {lineupBrands.length > 0 && (
        <section className="bg-white py-16 sm:py-20">
          <FullWidthBrandRow
            title="The lineup"
            subtitle={`The brands that showed at ${edition.title}`}
            brands={lineupBrands}
          />
        </section>
      )}

      {/* Partners */}
      {partnerLogos.length > 0 && (
        <section className="border-t border-oma-cocoa/15 bg-oma-beige py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-oma-cocoa">
              Our partners
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-x-12 gap-y-8">
              {partnerLogos.map((partner) => (
                <div key={partner.id} className="flex items-center gap-3">
                  {/* Plain img, not LazyImage: logos need object-contain (no
                      cropping), which LazyImage doesn't expose. */}
                  <img
                    src={partner.image_url}
                    alt={partner.alt_text || "Partner"}
                    className="h-12 w-24 shrink-0 object-contain"
                  />
                  {partner.alt_text && (
                    <p className="text-sm font-medium text-oma-black">
                      {partner.alt_text}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Next-edition CTA */}
      <section className="bg-oma-plum py-16 text-white sm:py-20">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h2 className="font-canela text-3xl sm:text-4xl">
            Don&apos;t miss the next edition
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-white/70">
            Early access to drops, event previews, and exclusive edition
            content, before it goes public.
          </p>
          <div className="mt-8 flex justify-center">
            <EmailCaptureForm
              source="website"
              variant="dark"
              buttonLabel="Notify me"
            />
          </div>
        </div>
      </section>
    </main>
  );
}
