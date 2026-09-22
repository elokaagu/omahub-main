import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Buckets offered in the "choose existing" picker, newest-feeling first.
 * All are public, so the picker only ever hands back public URLs.
 */
export const MEDIA_BUCKETS = [
  { id: "brand-assets", label: "Brand photos" },
  { id: "edition-galleries", label: "Editions" },
  { id: "hero-images", label: "Homepage" },
  { id: "product-images", label: "Products" },
  { id: "spotlight-images", label: "Spotlight" },
  { id: "brand-images", label: "Brand images (legacy)" },
] as const;

export type MediaBucketId = (typeof MEDIA_BUCKETS)[number]["id"];

export type MediaItem = {
  /** Path inside the bucket, unique per item. */
  path: string;
  bucket: string;
  url: string;
  name: string;
  updatedAt: string | null;
};

const IMAGE_EXTENSIONS = /\.(jpe?g|png|webp|gif|avif)$/i;
/** One level of folders is enough: buckets are flat or slug/file. */
const MAX_FOLDER_SCAN = 12;
const PER_FOLDER = 100;

function isImage(name: string): boolean {
  return IMAGE_EXTENSIONS.test(name);
}

function publicUrl(db: SupabaseClient, bucket: string, path: string): string {
  return db.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

/**
 * Images already uploaded to OmaHub, so Studio can reuse one instead of
 * uploading it again. Folders are scanned one level deep.
 */
export async function listStudioMedia(
  db: SupabaseClient,
  bucket: string,
  search = "",
): Promise<MediaItem[]> {
  const sortBy = { column: "updated_at", order: "desc" as const };
  const root = await db.storage
    .from(bucket)
    .list("", { limit: PER_FOLDER, sortBy });

  if (root.error) {
    throw new Error(`media list failed: ${root.error.message}`);
  }

  const entries = root.data ?? [];
  const items: MediaItem[] = [];

  for (const entry of entries) {
    // Supabase reports folders as rows without an id.
    if (entry.id && isImage(entry.name)) {
      items.push({
        path: entry.name,
        bucket,
        url: publicUrl(db, bucket, entry.name),
        name: entry.name,
        updatedAt: entry.updated_at ?? null,
      });
    }
  }

  const folders = entries.filter((entry) => !entry.id).slice(0, MAX_FOLDER_SCAN);
  const nested = await Promise.all(
    folders.map(async (folder) => {
      const result = await db.storage
        .from(bucket)
        .list(folder.name, { limit: PER_FOLDER, sortBy });
      return (result.data ?? [])
        .filter((entry) => entry.id && isImage(entry.name))
        .map((entry) => {
          const path = `${folder.name}/${entry.name}`;
          return {
            path,
            bucket,
            url: publicUrl(db, bucket, path),
            name: entry.name,
            updatedAt: entry.updated_at ?? null,
          };
        });
    }),
  );

  const all = [...items, ...nested.flat()];
  const term = search.trim().toLowerCase();
  const matching = term
    ? all.filter((item) => item.path.toLowerCase().includes(term))
    : all;

  return matching.sort((a, b) =>
    (b.updatedAt ?? "").localeCompare(a.updatedAt ?? ""),
  );
}
