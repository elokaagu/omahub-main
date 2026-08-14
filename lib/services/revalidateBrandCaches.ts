import { revalidatePath, revalidateTag } from "next/cache";
import { clearAllBrandDependentCaches } from "@/lib/services/brandService";

/**
 * Clear in-memory brand caches and bust Next.js cached homepage segments
 * so brand edits (location, name, image, etc.) appear on `/` immediately.
 */
export function revalidateBrandPublicCaches(): void {
  clearAllBrandDependentCaches();
  revalidateTag("home-bootstrap");
  revalidatePath("/");
  revalidatePath("/directory");
}
