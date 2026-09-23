/**
 * Smart sizing and focal points for photography across OmaHub.
 *
 * `sizes` tells the browser how wide the image will actually be drawn, so it
 * can pick the right file from the srcset. Omitting it on a `fill` image
 * makes Next assume 100vw: a thumbnail then downloads a 3840px file, and a
 * hero that is served too small looks soft and over-compressed. Every image
 * should pass one of these.
 */
export const IMAGE_SIZES = {
  /** Edge-to-edge: heroes, full-bleed film and archive banners. */
  fullBleed: "100vw",
  /** Half the page on desktop, full width below, e.g. a split hero. */
  half: "(max-width: 768px) 100vw, 50vw",
  /** Directory and archive grids: 2 up on phones, 3, then 4. */
  cardGrid:
    "(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 320px",
  /** Editorial cards that stay larger: 1 up on phones, 2, then 3. */
  featureGrid:
    "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw",
  /** Product and catalogue tiles inside a brand page. */
  productGrid:
    "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 280px",
  /** Studio tables, pickers and previews. */
  thumbnail: "(max-width: 640px) 33vw, 200px",
  /** Avatars and logos. */
  avatar: "64px",
} as const;

export type ImageSizePreset = keyof typeof IMAGE_SIZES;

/**
 * Where the crop should hold when a photo is cut to a different shape.
 *
 * Fashion photography is nearly always shot with the subject's head in the
 * upper third, so a centred crop on a wide hero cuts faces off. `portrait`
 * is the safe default for people; `center` suits flat lays and product.
 */
export const FOCAL_POINTS = {
  /** Faces sit high in frame - hold the upper third. */
  portrait: "center 30%",
  /** Full-length looks: a little above centre keeps head and hem. */
  figure: "center 40%",
  center: "center",
  top: "center top",
  bottom: "center bottom",
} as const;

export type FocalPoint = keyof typeof FOCAL_POINTS;

/** Resolves a named focal point, or passes a raw CSS position straight through. */
export function objectPositionFor(focal?: FocalPoint | string): string {
  if (!focal) return FOCAL_POINTS.center;
  return focal in FOCAL_POINTS
    ? FOCAL_POINTS[focal as FocalPoint]
    : focal;
}

/**
 * Quality floor for photography. Next defaults to 75, which shows as mushy
 * detail on fabric and skin once it is also converted to AVIF.
 */
export const IMAGE_QUALITY = {
  /** Heroes and anything shown large. */
  hero: 90,
  /** Cards, grids, editorial tiles. */
  standard: 85,
  /** Studio tables, pickers, avatars. */
  thumbnail: 75,
} as const;
