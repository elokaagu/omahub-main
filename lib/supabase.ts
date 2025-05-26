import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

// Create a single supabase client for interacting with your database on the client side
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

// Types based on your current data model
export type Brand = {
  id: string;
  name: string;
  description: string;
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
