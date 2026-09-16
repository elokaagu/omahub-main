import type { Metadata } from "next";
import { generateSEOMetadata } from "@/lib/seo";
import { getAllEditions } from "@/lib/data/editions";
import {
  getHydratedEditions,
  pickPastEditions,
} from "@/lib/editions/hydrateEditions";
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
  let editions: Awaited<ReturnType<typeof getHydratedEditions>> = [];
  try {
    editions = await getHydratedEditions();
  } catch (e) {
    console.error("editions_archive_editions_error", e);
    editions = getAllEditions();
  }

  const latestPastEdition = pickPastEditions(editions, 1)[0] ?? null;
  const heroImage = latestPastEdition?.coverImage;

  return (
    <EditionsArchiveContent editions={editions} heroImage={heroImage} />
  );
}
