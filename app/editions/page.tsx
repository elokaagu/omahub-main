import type { Metadata } from "next";
import { getAllEditions, getLatestPastEdition } from "@/lib/data/editions";
import { getAllEditionImages } from "@/lib/services/editionImagesService";
import { EditionsArchiveContent } from "./EditionsArchiveContent";

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

  const latestPastEdition = getLatestPastEdition();
  const heroImage = latestPastEdition
    ? coverBySlug.get(latestPastEdition.slug) || latestPastEdition.coverImage
    : undefined;

  return (
    <EditionsArchiveContent editions={editions} heroImage={heroImage} />
  );
}
