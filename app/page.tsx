import type { Metadata } from "next";
import { generateSEOMetadata, SITE_DESCRIPTION } from "@/lib/seo";
import { getAllEditions } from "@/lib/data/editions";
import { getEditorialHomeBrands } from "@/lib/home/getEditorialHomeData";
import {
  getHydratedEditions,
  pickPastEditions,
  pickUpcomingEdition,
} from "@/lib/editions/hydrateEditions";
import { EditorialHero } from "./home/editorial/EditorialHero";
import { ArchiveSection } from "./home/editorial/ArchiveSection";
import { FilmSection } from "./home/editorial/FilmSection";
import { WorkedWithSection } from "./home/editorial/WorkedWithSection";
import { EditorialDecorSection } from "./home/editorial/EditorialDecorSection";
import { TwoListsSection } from "./home/editorial/TwoListsSection";

export const revalidate = 120;

export const metadata: Metadata = generateSEOMetadata({
  title: "OmaHub | Curated African Fashion & Verified Designer Editions",
  description: SITE_DESCRIPTION,
  keywords: [
    "OmaHub",
    "African fashion platform",
    "curated African designers",
    "verified fashion brands",
    "African fashion editions",
    "Lagos fashion",
    "Accra fashion",
    "Nairobi designers",
    "African luxury fashion",
    "bespoke African tailoring",
    "emerging African designers",
    "fashion pop-up events",
  ],
  url: "/",
  type: "website",
  tags: ["homepage", "African fashion", "curated designers", "editions"],
});

export default async function Home() {
  let editions: Awaited<ReturnType<typeof getHydratedEditions>> = [];
  try {
    editions = await getHydratedEditions();
  } catch (e) {
    console.error("home_archive_editions_error", e);
    editions = getAllEditions();
  }

  const upcomingEdition = pickUpcomingEdition(editions);
  const latestPastEdition = pickPastEditions(editions, 1)[0] ?? null;

  // Homepage archive shows the two latest past editions plus the upcoming
  // placeholder, three cards max, older editions live at /editions.
  const pastEditions = pickPastEditions(editions, upcomingEdition ? 2 : 3);
  const archiveEditions = upcomingEdition
    ? [...pastEditions, upcomingEdition]
    : pastEditions;

  let workedWithBrands: Awaited<ReturnType<typeof getEditorialHomeBrands>> = [];
  try {
    workedWithBrands = await getEditorialHomeBrands();
  } catch (e) {
    console.error("editorial_home_brands_error", e);
  }

  return (
    <>
      <main className="min-h-screen bg-oma-cream">
        <EditorialHero
          upcomingEdition={upcomingEdition}
          latestPastEdition={latestPastEdition}
        />
        <ArchiveSection editions={archiveEditions} />
        <FilmSection />
        <WorkedWithSection brands={workedWithBrands} />
        <EditorialDecorSection />
        <TwoListsSection />
      </main>
    </>
  );
}
