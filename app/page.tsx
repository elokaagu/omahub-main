import { StructuredData } from "@/components/seo/StructuredData";
import { getPastEditions, getUpcomingEdition } from "@/lib/data/editions";
import { EditorialHero } from "./home/editorial/EditorialHero";
import { ArchiveSection } from "./home/editorial/ArchiveSection";
import { TwoListsSection } from "./home/editorial/TwoListsSection";

export const revalidate = 120;

export default async function Home() {
  const upcomingEdition = getUpcomingEdition();

  // Homepage archive shows the two latest past editions plus the upcoming
  // placeholder, three cards max, older editions live at /editions.
  const pastEditions = getPastEditions(upcomingEdition ? 2 : 3);
  const archiveEditions = upcomingEdition
    ? [...pastEditions, upcomingEdition]
    : pastEditions;

  return (
    <>
      <StructuredData
        type="organization"
        data={{
          name: "OmaHub",
          description:
            "Where African fashion finds its audience, storytelling-led editions spotlighting verified African designers",
          url: "https://www.oma-hub.com",
          logo: "https://www.oma-hub.com/logo.png",
        }}
      />
      <StructuredData
        type="website"
        data={{
          name: "OmaHub",
          url: "https://www.oma-hub.com",
          description:
            "Where African fashion finds its audience, editorially curated editions and a verified designer directory",
        }}
      />
      <main className="min-h-screen bg-oma-cream">
        <EditorialHero />
        <ArchiveSection editions={archiveEditions} />
        <TwoListsSection />
      </main>
    </>
  );
}
