/**
 * Safely parse cookie values to prevent JSON parsing errors
 */

export function safeParseCookie(cookieValue: string | undefined): any {
  if (!cookieValue) return null;
  
  try {
    // Try to parse as JSON first
    return JSON.parse(cookieValue);
  } catch (error) {
    // If JSON parsing fails, check if it's a base64 string
    if (cookieValue.startsWith('base64-')) {
      console.warn('Malformed base64 cookie detected, clearing...');
      return null;
    }
    
    // If it's not base64, try to extract any valid JSON parts
    try {
      // Look for JSON-like content within the string
      const jsonMatch = cookieValue.match(/\{.*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (nestedError) {
      console.warn('Failed to extract JSON from cookie:', nestedError);
    }
    
    return null;
  }
}

/**
 * Clear malformed cookies that might be causing parsing errors
 */
export function clearMalformedCookies(): void {
  if (typeof window === 'undefined') return;
  
  try {
    const cookies = document.cookie.split(';');
    cookies.forEach(cookie => {
      const [name] = cookie.split('=');
      const trimmedName = name.trim();
      
      // Clear cookies that might be malformed
      if (trimmedName.includes('sb-') || trimmedName.includes('auth')) {
        document.cookie = `${trimmedName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
        console.log(`Cleared potentially malformed cookie: ${trimmedName}`);
      }
    });
  } catch (error) {
    console.error('Error clearing malformed cookies:', error);
  }
}

/**
 * Check if a cookie value is malformed
 */
export function isMalformedCookie(cookieValue: string): boolean {
  if (!cookieValue) return false;
  
  // Check for common malformed patterns
  if (cookieValue.startsWith('base64-') && !cookieValue.includes('{')) {
    return true;
  }
  
  if (cookieValue.includes('base64-') && cookieValue.length > 1000) {
    return true;
  }
  
  return false;
}
