import { unstable_cache } from "next/cache";
import type { InstagramMediaType, InstagramPost } from "./types";

const POST_LIMIT = 8;
const CACHE_SECONDS = 60 * 60;

type GraphMediaItem = {
  id: string;
  caption?: string;
  media_type?: string;
  media_url?: string;
  thumbnail_url?: string;
  permalink?: string;
  timestamp?: string;
};

type GraphMediaResponse = {
  data?: GraphMediaItem[];
  error?: { message?: string };
};

function resolveImageUrl(item: GraphMediaItem): string | null {
  if (item.media_type === "VIDEO") {
    return item.thumbnail_url || item.media_url || null;
  }
  return item.media_url || item.thumbnail_url || null;
}

function mapGraphItem(item: GraphMediaItem): InstagramPost | null {
  const imageUrl = resolveImageUrl(item);
  if (!imageUrl || !item.permalink) return null;

  return {
    id: item.id,
    permalink: item.permalink,
    imageUrl,
    caption: item.caption,
    mediaType:
      item.media_type === "VIDEO" || item.media_type === "CAROUSEL_ALBUM"
        ? item.media_type
        : "IMAGE",
    timestamp: item.timestamp,
  };
}

async function resolveInstagramUserId(
  accessToken: string,
  host: "graph.instagram.com" | "graph.facebook.com",
): Promise<string | null> {
  const configured = process.env.INSTAGRAM_USER_ID?.trim();
  if (configured) return configured;

  const response = await fetch(
    `https://${host}/me?fields=id,username&access_token=${encodeURIComponent(accessToken)}`,
    { next: { revalidate: CACHE_SECONDS } },
  );

  if (!response.ok) return null;

  const payload = (await response.json()) as { id?: string };
  return payload.id ?? null;
}

async function fetchGraphMedia(
  accessToken: string,
  host: "graph.instagram.com" | "graph.facebook.com",
): Promise<InstagramPost[]> {
  const userId = await resolveInstagramUserId(accessToken, host);
  if (!userId) return [];

  const url = new URL(`https://${host}/${userId}/media`);
  url.searchParams.set(
    "fields",
    "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp",
  );
  url.searchParams.set("limit", String(POST_LIMIT));
  url.searchParams.set("access_token", accessToken);

  const response = await fetch(url.toString(), {
    next: { revalidate: CACHE_SECONDS },
  });

  if (!response.ok) return [];

  const payload = (await response.json()) as GraphMediaResponse;
  if (payload.error || !payload.data?.length) return [];

  return payload.data
    .map(mapGraphItem)
    .filter((post): post is InstagramPost => Boolean(post));
}

async function fetchOEmbedPosts(): Promise<InstagramPost[]> {
  const postUrls = process.env.INSTAGRAM_OEMBED_POST_URLS?.split(",")
    .map((url) => url.trim())
    .filter(Boolean);

  const appToken =
    process.env.INSTAGRAM_APP_ACCESS_TOKEN?.trim() ||
    (process.env.META_APP_ID && process.env.META_APP_SECRET
      ? `${process.env.META_APP_ID}|${process.env.META_APP_SECRET}`
      : null);

  if (!postUrls?.length || !appToken) return [];

  const posts = await Promise.all(
    postUrls.slice(0, POST_LIMIT).map(async (postUrl, index) => {
      const url = new URL("https://graph.facebook.com/v22.0/instagram_oembed");
      url.searchParams.set("url", postUrl);
      url.searchParams.set("access_token", appToken);
      url.searchParams.set("fields", "thumbnail_url,title,author_name");

      const response = await fetch(url.toString(), {
        next: { revalidate: CACHE_SECONDS },
      });

      if (!response.ok) return null;

      const payload = (await response.json()) as {
        thumbnail_url?: string;
        title?: string;
      };

      if (!payload.thumbnail_url) return null;

      const post: InstagramPost = {
        id: `oembed-${index}-${postUrl}`,
        permalink: postUrl,
        imageUrl: payload.thumbnail_url,
        mediaType: "IMAGE" satisfies InstagramMediaType,
        ...(payload.title ? { caption: payload.title } : {}),
      };
      return post;
    }),
  );

  return posts.filter((post): post is InstagramPost => post !== null);
}

async function buildInstagramPosts(): Promise<InstagramPost[]> {
  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN?.trim();

  if (accessToken) {
    const instagramHostPosts = await fetchGraphMedia(
      accessToken,
      "graph.instagram.com",
    );
    if (instagramHostPosts.length > 0) return instagramHostPosts;

    const facebookHostPosts = await fetchGraphMedia(
      accessToken,
      "graph.facebook.com",
    );
    if (facebookHostPosts.length > 0) return facebookHostPosts;
  }

  return fetchOEmbedPosts();
}

export const getInstagramPosts = unstable_cache(
  buildInstagramPosts,
  ["instagram-feed-posts-v1"],
  { revalidate: CACHE_SECONDS, tags: ["instagram-feed"] },
);
