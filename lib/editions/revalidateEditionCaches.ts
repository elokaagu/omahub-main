import { revalidatePath } from "next/cache";

/** Bust public edition surfaces after Studio saves copy, photos, or lineup. */
export function revalidateEditionPublicCaches(slug?: string): void {
  revalidatePath("/");
  revalidatePath("/editions");
  if (slug) {
    revalidatePath(`/editions/${slug}`);
  }
}
