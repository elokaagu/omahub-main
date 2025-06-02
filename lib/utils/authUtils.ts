import { supabase } from "../supabase";

/**
 * Utility to clear all authentication state when stuck in loops
 */
export async function clearAllAuthState() {
  console.log("🧹 Clearing all authentication state...");

  try {
    // Sign out from Supabase
    if (supabase) {
      await supabase.auth.signOut();
    }

    // Clear all auth-related storage
    if (typeof window !== "undefined") {
      // Clear localStorage
      const localStorageKeys = Object.keys(localStorage);
      localStorageKeys.forEach((key) => {
        if (
          key.includes("supabase") ||
          key.includes("auth") ||
          key.includes("sb-")
        ) {
          localStorage.removeItem(key);
          console.log(`🗑️ Removed localStorage: ${key}`);
        }
      });

      // Clear sessionStorage
      const sessionStorageKeys = Object.keys(sessionStorage);
      sessionStorageKeys.forEach((key) => {
        if (
          key.includes("supabase") ||
          key.includes("auth") ||
          key.includes("sb-")
        ) {
          sessionStorage.removeItem(key);
          console.log(`🗑️ Removed sessionStorage: ${key}`);
        }
      });

      // Clear cookies
      document.cookie.split(";").forEach((cookie) => {
        const eqPos = cookie.indexOf("=");
        const name =
          eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
        if (
          name.includes("supabase") ||
          name.includes("auth") ||
          name.includes("sb-")
        ) {
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
          console.log(`🗑️ Removed cookie: ${name}`);
        }
      });
    }

    console.log("✅ All authentication state cleared");
    return true;
  } catch (error) {
    console.error("❌ Error clearing auth state:", error);
    return false;
  }
}

/**
 * Check if we're in a token refresh loop
 */
export function detectTokenRefreshLoop(): boolean {
  if (typeof window === "undefined") return false;

  // Check for rapid token refresh attempts in console
  const now = Date.now();
  const key = "last_token_refresh_check";
  const lastCheck = localStorage.getItem(key);

  if (lastCheck) {
    const timeDiff = now - parseInt(lastCheck);
    if (timeDiff < 5000) {
      // Less than 5 seconds since last check
      console.warn("⚠️ Potential token refresh loop detected");
      return true;
    }
  }

  localStorage.setItem(key, now.toString());
  return false;
}

/**
 * Safe auth state initialization
 */
export async function safeAuthInit() {
  if (!supabase) {
    console.warn("⚠️ Supabase client not available");
    return null;
  }

  try {
    // Check for token refresh loop
    if (detectTokenRefreshLoop()) {
      console.warn("🚫 Token refresh loop detected, clearing auth state");
      await clearAllAuthState();
      return null;
    }

    // Get session with timeout
    const sessionPromise = supabase.auth.getSession();
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Session fetch timeout")), 10000)
    );

    const { data, error } = (await Promise.race([
      sessionPromise,
      timeoutPromise,
    ])) as any;

    if (error) {
      console.error("❌ Error getting session:", error);
      return null;
    }

    return data.session;
  } catch (error) {
    console.error("❌ Error in safe auth init:", error);
    return null;
  }
}
