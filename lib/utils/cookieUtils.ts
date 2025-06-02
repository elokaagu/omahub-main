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

    cookies.forEach((cookie) => {
      const [name, value] = cookie.trim().split("=");

      // Check if it's a Supabase cookie
      if (name && name.includes("supabase") && value) {
        try {
          const decoded = decodeURIComponent(value);

          // If it's a base64 encoded cookie, validate it
          if (decoded.startsWith("base64-")) {
            const base64Data = decoded.replace("base64-", "");
            const jsonString = atob(base64Data);
            JSON.parse(jsonString); // This will throw if invalid
          }
        } catch (error) {
          console.warn(`Removing corrupted Supabase cookie: ${name}`);
          // Remove the corrupted cookie
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${window.location.hostname}`;
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
        }
      }
    });
  } catch (error) {
    console.error("Error cleaning up cookies:", error);
  }
}

/**
 * Clear all Supabase authentication cookies
 */
export function clearSupabaseCookies(): void {
  if (typeof document === "undefined") return;

  try {
    const cookies = document.cookie.split(";");

    cookies.forEach((cookie) => {
      const [name] = cookie.trim().split("=");

      if (name && (name.includes("supabase") || name.includes("auth"))) {
        console.log(`Clearing Supabase cookie: ${name}`);
        // Clear with multiple domain/path combinations to ensure removal
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${window.location.hostname}`;
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=.${window.location.hostname}`;
      }
    });
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

      if (name && name.includes("supabase") && value) {
        try {
          const decoded = decodeURIComponent(value);

          if (decoded.startsWith("base64-")) {
            const base64Data = decoded.replace("base64-", "");
            const jsonString = atob(base64Data);
            JSON.parse(jsonString);
          }
          return false;
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
