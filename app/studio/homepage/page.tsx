import { redirect } from "next/navigation";
import { permissionsForProfileRole } from "@/lib/services/permissionsService";
import { getStudioSession } from "@/lib/studio/session";
import { readPlatformSettings } from "@/lib/studio/platformSettings";
import { StudioLoadError } from "@/components/studio/StudioLoadError";
import { BlurIn } from "@/components/studio/BlurIn";
import { HomepageHeroMediaCard } from "./HomepageHeroMediaCard";
import { HomepageFilmCard } from "./HomepageFilmCard";

export const dynamic = "force-dynamic";

/** Everything that controls the public homepage: the hero card and the film. */
export default async function StudioHomepagePage() {
  const { supabase, profile } = await getStudioSession();
  if (!permissionsForProfileRole(profile?.role).includes("studio.settings.manage")) {
    redirect("/studio");
  }

  let settings;
  try {
    settings = await readPlatformSettings(supabase);
  } catch (error) {
    console.error("[studio/homepage]", error);
    return (
      <StudioLoadError message="We couldn’t load the homepage settings. Please try again." />
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <BlurIn className="mb-8">
        <h1 className="mb-2 text-3xl font-canela text-gray-900">Homepage</h1>
        <p className="text-gray-600">
          The hero card beside the headline and the full-width film below the
          archive, as visitors see them on omahub.com.
        </p>
      </BlurIn>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <BlurIn delay={0.06}>
          <HomepageHeroMediaCard initialMediaUrl={settings.heroMediaUrl} />
        </BlurIn>
        <BlurIn delay={0.12}>
          <HomepageFilmCard
            initialVideoId={settings.heroVideoId}
            initialFilmUrl={settings.homepageFilmUrl}
          />
        </BlurIn>
      </div>
    </div>
  );
}
