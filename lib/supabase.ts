import { createBrowserClient } from "@supabase/ssr";
import { AuthDebug } from "./utils/debug";

// Check if we're in a build process
const isBuildTime =
  typeof window === "undefined" &&
  process.env.NODE_ENV === "production" &&
  !process.env.NEXT_PUBLIC_SUPABASE_URL;

// Safely access environment variables with fallbacks
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ Missing Supabase environment variables:", {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseAnonKey,
    env: process.env.NODE_ENV,
  });
}

console.log("🔄 Supabase module loaded:", {
  hasUrl: !!supabaseUrl,
  hasKey: supabaseAnonKey ? supabaseAnonKey.substring(0, 10) + "..." : false,
  env: process.env.NODE_ENV,
  isBuildTime,
});

// Create a function to initialize the Supabase client
const createClient = () => {
  if (typeof window === "undefined") {
    console.log("🖥️ Server-side rendering, creating client for hydration");
  }

  // Check if environment variables are available
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase environment variables not available");
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: "pkce",
      debug: false, // Disable debug to reduce console noise
      // Remove custom storageKey to let Supabase handle cookies naturally
    },
    global: {
      fetch: fetch,
      headers: {
        "x-application-name": "omahub",
      },
    },
  });
};

// Lazy client instance - only created when first accessed
let _supabase: ReturnType<typeof createClient> | null = null;

// Get the Supabase client instance (lazy initialization)
export const getSupabaseClient = () => {
  if (!_supabase) {
    try {
      // Only create client in browser environment
      if (typeof window === "undefined") {
        console.log("🖥️ Server-side rendering, skipping client creation");
        return null;
      }
      
      // Check if environment variables are available
      if (!supabaseUrl || !supabaseAnonKey) {
        console.error("❌ Missing Supabase environment variables");
        return null;
      }
      
      _supabase = createClient();
      console.log("✅ Supabase client created successfully");
    } catch (error) {
      console.error("❌ Failed to create Supabase client:", error);
      return null;
    }
  }
  return _supabase;
};

// Export the client instance directly (for backward compatibility)
export const supabase = getSupabaseClient() || (() => {
  console.error("Supabase client not available");
  return null;
})();

// Helper function to check if client is available
export const isSupabaseAvailable = () => !!getSupabaseClient();

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
export type BrandImage = {
  id: string;
  brand_id: string;
  role: string;
  storage_path: string;
  created_at: string;
  updated_at: string;
};

export type Brand = {
  id: string;
  name: string;
  description: string;
  long_description?: string;
  location: string;
  price_range: string;
  currency: string;
  category: string;
  categories: string[];
  rating?: number;
  is_verified: boolean;
  image?: string;
  brand_images?: BrandImage[];
  products?: any[];
  video_url?: string;
  video_thumbnail?: string;
  created_at: string;
  updated_at: string;
};

export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  sale_price?: number;
  currency: string;
  category: string;
  categories: string[];
  brand_id: string;
  brand?: Brand;
  images?: string[];
  is_custom: boolean;
  created_at: string;
  updated_at: string;
};

export type Collection = {
  id: string;
  name: string;
  description: string;
  brand_id: string;
  brand?: Brand;
  products?: Product[];
  created_at: string;
  updated_at: string;
};

export type Tailor = {
  id: string;
  user_id: string;
  brand_id: string;
  brand?: Brand;
  created_at: string;
  updated_at: string;
};

export type User = {
  id: string;
  email: string;
  role: string;
  created_at: string;
  updated_at: string;
};

export type Profile = {
  id: string;
  user_id: string;
  full_name?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
};

export type Inquiry = {
  id: string;
  brand_id: string;
  brand?: Brand;
  inquiry_type: string;
  priority: string;
  status: string;
  message: string;
  contact_email: string;
  contact_name: string;
  created_at: string;
  updated_at: string;
};

export type Review = {
  id: string;
  product_id: string;
  product?: Product;
  user_id: string;
  user?: User;
  rating: number;
  comment?: string;
  created_at: string;
  updated_at: string;
};

export type Favourite = {
  id: string;
  user_id: string;
  item_id: string;
  item_type: string;
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      brands: {
        Row: Brand;
        Insert: Omit<Brand, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Brand, "id" | "created_at" | "updated_at">>;
      };
      products: {
        Row: Product;
        Insert: Omit<Product, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Product, "id" | "created_at" | "updated_at">>;
      };
      collections: {
        Row: Collection;
        Insert: Omit<Collection, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Collection, "id" | "created_at" | "updated_at">>;
      };
      tailors: {
        Row: Tailor;
        Insert: Omit<Tailor, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Tailor, "id" | "created_at" | "updated_at">>;
      };
      users: {
        Row: User;
        Insert: Omit<User, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<User, "id" | "created_at" | "updated_at">>;
      };
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Profile, "id" | "created_at" | "updated_at">>;
      };
      inquiries: {
        Row: Inquiry;
        Insert: Omit<Inquiry, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Inquiry, "id" | "created_at" | "updated_at">>;
      };
      reviews: {
        Row: Review;
        Insert: Omit<Review, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Review, "id" | "created_at" | "updated_at">>;
      };
      favourites: {
        Row: Favourite;
        Insert: Omit<Favourite, "id" | "created_at">;
        Update: Partial<Omit<Favourite, "id" | "created_at">>;
      };
      brand_images: {
        Row: BrandImage;
        Insert: Omit<BrandImage, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<BrandImage, "id" | "created_at" | "updated_at">>;
      };
    };
  };
};
