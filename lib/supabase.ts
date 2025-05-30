import { createBrowserClient } from "@supabase/ssr";

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

// For debugging in development
if (process.env.NODE_ENV !== "production") {
  console.log("🔑 Supabase URL:", supabaseUrl ? supabaseUrl : "Missing");
  console.log(
    "🔑 Supabase Key:",
    supabaseAnonKey ? supabaseAnonKey.substring(0, 10) + "..." : "Missing"
  );
}

// Create a browser client for client-side operations
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storageKey: "sb-auth-token",
    storage: {
      getItem: (key) => {
        try {
          const value = localStorage.getItem(key);
          if (!value) return null;

          // Handle base64 encoded values
          if (value.startsWith("base64-")) {
            try {
              const decodedValue = atob(value.slice(7));
              // Verify if it's valid JSON
              JSON.parse(decodedValue);
              return decodedValue;
            } catch (e) {
              console.warn("Failed to parse base64 auth data:", e);
              return null;
            }
          }

          return value;
        } catch (e) {
          console.error("Error reading auth storage:", e);
          return null;
        }
      },
      setItem: (key, value) => {
        try {
          // For session data, store as base64 to prevent JSON parsing issues
          const shouldEncode =
            key === "sb-auth-token" && value && typeof value === "string";
          const finalValue = shouldEncode ? `base64-${btoa(value)}` : value;
          localStorage.setItem(key, finalValue);
        } catch (e) {
          console.error("Error writing to auth storage:", e);
        }
      },
      removeItem: (key) => {
        try {
          localStorage.removeItem(key);
        } catch (e) {
          console.error("Error removing from auth storage:", e);
        }
      },
    },
  },
  global: {
    fetch: fetch,
  },
});

// Test the connection
if (typeof window !== "undefined" && !isBuildTime) {
  console.log("🔍 Testing Supabase connection...");

  supabase.auth.getSession().then(({ data, error }) => {
    if (error) {
      console.error("❌ Supabase auth test failed:", error);
    } else {
      console.log("✅ Supabase auth test successful", {
        hasSession: !!data.session,
      });
    }
  });

  // Test a simple database query
  supabase
    .from("brands")
    .select("*", { count: "exact", head: true })
    .then(({ data, error, count }) => {
      if (error) {
        console.error("❌ Supabase database test failed:", error);
      } else {
        console.log(
          "✅ Supabase database test successful. Brand count:",
          count
        );
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
