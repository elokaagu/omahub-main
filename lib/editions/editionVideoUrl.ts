export type ParsedEditionVideo =
  | { type: "vimeo"; embedUrl: string; id: string }
  | { type: "file"; url: string };

/** Normalise Studio input into a playable edition sidebar video. */
export function parseEditionVideo(url: string): ParsedEditionVideo | null {
  const trimmed = url.trim();
  if (!trimmed) return null;

  const vimeoMatch = trimmed.match(
    /vimeo\.com\/(?:channels\/[^/]+\/|groups\/[^/]+\/videos\/|video\/)?(\d+)/,
  );
  if (vimeoMatch?.[1]) {
    const id = vimeoMatch[1];
    return {
      type: "vimeo",
      id,
      embedUrl: `https://player.vimeo.com/video/${id}?title=0&byline=0&portrait=0`,
    };
  }

  return { type: "file", url: trimmed };
}

export function hasEditionVideo(url?: string | null): url is string {
  return Boolean(url?.trim());
}
