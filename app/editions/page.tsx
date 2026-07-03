import type { Metadata } from "next";
import { getAllEditions } from "@/lib/data/editions";
import { EditionCard } from "@/app/home/editorial/EditionCard";

export const metadata: Metadata = {
  title: "The Archive | OmaHub",
  description:
    "Every OmaHub edition — storytelling-led events spotlighting verified African designers, from London to Lagos.",
};

export default function EditionsArchivePage() {
  const editions = getAllEditions();

  return (
    <main className="min-h-screen bg-oma-beige">
      <section className="bg-oma-plum py-20 text-white sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-oma-gold">
            OmaHub editions
          </p>
          <h1 className="mt-3 font-canela text-5xl sm:text-6xl">
            The Archive
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/75">
            Every edition is a story — the theme, the designers, the room.
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
