import GoogleTagManager from "./GoogleTagManager";

/**
 * Backward-compatible export. Prefer importing `GoogleTagManager` directly.
 */
export default function GoogleAnalytics() {
  return <GoogleTagManager />;
}
