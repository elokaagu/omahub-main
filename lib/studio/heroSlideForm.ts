import type { CreateHeroSlideData } from "@/lib/services/heroService";

export const HERO_SLIDE_TITLE_MAX = 200;
export const HERO_SLIDE_HERO_TITLE_MAX = 120;
export const HERO_SLIDE_SUBTITLE_MAX = 500;
export const HERO_SLIDE_DISPLAY_ORDER_MAX = 9999;

/** Shared shape for create/edit hero form UIs */
export type HeroSlideFormShape = Pick<
  CreateHeroSlideData,
  | "image"
  | "title"
  | "subtitle"
  | "link"
  | "hero_title"
  | "is_editorial"
  | "display_order"
  | "is_active"
>;

/** Preview CTA copy matches public hero behaviour. */
export function heroSlidePreviewCtaLabel(isEditorial: boolean): string {
  return isEditorial ? "View Catalogue" : "Explore Designers";
}

export function validateHeroLink(link: string): string | null {
  const t = link.trim();
  if (!t) return null;
  if (t.startsWith("/")) return null;
  if (t.startsWith("http://") || t.startsWith("https://")) {
    try {
      new URL(t);
      return null;
    } catch {
      return "Enter a valid full URL (including https://)";
    }
  }
  if (/^[a-zA-Z0-9/_?=#&%.+-]+$/.test(t)) return null;
  return "Use an internal path or a full https:// URL";
}

/** First validation error as a toast message, or null if OK */
export function validateHeroSlideForm(form: HeroSlideFormShape): string | null {
  if (!form.image?.trim()) return "Hero image is required";
  if (!form.title?.trim()) return "Title is required";
  if (!form.hero_title?.trim()) return "Hero title is required";
  if (form.title.length > HERO_SLIDE_TITLE_MAX) {
    return `Title must be at most ${HERO_SLIDE_TITLE_MAX} characters`;
  }
  if (form.hero_title.length > HERO_SLIDE_HERO_TITLE_MAX) {
    return `Hero title must be at most ${HERO_SLIDE_HERO_TITLE_MAX} characters`;
  }
  if ((form.subtitle || "").length > HERO_SLIDE_SUBTITLE_MAX) {
    return `Subtitle must be at most ${HERO_SLIDE_SUBTITLE_MAX} characters`;
  }
  const order = Number(form.display_order);
  if (
    !Number.isFinite(order) ||
    order < 1 ||
    order > HERO_SLIDE_DISPLAY_ORDER_MAX
  ) {
    return `Display order must be a whole number between 1 and ${HERO_SLIDE_DISPLAY_ORDER_MAX}`;
  }
  return validateHeroLink(form.link || "");
}
