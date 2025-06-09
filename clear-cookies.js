// Clear corrupted Supabase cookies
console.log("🧹 Clearing corrupted Supabase cookies...");

// List of Supabase cookie names to clear
const supabaseCookies = [
  "sb-access-token",
  "sb-refresh-token",
  "omahub-auth-token",
  "supabase-auth-token",
  "sb-auth-token",
];

// Clear each cookie
supabaseCookies.forEach((cookieName) => {
  // Clear with different path combinations
  const paths = ["/", "/auth", "/studio"];

  paths.forEach((path) => {
    document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${path}`;
    document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${path}; domain=${window.location.hostname}`;
  });
});

// Clear localStorage
try {
  Object.keys(localStorage).forEach((key) => {
    if (
      key.includes("supabase") ||
      key.includes("auth") ||
      key.includes("omahub")
    ) {
      localStorage.removeItem(key);
      console.log(`Cleared localStorage: ${key}`);
    }
  });
} catch (error) {
  console.warn("Could not clear localStorage:", error);
}

// Clear sessionStorage
try {
  Object.keys(sessionStorage).forEach((key) => {
    if (
      key.includes("supabase") ||
      key.includes("auth") ||
      key.includes("omahub")
    ) {
      sessionStorage.removeItem(key);
      console.log(`Cleared sessionStorage: ${key}`);
    }
  });
} catch (error) {
  console.warn("Could not clear sessionStorage:", error);
}

console.log("✅ Cookie cleanup complete. Please refresh the page.");
