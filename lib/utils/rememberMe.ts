// Utility functions for "Remember Me" functionality

const REMEMBER_ME_KEY = "omahub_remember_me";
const REMEMBERED_EMAIL_KEY = "omahub_remembered_email";

export interface RememberMeData {
  email: string;
  rememberMe: boolean;
}

/**
 * Save remember me preference and email to localStorage
 */
export function saveRememberMe(email: string, remember: boolean): void {
  try {
    if (typeof window === "undefined") return;

    if (remember) {
      localStorage.setItem(REMEMBER_ME_KEY, "true");
      localStorage.setItem(REMEMBERED_EMAIL_KEY, email);
    } else {
      localStorage.removeItem(REMEMBER_ME_KEY);
      localStorage.removeItem(REMEMBERED_EMAIL_KEY);
    }
  } catch (error) {
    console.error("Error saving remember me preference:", error);
  }
}

/**
 * Get remembered email and preference from localStorage
 */
export function getRememberedData(): RememberMeData {
  try {
    if (typeof window === "undefined") {
      return { email: "", rememberMe: false };
    }

    const rememberMe = localStorage.getItem(REMEMBER_ME_KEY) === "true";
    const email = localStorage.getItem(REMEMBERED_EMAIL_KEY) || "";

    return { email, rememberMe };
  } catch (error) {
    console.error("Error getting remember me preference:", error);
    return { email: "", rememberMe: false };
  }
}

/**
 * Clear all remember me data
 */
export function clearRememberMe(): void {
  try {
    if (typeof window === "undefined") return;

    localStorage.removeItem(REMEMBER_ME_KEY);
    localStorage.removeItem(REMEMBERED_EMAIL_KEY);
  } catch (error) {
    console.error("Error clearing remember me preference:", error);
  }
}

/**
 * Check if user has remember me enabled
 */
export function hasRememberMe(): boolean {
  try {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(REMEMBER_ME_KEY) === "true";
  } catch (error) {
    console.error("Error checking remember me preference:", error);
    return false;
  }
}
