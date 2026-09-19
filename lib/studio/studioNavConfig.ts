/**
 * Studio sidebar items hidden while the platform focuses on brand profiles
 * and editions. Routes remain reachable by direct URL for later re-enable.
 * Hero carousel is hidden because the live homepage uses Settings → Homepage Hero.
 */
export const STUDIO_HIDDEN_NAV_HREFS = new Set([
  "/studio/collections",
  "/studio/products",
  "/studio/services",
  "/studio/portfolio",
  "/studio/hero",
]);

export function isStudioNavItemHidden(href: string): boolean {
  return STUDIO_HIDDEN_NAV_HREFS.has(href);
}
