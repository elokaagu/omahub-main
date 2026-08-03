import type { Metadata } from "next";
import { generateSEOMetadata } from "@/lib/seo";
import { getAllEditions, getLatestPastEdition } from "@/lib/data/editions";
import { getAllEditionImages } from "@/lib/services/editionImagesService";
import { EditionsArchiveContent } from "./EditionsArchiveContent";

export const metadata: Metadata = generateSEOMetadata({
  title: "The Archive | OmaHub Editions",
  description:
    "Every OmaHub edition: storytelling-led pop-up events spotlighting verified African designers — from London to Lagos, Accra to Nairobi.",
  keywords: [
    "OmaHub editions",
    "African fashion events",
    "fashion pop-up archive",
    "verified African designers",
    "Lagos fashion event",
    "London fashion pop-up",
    "curated fashion editions",
  ],
  url: "/editions",
  type: "website",
  section: "Editions",
  tags: ["editions", "archive", "African fashion", "pop-up events"],
});

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

  const latestPastEdition = getLatestPastEdition();
  const heroImage = latestPastEdition
    ? coverBySlug.get(latestPastEdition.slug) || latestPastEdition.coverImage
    : undefined;

  return (
    <EditionsArchiveContent editions={editions} heroImage={heroImage} />
  );
}
