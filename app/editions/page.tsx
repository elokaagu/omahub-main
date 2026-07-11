import type { Metadata } from "next";
import Link from "next/link";
import { getAllEditions } from "@/lib/data/editions";
import { getAllEditionImages } from "@/lib/services/editionImagesService";
import { EditionCard } from "@/app/home/editorial/EditionCard";

export const metadata: Metadata = {
  title: "The Archive | OmaHub",
  description:
    "Every OmaHub edition: storytelling-led events spotlighting verified African designers, from London to Lagos.",
};

export const revalidate = 120;

export default async function EditionsArchivePage() {
  const staticEditions = getAllEditions();

  let adminImages: Awaited<ReturnType<typeof getAllEditionImages>> = [];
  try {
    adminImages = await getAllEditionImages();
  } catch (e) {
    console.error("editions_archive_admin_images_error", e);
  }
  const coverBySlug = new Map(
    adminImages
      .filter((i) => i.kind === "cover")
      .map((i) => [i.edition_slug, i.image_url])
  );
  const editions = staticEditions.map((edition) => ({
    ...edition,
    coverImage: coverBySlug.get(edition.slug) || edition.coverImage,
  }));

  return (
    <main className="min-h-screen bg-oma-beige">
      <section className="flex min-h-[60vh] flex-col justify-end bg-oma-plum pb-16 pt-10 text-white sm:min-h-[70vh] sm:pb-20 sm:pt-14">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="text-xs font-semibold uppercase tracking-[0.25em] text-white/50 transition-colors hover:text-oma-gold"
          >
            ← OmaHub
          </Link>
          <p className="mt-8 text-xs font-semibold uppercase tracking-[0.3em] text-oma-gold">
            OmaHub editions
          </p>
          <h1 className="mt-3 font-canela text-5xl sm:text-6xl">
            The Archive
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/75">
            Every edition is a story: the theme, the designers, the room.
            Newest first. This is what separates OmaHub from a directory.
          </p>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {editions.map((edition) => (
              <EditionCard key={edition.slug} edition={edition} />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
