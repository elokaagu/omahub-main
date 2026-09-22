/** POST one or more platform settings. Resolves to an error message or null. */
export async function savePlatformSetting(
  update: Record<string, string>,
  fallbackError: string,
): Promise<string | null> {
  try {
    const response = await fetch("/api/platform-settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(update),
    });
    const data = await response.json();
    if (response.ok && data.success) return null;
    return data.error || fallbackError;
  } catch (error) {
    console.error("Error saving platform setting:", error);
    return "Something went wrong. Please try again.";
  }
}
