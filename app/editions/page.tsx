import type { Metadata } from "next";
import { generateSEOMetadata } from "@/lib/seo";
import { getAllEditions } from "@/lib/data/editions";
import {
  getHydratedEditions,
  pickPastEditions,
} from "@/lib/editions/hydrateEditions";
import { readPlatformSettings } from "@/lib/studio/platformSettings";
import { publicSupabaseClient } from "@/lib/supabase-public";
import { EditionsArchiveContent } from "./EditionsArchiveContent";

export const metadata: Metadata = generateSEOMetadata({
  title: "Experiences | OmaHub Editions",
  description:
    "Every OmaHub edition: storytelling-led pop-up events spotlighting verified African designers — from London to Lagos, Accra to Nairobi.",
  keywords: [
    "OmaHub editions",
    "OmaHub experiences",
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

  // Banner set in Studio > Editions; falls back to the newest past cover.
  let archiveHeroImage = "";
  try {
    const settings = await readPlatformSettings(publicSupabaseClient());
    archiveHeroImage = settings.archiveHeroImage;
  } catch (e) {
    console.error("editions_archive_hero_setting_error", e);
  }

  const latestPastEdition = pickPastEditions(editions, 1)[0] ?? null;
  const heroImage = archiveHeroImage || latestPastEdition?.coverImage;

  return (
    <EditionsArchiveContent editions={editions} heroImage={heroImage} />
  );
}
