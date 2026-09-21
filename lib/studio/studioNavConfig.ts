/**
 * Studio sidebar items hidden from navigation but still reachable by URL.
 * The designer welcome page is linked to directly (e.g. from onboarding)
 * rather than listed in the sidebar.
 *
 * Retired sections (products, services, inbox, leads, collections,
 * portfolio, reviews, hero carousel) were removed; they're preserved on the
 * `archive/studio-hidden-sections` git branch.
 */
export const STUDIO_HIDDEN_NAV_HREFS = new Set(["/studio/welcome"]);

export function isStudioNavItemHidden(href: string): boolean {
  return STUDIO_HIDDEN_NAV_HREFS.has(href);
}
