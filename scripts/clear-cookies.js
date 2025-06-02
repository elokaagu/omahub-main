/**
 * Browser console script to clear corrupted Supabase cookies
 * Run this in the browser console if you're experiencing authentication issues
 */

(function clearCorruptedSupabaseCookies() {
  console.log("🧹 Starting Supabase cookie cleanup...");

  let clearedCount = 0;
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
        console.warn(`🗑️ Removing corrupted cookie: ${name}`);
        // Remove the corrupted cookie
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${window.location.hostname}`;
        clearedCount++;
      }
    }
  });

  if (clearedCount > 0) {
    console.log(
      `✅ Cleared ${clearedCount} corrupted cookies. Please refresh the page.`
    );
    alert(
      `Cleared ${clearedCount} corrupted cookies. The page will now refresh.`
    );
    window.location.reload();
  } else {
    console.log("✅ No corrupted cookies found.");
  }
})();
