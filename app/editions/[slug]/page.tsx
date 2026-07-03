import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { editions, getEditionBySlug } from "@/lib/data/editions";
import { getBrandsByNames } from "@/lib/home/getEditorialHomeData";
import { FullWidthBrandRow } from "@/components/ui/full-width-brand-row";
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
  const edition = getEditionBySlug(params.slug);
  if (!edition) notFound();

  let lineupBrands: Awaited<ReturnType<typeof getBrandsByNames>> = [];
  try {
    lineupBrands = await getBrandsByNames(edition.brandNames);
  } catch (e) {
    console.error("edition_lineup_brands_error", e);
  }

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
        className="relative bg-oma-plum bg-cover bg-center py-20 text-white sm:py-28"
        style={
          edition.coverImage
            ? { backgroundImage: `url(${edition.coverImage})` }
            : undefined
        }
      >
        {edition.coverImage && (
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-t from-oma-plum via-oma-plum/80 to-oma-plum/40"
          />
        )}
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
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
              ? `Edition ${edition.number} — TBA`
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

      {/* Edition film */}
      {edition.videoUrl && (
        <section className="bg-oma-cream py-16 sm:py-20">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <p className="mb-6 text-xs font-semibold uppercase tracking-[0.3em] text-oma-cocoa">
              Watch the edition
            </p>
            <EditionVideo
              videoUrl={edition.videoUrl}
              thumbnailUrl={edition.videoThumbnail}
              title={edition.title}
            />
          </div>
        </section>
      )}

      {/* The story */}
      <section className="bg-oma-cream py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-oma-cocoa">
            The story
          </p>
          <p className="mt-6 font-canela text-2xl leading-relaxed text-oma-black sm:text-3xl">
            {edition.story}
          </p>
          {edition.partner && (
            <p className="mt-6 text-sm uppercase tracking-[0.2em] text-oma-cocoa">
              In partnership with {edition.partner}
            </p>
          )}
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
                  className={`overflow-hidden rounded-2xl ${
                    i % 2 === 1 ? "mt-6 sm:mt-10" : ""
                  }`}
                >
                  <img
                    src={photo.src}
                    alt={photo.alt}
                    loading="lazy"
                    className="aspect-[3/4] w-full object-cover transition-transform duration-500 hover:scale-105"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Brand lineup, in motion */}
      {lineupBrands.length > 0 ? (
        <section className="bg-white py-16 sm:py-20">
          <FullWidthBrandRow
            title="The lineup"
            subtitle={`The brands that showed at ${edition.title}`}
            brands={lineupBrands}
          />
        </section>
      ) : (
        edition.status === "past" && (
          <section className="bg-white py-16 text-center sm:py-20">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-oma-cocoa">
              The lineup
            </p>
            <p className="mx-auto mt-4 max-w-md px-4 text-sm leading-relaxed text-oma-black/70">
              The full brand lineup for this edition is being added to the
              archive.
            </p>
          </section>
        )
      )}

      {/* Next-edition CTA */}
      <section className="bg-oma-plum py-16 text-white sm:py-20">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h2 className="font-canela text-3xl sm:text-4xl">
            Don&apos;t miss the next edition
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-white/70">
            Early access to drops, event previews, and exclusive edition
            content — before it goes public.
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
