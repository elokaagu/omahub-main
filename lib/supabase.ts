import { createBrowserClient } from "@supabase/ssr";
import { AuthDebug } from "./utils/debug";

// Check if we're in a build process
const isBuildTime =
  process.env.NODE_ENV === "production" &&
  (process.env.NEXT_PHASE === "phase-production-build" ||
    (process.env.VERCEL_ENV === "production" &&
      process.env.VERCEL_BUILD_STEP === "true"));

// Safely access environment variables with fallbacks
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

console.log("🔄 Initializing Supabase client:", {
  hasUrl: !!supabaseUrl,
  hasKey: !!supabaseAnonKey.substring(0, 10) + "...",
  env: process.env.NODE_ENV,
  isBuildTime,
});

// Enhanced rate limiting and circuit breaker for token refresh
let lastTokenRefresh = 0;
let tokenRefreshAttempts = 0;
let circuitBreakerTripped = false;
const TOKEN_REFRESH_COOLDOWN = 15000; // 15 seconds
const MAX_REFRESH_ATTEMPTS = 3;
const CIRCUIT_BREAKER_RESET_TIME = 60000; // 1 minute

// Reset circuit breaker after timeout
const resetCircuitBreaker = () => {
  setTimeout(() => {
    if (circuitBreakerTripped) {
      console.log("🔄 Resetting token refresh circuit breaker");
      circuitBreakerTripped = false;
      tokenRefreshAttempts = 0;
    }
  }, CIRCUIT_BREAKER_RESET_TIME);
};

// Create a function to initialize the Supabase client
const createClient = () => {
  // Only return null during actual build time, not during SSR
  if (isBuildTime) {
    console.log("🏗️ Build time detected, returning null client");
    return null;
  }

  // For SSR, we still create the client but it will only work after hydration
  if (typeof window === "undefined") {
    console.log("🖥️ Server-side rendering, creating client for hydration");
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: "pkce",
      storage: typeof window !== "undefined" ? window.localStorage : undefined,
      // Add custom token refresh handling
      debug: process.env.NODE_ENV === "development",
    },
    global: {
      fetch: (url: RequestInfo | URL, options?: RequestInit) => {
        // Enhanced rate limiting for token refresh requests
        if (typeof url === "string" && url.includes("/auth/v1/token")) {
          const now = Date.now();

          // Check circuit breaker
          if (circuitBreakerTripped) {
            console.error(
              "🚫 Token refresh circuit breaker is tripped - blocking request"
            );
            return Promise.reject(
              new Error("Token refresh circuit breaker tripped")
            );
          }

          // Check rate limiting
          if (now - lastTokenRefresh < TOKEN_REFRESH_COOLDOWN) {
            console.warn(
              `🚫 Token refresh rate limited, skipping request (${tokenRefreshAttempts} attempts)`
            );
            tokenRefreshAttempts++;

            // Trip circuit breaker if too many attempts
            if (tokenRefreshAttempts >= MAX_REFRESH_ATTEMPTS) {
              console.error(
                "🚨 Too many token refresh attempts - tripping circuit breaker"
              );
              circuitBreakerTripped = true;
              resetCircuitBreaker();

              // Clear auth state to prevent infinite loops
              if (typeof window !== "undefined") {
                console.log("🧹 Clearing auth state due to circuit breaker");
                localStorage.removeItem("sb-gswduyodzdgucjscjtvz-auth-token");
                localStorage.removeItem("supabase.auth.token");
                // Redirect to clear page
                window.location.href = "/auth/clear";
              }
            }

            return Promise.reject(new Error("Token refresh rate limited"));
          }

          lastTokenRefresh = now;
          tokenRefreshAttempts = 0; // Reset on successful timing
          console.log("🔄 Token refresh request allowed");
        }

        return fetch(url, {
          ...options,
          headers: {
            ...options?.headers,
            "x-application-name": "omahub",
            "Cache-Control": "no-cache",
          },
        });
      },
    },
    cookies: {
      get: (name: string) => {
        if (typeof document === "undefined") return undefined;
        try {
          const value = document.cookie
            .split("; ")
            .find((row) => row.startsWith(`${name}=`))
            ?.split("=")[1];
          return value ? decodeURIComponent(value) : undefined;
        } catch (error) {
          console.warn("Error reading cookie:", name, error);
          return undefined;
        }
      },
      set: (name: string, value: string, options: any) => {
        if (typeof document === "undefined") return;
        try {
          const cookieOptions = {
            ...options,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
          };
          const cookieString = `${name}=${encodeURIComponent(value)}; ${Object.entries(
            cookieOptions
          )
            .map(([key, val]) => `${key}=${val}`)
            .join("; ")}`;
          document.cookie = cookieString;
        } catch (error) {
          console.warn("Error setting cookie:", name, error);
        }
      },
      remove: (name: string, options: any) => {
        if (typeof document === "undefined") return;
        try {
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; ${Object.entries(
            options || {}
          )
            .map(([key, val]) => `${key}=${val}`)
            .join("; ")}`;
        } catch (error) {
          console.warn("Error removing cookie:", name, error);
        }
      },
    },
  });
};

// Initialize the client
export const supabase = createClient();

// Set up auth state change listener and run tests if in browser environment
if (supabase && typeof window !== "undefined") {
  // Set up auth state change listener with error handling
  supabase.auth.onAuthStateChange((event, session) => {
    try {
      AuthDebug.state(event, session);
      AuthDebug.session(session);

      // Handle specific auth events
      if (event === "TOKEN_REFRESHED") {
        console.log("✅ Token refreshed successfully");
        // Reset circuit breaker on successful refresh
        tokenRefreshAttempts = 0;
        circuitBreakerTripped = false;
      } else if (event === "SIGNED_OUT") {
        console.log("👋 User signed out");
        // Clear any stuck auth state
        localStorage.removeItem("supabase.auth.token");
        localStorage.removeItem("sb-gswduyodzdgucjscjtvz-auth-token");
        // Reset circuit breaker
        tokenRefreshAttempts = 0;
        circuitBreakerTripped = false;
      }
    } catch (error) {
      console.error("Error in auth state change handler:", error);
    }
  });

  // Test the connection with error handling
  supabase.auth
    .getSession()
    .then(({ data, error }) => {
      if (error) {
        AuthDebug.error("Supabase auth test failed", error);
      } else {
        AuthDebug.log("Supabase auth test successful", {
          hasSession: !!data.session,
        });
        AuthDebug.session(data.session);
      }
    })
    .catch((error) => {
      console.error("Failed to get initial session:", error);
    });

  // Test a simple database query with error handling
  (async () => {
    try {
      const { data, error, count } = await supabase
        .from("brands")
        .select("*", { count: "exact", head: true });
      if (error) {
        AuthDebug.error("Supabase database test failed", error);
      } else {
        AuthDebug.log("Supabase database test successful", {
          brandCount: count,
        });
      }
    } catch (error: any) {
      console.error("Database test failed:", error);
    }
  })();
}

// Helper function to safely execute database operations
export async function safeDbOperation<T>(
  operation: () => Promise<T>,
  fallback: T
): Promise<T> {
  // Skip actual database operations during build time
  if (isBuildTime) {
    console.log("Build-time detected, skipping database operation");
    return fallback;
  }

  try {
    return await operation();
  } catch (error) {
    console.error("Database operation failed:", error);
    return fallback;
  }
}

// Types based on your current data model
export type Brand = {
  id: string;
  name: string;
  description?: string;
  logo_url?: string;
  long_description: string;
  location: string;
  price_range: string;
  category: string;
  categories?: string[];
  rating: number;
  is_verified: boolean;
  image: string;
  website?: string;
  instagram?: string;
  founded_year?: string;
  created_at?: string;
  updated_at?: string;
};

export type Review = {
  id: string;
  brand_id: string;
  user_id?: string | null;
  author: string;
  comment: string;
  rating: number;
  date: string;
  created_at?: string;
  updated_at?: string;
};

export type Collection = {
  id: string;
  brand_id: string;
  title: string;
  image: string;
  description?: string;
};

export type Product = {
  id: string;
  title: string;
  description: string;
  price: number;
  sale_price?: number;
  image: string;
  brand_id: string;
  collection_id?: string;
  category: string;
  in_stock: boolean;
  sizes?: string[];
  colors?: string[];
  created_at: string;
};

export type Profile = {
  id: string;
  updated_at: string;
  username: string;
  avatar_url: string;
  first_name: string;
  last_name: string;
  bio: string;
  location: string;
  website: string;
  role: string; // 'user', 'designer', 'admin'
};

export type Order = {
  id: string;
  user_id: string;
  status: string;
  total: number;
  created_at: string;
};

export type OrderItem = {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  price: number;
  size?: string;
  color?: string;
};

export type Favorite = {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
};
