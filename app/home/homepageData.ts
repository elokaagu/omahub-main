import { getCategoriesForHomepage } from "@/lib/data/unified-categories";
import type { CarouselItem, CategoryWithBrands } from "./homeTypes";

export { devLog } from "./devLog";

export const fallbackCarouselItems: CarouselItem[] = [
  {
    id: 1,
    image: "/lovable-uploads/827fb8c0-e5da-4520-a979-6fc054eefc6e.png",
    title: "Collections",
    subtitle: "Shop for an occasion, holiday, or ready to wear piece",
    link: "/collections",
    heroTitle: "New Season",
    isEditorial: true,
    width: 1920,
    height: 1080,
  },
  {
    id: 2,
    image: "/lovable-uploads/bb152c0b-6378-419b-a0e6-eafce44631b2.png",
    title: "Tailored",
    subtitle: "Masters of craft creating perfectly fitted garments",
    link: "/tailors",
    heroTitle: "Bespoke Craft",
    isEditorial: true,
    width: 1920,
    height: 1080,
  },
];

export function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Server/client: build hero fallback carousel items from already-fetched sources. */
export function buildCarouselFallbackFromCataloguesAndTailors(
  catalogues: Array<{ image?: string | null }>,
  tailors: Array<{ image?: string | null }>
): CarouselItem[] {
  const items: CarouselItem[] = [];

  if (catalogues.length > 0) {
    const pick = catalogues[Math.floor(Math.random() * catalogues.length)];
    if (pick.image) {
      items.push({ ...fallbackCarouselItems[0], image: pick.image });
    } else {
      items.push(fallbackCarouselItems[0]);
    }
  } else {
    items.push(fallbackCarouselItems[0]);
  }

  if (tailors.length > 0) {
    const pick = tailors[Math.floor(Math.random() * tailors.length)];
    if (pick.image) {
      items.push({ ...fallbackCarouselItems[1], image: pick.image });
    } else {
      items.push(fallbackCarouselItems[1]);
    }
  } else {
    items.push(fallbackCarouselItems[1]);
  }

  return items;
}

export function pickCategoryImagesFromSources(
  catalogues: Array<{ image?: string | null }>,
  tailors: Array<{ image?: string | null }>
): { collectionImage: string; tailoredImage: string } {
  let collectionImage = "";
  let tailoredImage = "";
  if (catalogues.length > 0) {
    const pick = catalogues[Math.floor(Math.random() * catalogues.length)];
    if (pick.image) collectionImage = pick.image;
  }
  if (tailors.length > 0) {
    const pick = tailors[Math.floor(Math.random() * tailors.length)];
    if (pick.image) tailoredImage = pick.image;
  }
  return { collectionImage, tailoredImage };
}

export function buildInitialCategories(): CategoryWithBrands[] {
  return getCategoriesForHomepage().map((category) => ({
    title: category.displayName,
    image: category.homepageImage!,
    href: `/directory?category=${encodeURIComponent(category.displayName)}`,
    customCta: category.homepageCta!,
    brands: [],
  }));
}
