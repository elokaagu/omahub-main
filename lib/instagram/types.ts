export type InstagramMediaType = "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";

export type InstagramPost = {
  id: string;
  permalink: string;
  imageUrl: string;
  caption?: string;
  mediaType: InstagramMediaType;
  timestamp?: string;
};

export const OMAHUB_INSTAGRAM_URL = "https://www.instagram.com/_omahub/";
export const OMAHUB_INSTAGRAM_HANDLE = "@_omahub";
