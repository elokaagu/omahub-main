import { createBrowserClient } from "@supabase/ssr";
import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Environment variables with validation
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing required Supabase environment variables");
}

// Unified client configuration
const clientConfig = {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: "pkce" as const,
    debug: process.env.NODE_ENV === "development",
    // Use consistent storage key across all clients
    storageKey: "sb-auth-token",
  },
  global: {
    headers: {
      "x-application-name": "omahub",
    },
  },
};

// Browser client for client-side operations
export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey, clientConfig);
}

// Server client for server-side operations with cookies
export async function createServerSupabaseClient() {
  // Dynamically import cookies only when this function is called in a server context
  const { cookies } = await import("next/headers");
  const cookieStore = cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    ...clientConfig,
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: any) {
        try {
          cookieStore.set({ name, value, ...options });
        } catch (error) {
          // Ignore errors in Server Components
          console.warn("Cookie set failed in Server Component:", error);
        }
      },
      remove(name: string, options: any) {
        try {
          cookieStore.set({ name, value: "", ...options });
        } catch (error) {
          // Ignore errors in Server Components
          console.warn("Cookie remove failed in Server Component:", error);
        }
      },
    },
  });
}

// Admin client with service role key (bypasses RLS)
export function createAdminClient() {
  if (!supabaseServiceKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is required for admin operations"
    );
  }

  return createSupabaseClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

// Default export for backward compatibility
export const supabase = createClient();

// Helper to clear corrupted auth data
export function clearAuthData() {
  if (typeof window !== "undefined") {
    // Clear all possible auth storage keys
    const keysToRemove = [
      "sb-auth-token",
      "omahub-auth-token",
      "supabase.auth.token",
      "sb-localhost-auth-token",
    ];

    keysToRemove.forEach((key) => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });

    // Clear cookies
    document.cookie.split(";").forEach((cookie) => {
      const eqPos = cookie.indexOf("=");
      const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
      if (name.trim().includes("sb-") || name.trim().includes("auth")) {
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
      }
    });
  }
}

// Auth state checker
export async function checkAuthState() {
  const client = createClient();

  try {
    const {
      data: { session },
      error,
    } = await client.auth.getSession();

    if (error) {
      console.error("Auth state check failed:", error);
      clearAuthData();
      return { session: null, error };
    }

    return { session, error: null };
  } catch (error) {
    console.error("Auth state check error:", error);
    clearAuthData();
    return { session: null, error };
  }
}
