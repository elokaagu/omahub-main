/**
 * Platform-level inbox brand id (see `scripts/add-omahub-brand.sql`).
 * Override when the canonical row uses a different id.
 */
const DEFAULT_OMAHUB_PLATFORM_BRAND_ID =
  "omahub-platform-0000-0000-0000-000000000000";

export function getOmaHubPlatformBrandId(): string {
  const fromEnv = process.env.OMAHUB_PLATFORM_BRAND_ID?.trim();
  return fromEnv && fromEnv.length > 0
    ? fromEnv
    : DEFAULT_OMAHUB_PLATFORM_BRAND_ID;
}
