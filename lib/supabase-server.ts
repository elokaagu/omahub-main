import { createClient } from "@supabase/supabase-js";

// For server-side Supabase calls
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

// Check for required environment variables
if (!supabaseUrl || !supabaseKey) {
  console.error("Required Supabase environment variables are missing!");
}

export const supabaseServer = createClient(supabaseUrl, supabaseKey);
