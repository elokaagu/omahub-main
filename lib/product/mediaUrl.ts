const VIDEO_EXT_RE = /\.(mp4|mov|avi|webm|m4v)(\?|#|$)/i;

/** True if URL looks like a video file (not a thumbnail image). */
export function isVideoFileUrl(url: string | null | undefined): boolean {
  if (url == null || typeof url !== "string" || url.trim() === "") {
    return false;
  }
  return VIDEO_EXT_RE.test(url);
}

/** True if URL is present and does not look like a raw video file path. */
export function isImageLikeUrl(url: string | null | undefined): boolean {
  return !!url && !isVideoFileUrl(url);
}
