import { createBrowserClient } from "@supabase/ssr";
import { AuthDebug } from "./utils/debug";

// Check if we're in a build process
const isBuildTime =
  typeof window === "undefined" &&
  process.env.NODE_ENV === "production" &&
  !process.env.NEXT_PUBLIC_SUPABASE_URL;

// Safely access environment variables with fallbacks
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

console.log("🔄 Initializing Supabase client:", {
  hasUrl: !!supabaseUrl,
  hasKey: !!supabaseAnonKey.substring(0, 10) + "...",
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

  return createBrowserClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: "pkce",
      debug: process.env.NODE_ENV === "development",
    },
    global: {
      fetch: fetch,
      headers: {
        "x-application-name": "omahub",
        "Cache-Control": "no-cache",
      },
    },
    cookies: {
      get: (name: string) => {
        if (typeof document === "undefined") return undefined;

        // Get cookie value from document.cookie
        const value = document.cookie
          .split("; ")
          .find((row) => row.startsWith(`${name}=`))
          ?.split("=")[1];

        return value ? decodeURIComponent(value) : undefined;
      },
      set: (name: string, value: string, options: any) => {
        if (typeof document === "undefined") return;

        // Set cookie with proper options for Supabase auth
        const cookieOptions = {
          path: "/",
          maxAge: options?.maxAge || 60 * 60 * 24 * 7, // 7 days default
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
          ...options,
        };

        let cookieString = `${name}=${encodeURIComponent(value)}`;

        // Add options to cookie string
        Object.entries(cookieOptions).forEach(([key, val]) => {
          if (val !== undefined && val !== null) {
            cookieString += `; ${key}=${val}`;
          }
        });

        document.cookie = cookieString;
      },
      remove: (name: string, options: any) => {
        if (typeof document === "undefined") return;

        const cookieOptions = {
          path: "/",
          ...options,
        };

        let cookieString = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT`;

        Object.entries(cookieOptions).forEach(([key, val]) => {
          if (val !== undefined && val !== null) {
            cookieString += `; ${key}=${val}`;
          }
        });

        document.cookie = cookieString;
      },
    },
  });
};

// Create the client instance
export const supabase = createClient();

// Export a function to get a fresh client instance if needed
export const getSupabaseClient = () => createClient();

// Helper function to check if client is available
export const isSupabaseAvailable = () => !!supabase;

// Debug logging for development
if (process.env.NODE_ENV === "development") {
  console.log("🔧 Supabase client initialized:", {
    hasClient: !!supabase,
    url: supabaseUrl,
    hasAnonKey: !!supabaseAnonKey,
    isBrowser: typeof window !== "undefined",
  });
}

// Set up auth state change listener and run tests if in browser environment
if (supabase && typeof window !== "undefined") {
  // Set up auth state change listener
  supabase.auth.onAuthStateChange((event, session) => {
    AuthDebug.state(event, session);
    AuthDebug.session(session);
  });

  // Test the connection
  supabase.auth.getSession().then(({ data, error }) => {
    if (error) {
      AuthDebug.error("Supabase auth test failed", error);
    } else {
      AuthDebug.log("Supabase auth test successful", {
        hasSession: !!data.session,
      });
      AuthDebug.session(data.session);
    }
  });

  // Test a simple database query
  supabase
    .from("brands")
    .select("*", { count: "exact", head: true })
    .then(({ data, error, count }) => {
      if (error) {
        AuthDebug.error("Supabase database test failed", error);
      } else {
        AuthDebug.log("Supabase database test successful", {
          brandCount: count,
        });
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

export type Catalogue = {
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
  images?: string[]; // Multiple product images
  brand_id: string;
  catalogue_id?: string;
  category: string;
  in_stock: boolean;
  sizes?: string[];
  colors?: string[];
  materials?: string[];
  care_instructions?: string;
  is_custom?: boolean; // For tailored/custom pieces
  lead_time?: string; // e.g., "2-3 weeks"
  created_at?: string;
  updated_at?: string;
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
  owned_brands?: string[];
};

export type TailoringOrder = {
  id: string;
  user_id: string;
  product_id: string;
  brand_id: string;
  status: "pending" | "confirmed" | "in_progress" | "completed" | "cancelled";
  total_amount: number;
  currency: string;
  customer_notes?: string;
  brand_notes?: string;
  measurements: CustomerMeasurements;
  delivery_address: DeliveryAddress;
  estimated_completion?: string;
  created_at: string;
  updated_at?: string;
};

export type CustomerMeasurements = {
  // General measurements
  height?: string;
  weight?: string;

  // Upper body
  chest?: string;
  bust?: string;
  waist?: string;
  hips?: string;
  shoulder_width?: string;
  arm_length?: string;
  neck?: string;

  // Lower body
  inseam?: string;
  outseam?: string;
  thigh?: string;
  knee?: string;
  calf?: string;
  ankle?: string;

  // Additional notes
  fit_preference?: "slim" | "regular" | "loose";
  special_requirements?: string;
};

export type DeliveryAddress = {
  full_name: string;
  phone: string;
  email: string;
  address_line_1: string;
  address_line_2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
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
