import { getAboutContent } from "@/lib/content/about";
import { getLoginHeroBrandSlides } from "@/lib/brands/getLoginHeroBrandSlides";
import { AboutPageView } from "./AboutPageView";

/** Revalidate About copy from platform_settings periodically (App Router cache). */
export const revalidate = 600;
export const dynamic = "force-dynamic";

export default async function AboutPage() {
  const content = await getAboutContent();
  const slides = await getLoginHeroBrandSlides(10);
  return (
    <AboutPageView
      aboutUs={content.aboutUs}
      ourStory={content.ourStory}
      brandSlides={slides}
    />
  );
}
