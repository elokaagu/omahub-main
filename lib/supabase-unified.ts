import { createBrowserClient } from "@supabase/ssr";
import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Environment variables with validation
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Helper function to validate environment variables
function validateEnvVars() {
  if (!supabaseUrl || !supabaseAnonKey) {
    const error = new Error("Missing required Supabase environment variables");
    console.error("❌ Supabase configuration error:", {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseAnonKey,
      env: process.env.NODE_ENV,
    });
    throw error;
  }
}

// Enhanced client configuration with robust session handling
const clientConfig = {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: "pkce" as const,
    debug: process.env.NODE_ENV === "development",
    // Remove custom storage to let Supabase handle cookies naturally
  },
  global: {
    headers: {
      "x-application-name": "omahub",
    },
  },
};

// Browser client for client-side operations
export function createClient() {
  validateEnvVars();
  return createBrowserClient(supabaseUrl!, supabaseAnonKey!, clientConfig);
}

// Server client for server-side operations with cookies
export async function createServerSupabaseClient() {
  validateEnvVars();
  // Dynamically import cookies only when this function is called in a server context
  const { cookies } = await import("next/headers");
  const cookieStore = cookies();

  return createServerClient(supabaseUrl!, supabaseAnonKey!, {
    ...clientConfig,
    cookies: {
      get(name: string) {
        const cookie = cookieStore.get(name);
        return cookie?.value;
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
  validateEnvVars();
  if (!supabaseServiceKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is required for admin operations"
    );
  }

  return createSupabaseClient(supabaseUrl!, supabaseAnonKey!, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

// API route client for server-side operations with request cookies
export function createApiRouteSupabaseClient(request: Request) {
  validateEnvVars();
  return createServerClient(supabaseUrl!, supabaseAnonKey!, {
    ...clientConfig,
    cookies: {
      get(name: string) {
        const cookieHeader = request.headers.get("cookie");
        if (!cookieHeader) return undefined;

        const cookies: Record<string, string> = cookieHeader.split(";").reduce(
          (acc, cookie) => {
            const [key, value] = cookie.trim().split("=");
            if (key && value) {
              acc[key] = value;
            }
            return acc;
          },
          {} as Record<string, string>
        );

        return cookies[name];
      },
      set() {
        // No-op in API routes
      },
      remove() {
        // No-op in API routes
      },
    },
  });
}

// Single source of truth for browser client
// Lazy initialization to avoid errors at module load time
let supabaseInstance: ReturnType<typeof createClient> | null = null;

function getSupabaseInstance() {
  if (!supabaseInstance) {
    // Check if we're in browser and environment variables are available
    if (typeof window !== "undefined") {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      if (!url || !key) {
        console.error("❌ Supabase environment variables not available in browser:", {
          hasUrl: !!url,
          hasKey: !!key,
          allEnvKeys: Object.keys(process.env).filter(k => k.includes('SUPABASE')),
        });
        throw new Error(
          "Supabase environment variables not available. " +
          "Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set."
        );
      }
    }
    
    try {
      supabaseInstance = createClient();
    } catch (error) {
      console.error("Failed to initialize Supabase client:", error);
      throw error;
    }
  }
  return supabaseInstance;
}

// Export supabase as a getter that lazily initializes
export const supabase = new Proxy({} as ReturnType<typeof createClient>, {
  get(target, prop) {
    try {
      const instance = getSupabaseInstance();
      const value = instance[prop as keyof typeof instance];
      if (typeof value === 'function') {
        return value.bind(instance);
      }
      return value;
    } catch (error) {
      // Return a no-op function for methods to prevent crashes
      if (typeof prop === 'string' && prop.includes('auth')) {
        console.error("Supabase client not available:", error);
        return () => Promise.resolve({ data: null, error: error });
      }
      throw error;
    }
  },
  set(target, prop, value) {
    const instance = getSupabaseInstance();
    (instance as any)[prop] = value;
    return true;
  }
});

// Helper to clear corrupted auth data
export function clearAuthData() {
  if (typeof window !== "undefined" && supabaseUrl) {
    // Clear all possible auth storage keys including the new consistent one
    const baseKey = `sb-${new URL(supabaseUrl).hostname.split(".")[0]}-auth-token`;
    const keysToRemove = [
      baseKey,
      "sb-auth-token",
      "omahub-auth-token",
      "supabase.auth.token",
      "sb-localhost-auth-token",
      // Add other possible variations
      `sb-${supabaseUrl.split("//")[1].split(".")[0]}-auth-token`,
    ];

    keysToRemove.forEach((key) => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });

    // Clear all supabase-related cookies
    document.cookie.split(";").forEach((cookie) => {
      const eqPos = cookie.indexOf("=");
      const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
      if (
        name.includes("sb-") ||
        name.includes("auth") ||
        name.includes("supabase")
      ) {
        // Clear for multiple path and domain combinations
        const clearOptions = [
          "",
          "; path=/",
          "; path=/; domain=localhost",
          "; path=/; domain=.localhost",
          `; path=/; domain=${window.location.hostname}`,
          `; path=/; domain=.${window.location.hostname}`,
        ];

        clearOptions.forEach((options) => {
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT${options}`;
        });
      }
    });

    console.log("🧹 Cleared all authentication data");
  }
}

// Enhanced auth state checker with session validation
export async function checkAuthState() {
  const client = createClient();

  try {
    // First, try to get the current session
    const {
      data: { session },
      error: sessionError,
    } = await client.auth.getSession();

    if (sessionError) {
      console.error("Auth state check failed:", sessionError);
      clearAuthData();
      return { session: null, error: sessionError };
    }

    // If no session, return early
    if (!session) {
      return { session: null, error: null };
    }

    // Validate session by making a test API call
    try {
      const response = await fetch("/api/auth/validate", {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        console.warn("Session validation failed, refreshing...");
        const { data: refreshData, error: refreshError } =
          await client.auth.refreshSession();

        if (refreshError) {
          console.error("Session refresh failed:", refreshError);
          clearAuthData();
          return { session: null, error: refreshError };
        }

        return { session: refreshData.session, error: null };
      }

      return { session, error: null };
    } catch (validationError) {
      console.warn("Session validation request failed:", validationError);
      // Don't clear data on network errors, just return the session
      return { session, error: null };
    }
  } catch (error) {
    console.error("Auth state check error:", error);
    clearAuthData();
    return { session: null, error };
  }
}
