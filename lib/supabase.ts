import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { AuthDebug } from "./utils/debug";

// Check if we're in a build process
const isBuildTime =
  process.env.NODE_ENV === "production" &&
  (process.env.NEXT_PHASE === "phase-production-build" ||
    (process.env.VERCEL_ENV === "production" &&
      process.env.VERCEL_BUILD_STEP === "true"));

// Safely access environment variables with fallbacks
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

console.log("🔄 Initializing Supabase client:", {
  url: supabaseUrl ? "✅ Present" : "❌ Missing",
  key: supabaseAnonKey ? "✅ Present" : "❌ Missing",
  env: process.env.NODE_ENV,
  isBuildTime,
});

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

  return createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      // Ensure PKCE flow is used for OAuth
      flowType: "pkce",
      // Disable automatic session detection from URL to prevent redirect loops
      detectSessionInUrl: false,
      // Persist session in localStorage
      persistSession: true,
      // Auto refresh tokens
      autoRefreshToken: true,
      // Storage key for session
      storageKey: "sb-auth-token",
      // Debug mode for development
      debug: process.env.NODE_ENV === "development",
      // Add storage options for better CSP compatibility
      storage: typeof window !== "undefined" ? window.localStorage : undefined,
    },
    global: {
      headers: {
        "X-Client-Info": "omahub-web",
        // Add CSP-compatible headers
        "X-Requested-With": "XMLHttpRequest",
      },
    },
    // Add realtime configuration
    realtime: {
      params: {
        eventsPerSecond: 2,
      },
    },
    // Add database configuration for better error handling
    db: {
      schema: "public",
    },
  });
};

// Initialize the client
export const supabase = createClient();

// Prevent multiple OAuth attempts
let oauthInProgress = false;

// Enhanced session management
export const getSession = async () => {
  if (!supabase) return null;

  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();
    if (error) {
      console.error("Error getting session:", error);
      return null;
    }
    return session;
  } catch (error) {
    console.error("Exception getting session:", error);
    return null;
  }
};

// Clear OAuth progress flag
export const clearOAuthProgress = () => {
  if (typeof window !== "undefined") {
    sessionStorage.removeItem("oauth_in_progress");
    oauthInProgress = false;
  }
};

// Check if OAuth is in progress
export const isOAuthInProgress = () => {
  if (typeof window !== "undefined") {
    return (
      sessionStorage.getItem("oauth_in_progress") === "true" || oauthInProgress
    );
  }
  return oauthInProgress;
};

// Set OAuth progress flag
export const setOAuthProgress = (inProgress: boolean) => {
  oauthInProgress = inProgress;
  if (typeof window !== "undefined") {
    if (inProgress) {
      sessionStorage.setItem("oauth_in_progress", "true");
    } else {
      sessionStorage.removeItem("oauth_in_progress");
    }
  }
};

// Enhanced error handling for auth operations
export const handleAuthError = (error: any) => {
  console.error("Auth error:", error);

  // Clear OAuth progress on any auth error
  clearOAuthProgress();

  // Handle specific error types
  if (error?.message?.includes("rate limit")) {
    throw new Error("Too many requests. Please wait a moment and try again.");
  }

  if (error?.message?.includes("code verifier")) {
    throw new Error(
      "Authentication session expired. Please try signing in again."
    );
  }

  throw error;
};

// Set up auth state change listener and run tests if in browser environment
if (supabase && typeof window !== "undefined") {
  console.log("🌐 Browser environment detected, setting up auth listener");

  // Auth state change listener
  supabase.auth.onAuthStateChange((event: any, session: any) => {
    console.log("🔄 Auth state changed:", event, session?.user?.email);
    AuthDebug.state(event, session);
  });

  // Test connection
  supabase.auth.getSession().then(({ data, error }: any) => {
    if (error) {
      console.error("❌ Error getting initial session:", error);
    } else {
      console.log(
        "✅ Initial session check:",
        data.session ? "Logged in" : "Not logged in"
      );
    }
  });

  // Test database connection
  supabase
    .from("profiles")
    .select("count", { count: "exact", head: true })
    .then(({ error }: any) => {
      if (error) {
        console.error("❌ Database connection test failed:", error);
      } else {
        console.log("✅ Database connection test passed");
      }
    });
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
