import type { HeroSlide } from "@/lib/services/heroService";
import type { SpotlightContent } from "@/lib/services/spotlightService";
import type { CarouselItem, CategoryWithBrands } from "@/app/home/homeTypes";

/** JSON shape for `/api/home/bootstrap` and server-passed homepage props. */
export type HomeBootstrapPayload = {
  categories: CategoryWithBrands[];
  heroSlides: HeroSlide[];
  spotlightContent: SpotlightContent | null;
  dynamicFallbackItems: CarouselItem[];
  categoryImages: { collectionImage: string; tailoredImage: string };
  occasionImages: Record<string, string>;
};
