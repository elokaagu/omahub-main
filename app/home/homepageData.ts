import { getCollectionsWithBrands } from "@/lib/services/collectionService";
import { getTailorsWithBrands } from "@/lib/services/tailorService";
import { getCategoriesForHomepage } from "@/lib/data/unified-categories";
import type { CarouselItem, CategoryWithBrands } from "./homeTypes";
import { devLog } from "./devLog";

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

export async function generateDynamicFallbackItems(): Promise<CarouselItem[]> {
  try {
    const [catalogues, tailors] = await Promise.all([
      getCollectionsWithBrands(),
      getTailorsWithBrands(),
    ]);

    const items: CarouselItem[] = [];

    if (catalogues.length > 0) {
      const randomCatalogue =
        catalogues[Math.floor(Math.random() * catalogues.length)];
      items.push({
        id: 1,
        image: randomCatalogue.image,
        title: "Collections",
        subtitle: "Shop for an occasion, holiday, or ready to wear piece",
        link: "/collections",
        heroTitle: "New Season",
        isEditorial: true,
        width: 1920,
        height: 1080,
      });
    } else {
      items.push(fallbackCarouselItems[0]);
    }

    if (tailors.length > 0) {
      const randomTailor = tailors[Math.floor(Math.random() * tailors.length)];
      items.push({
        id: 2,
        image: randomTailor.image,
        title: "Tailored",
        subtitle: "Masters of craft creating perfectly fitted garments",
        link: "/tailors",
        heroTitle: "Bespoke Craft",
        isEditorial: true,
        width: 1920,
        height: 1080,
      });
    } else {
      items.push(fallbackCarouselItems[1]);
    }

    return items;
  } catch (error) {
    console.error("Error generating dynamic fallback items:", error);
    return fallbackCarouselItems;
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("Timeout")), ms);
    promise.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      }
    );
  });
}

export async function generateDynamicCategoryImages(): Promise<{
  collectionImage: string;
  tailoredImage: string;
}> {
  try {
    const [cataloguesResult, tailorsResult] = await withTimeout(
      Promise.allSettled([getCollectionsWithBrands(), getTailorsWithBrands()]),
      3000
    );

    let collectionImage = "";
    let tailoredImage = "";

    if (
      cataloguesResult.status === "fulfilled" &&
      cataloguesResult.value.length > 0
    ) {
      const randomCollection =
        cataloguesResult.value[
          Math.floor(Math.random() * cataloguesResult.value.length)
        ];
      if (randomCollection.image) {
        collectionImage = randomCollection.image;
        devLog("Dynamic collection image:", collectionImage);
      }
    }

    if (
      tailorsResult.status === "fulfilled" &&
      tailorsResult.value.length > 0
    ) {
      const randomTailor =
        tailorsResult.value[
          Math.floor(Math.random() * tailorsResult.value.length)
        ];
      if (randomTailor.image) {
        tailoredImage = randomTailor.image;
        devLog("Dynamic tailor image:", tailoredImage);
      }
    }

    return { collectionImage, tailoredImage };
  } catch (error) {
    console.error("Error generating dynamic category images:", error);
    return { collectionImage: "", tailoredImage: "" };
  }
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
