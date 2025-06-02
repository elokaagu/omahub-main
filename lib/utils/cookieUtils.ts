/**
 * Utility functions for handling cookies and cleaning up corrupted session data
 */

/**
 * Clean up corrupted Supabase cookies that might cause JSON parsing errors
 */
export function cleanupCorruptedCookies(): void {
  if (typeof document === "undefined") return;

  try {
    const cookies = document.cookie.split(";");
    let cleanedCount = 0;

    cookies.forEach((cookie) => {
      const [name, value] = cookie.trim().split("=");

      // Check if it's a Supabase or auth-related cookie
      if (
        name &&
        (name.includes("supabase") ||
          name.includes("auth") ||
          name.includes("sb-")) &&
        value
      ) {
        try {
          const decoded = decodeURIComponent(value);

          // Check for various corruption patterns
          const isCorrupted =
            decoded.startsWith("base64-ey") || // Malformed base64
            decoded.includes("Unexpected token") || // JSON parsing errors
            decoded.includes("SyntaxError") || // Syntax errors
            decoded.length > 10000 || // Suspiciously long cookies
            (decoded.startsWith("base64-") && !isValidBase64JSON(decoded)); // Invalid base64 JSON

          if (isCorrupted) {
            console.warn(`🧹 Removing corrupted cookie: ${name}`);
            removeCookie(name);
            cleanedCount++;
          }
        } catch (error) {
          console.warn(`🧹 Removing corrupted cookie (decode error): ${name}`);
          removeCookie(name);
          cleanedCount++;
        }
      }
    });

    if (cleanedCount > 0) {
      console.log(`✅ Cleaned up ${cleanedCount} corrupted cookies`);
    }
  } catch (error) {
    console.error("Error cleaning up cookies:", error);
  }
}

/**
 * Validate if a base64 encoded string contains valid JSON
 */
function isValidBase64JSON(value: string): boolean {
  try {
    if (!value.startsWith("base64-")) return false;
    const base64Data = value.replace("base64-", "");
    const jsonString = atob(base64Data);
    JSON.parse(jsonString);
    return true;
  } catch {
    return false;
  }
}

/**
 * Remove a cookie with all possible domain/path combinations
 */
function removeCookie(name: string): void {
  const hostname = window.location.hostname;
  const paths = ["/", "/studio", "/auth"];
  const domains = [hostname, `.${hostname}`];

  // Try all combinations of paths and domains
  paths.forEach((path) => {
    domains.forEach((domain) => {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${path}; domain=${domain}`;
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${path}`;
    });
  });

  // Also try without domain specification
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
}

/**
 * Clear all Supabase authentication cookies
 */
export function clearSupabaseCookies(): void {
  if (typeof document === "undefined") return;

  try {
    const cookies = document.cookie.split(";");
    let clearedCount = 0;

    cookies.forEach((cookie) => {
      const [name] = cookie.trim().split("=");

      if (
        name &&
        (name.includes("supabase") ||
          name.includes("auth") ||
          name.includes("sb-"))
      ) {
        console.log(`🧹 Clearing Supabase cookie: ${name}`);
        removeCookie(name);
        clearedCount++;
      }
    });

    if (clearedCount > 0) {
      console.log(`✅ Cleared ${clearedCount} Supabase cookies`);
    }
  } catch (error) {
    console.error("Error clearing Supabase cookies:", error);
  }
}

/**
 * Check if there are any corrupted cookies
 */
export function hasCorruptedCookies(): boolean {
  if (typeof document === "undefined") return false;

  try {
    const cookies = document.cookie.split(";");

    return cookies.some((cookie) => {
      const [name, value] = cookie.trim().split("=");

      if (
        name &&
        (name.includes("supabase") ||
          name.includes("auth") ||
          name.includes("sb-")) &&
        value
      ) {
        try {
          const decoded = decodeURIComponent(value);

          // Check for corruption patterns
          const isCorrupted =
            decoded.startsWith("base64-ey") ||
            decoded.includes("Unexpected token") ||
            decoded.includes("SyntaxError") ||
            decoded.length > 10000 ||
            (decoded.startsWith("base64-") && !isValidBase64JSON(decoded));

          return isCorrupted;
        } catch (error) {
          return true; // Found a corrupted cookie
        }
      }
      return false;
    });
  } catch (error) {
    console.error("Error checking for corrupted cookies:", error);
    return false;
  }
}

/**
 * Force cleanup all authentication cookies and reload the page
 */
export function forceAuthCleanup(): void {
  console.log("🚨 Force cleaning all authentication data...");

  // Clear all auth-related cookies
  clearSupabaseCookies();

  // Clear localStorage
  if (typeof localStorage !== "undefined") {
    const keys = Object.keys(localStorage);
    keys.forEach((key) => {
      if (
        key.includes("supabase") ||
        key.includes("auth") ||
        key.includes("sb-")
      ) {
        localStorage.removeItem(key);
        console.log(`🧹 Removed localStorage item: ${key}`);
      }
    });
  }

  // Clear sessionStorage
  if (typeof sessionStorage !== "undefined") {
    const keys = Object.keys(sessionStorage);
    keys.forEach((key) => {
      if (
        key.includes("supabase") ||
        key.includes("auth") ||
        key.includes("sb-")
      ) {
        sessionStorage.removeItem(key);
        console.log(`🧹 Removed sessionStorage item: ${key}`);
      }
    });
  }

  console.log("✅ Force cleanup complete. Reloading page...");
  window.location.reload();
}
