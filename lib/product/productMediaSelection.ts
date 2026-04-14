export type MediaSelection =
  | { kind: "product_video" }
  | { kind: "spotlight_video" }
  | { kind: "image"; index: number };

export function mediaSelectionEquals(a: MediaSelection, b: MediaSelection): boolean {
  if (a.kind !== b.kind) return false;
  if (a.kind === "image" && b.kind === "image") return a.index === b.index;
  return true;
}

export function defaultMediaSelection(
  hasProductVideo: boolean,
  hasSpotlightVideo: boolean
): MediaSelection {
  if (hasProductVideo) return { kind: "product_video" };
  if (hasSpotlightVideo) return { kind: "spotlight_video" };
  return { kind: "image", index: 0 };
}

export function imageIndexForSelection(
  selection: MediaSelection,
  imageCount: number
): number {
  if (selection.kind !== "image") return 0;
  if (imageCount <= 0) return 0;
  return Math.min(Math.max(0, selection.index), imageCount - 1);
}
