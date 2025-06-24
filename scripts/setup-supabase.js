#!/usr/bin/env node

const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

// Configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing required environment variables:");
  if (!supabaseUrl) console.error("- NEXT_PUBLIC_SUPABASE_URL");
  if (!supabaseServiceKey) console.error("- SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

// Initialize Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  console.log("Starting OmaHub Supabase setup...");

  try {
    // 1. Setup storage buckets
    console.log("Setting up storage buckets...");
    await setupStorageBuckets();

    // 2. Fix RLS policies
    console.log("Configuring RLS policies...");
    await setupRLSPolicies();

    // 3. Create missing tables
    console.log("Creating missing tables...");
    await setupTables();

    console.log("Setup completed successfully!");
  } catch (error) {
    console.error("Setup failed:", error);
    process.exit(1);
  }
}

// Setup storage buckets
async function setupStorageBuckets() {
  // List existing buckets
  const { data: buckets, error: listError } =
    await supabase.storage.listBuckets();

  if (listError) {
    throw new Error(`Failed to list buckets: ${listError.message}`);
  }

  console.log(`Found ${buckets.length} existing buckets`);

  // Create brand-assets bucket if it doesn't exist
  if (!buckets.find((bucket) => bucket.name === "brand-assets")) {
    console.log("Creating brand-assets bucket...");
    const { error } = await supabase.storage.createBucket("brand-assets", {
      public: true,
      fileSizeLimit: 5242880, // 5MB
    });

    if (error) {
      throw new Error(`Failed to create brand-assets bucket: ${error.message}`);
    }
    console.log("Created brand-assets bucket");
  } else {
    console.log("brand-assets bucket already exists");
  }

  // Create profiles bucket if it doesn't exist
  if (!buckets.find((bucket) => bucket.name === "profiles")) {
    console.log("Creating profiles bucket...");
    const { error } = await supabase.storage.createBucket("profiles", {
      public: true,
      fileSizeLimit: 5242880, // 5MB
    });

    if (error) {
      throw new Error(`Failed to create profiles bucket: ${error.message}`);
    }
    console.log("Created profiles bucket");
  } else {
    console.log("profiles bucket already exists");
  }
}

// Setup RLS policies
async function setupRLSPolicies() {
  // Enable RLS on buckets table
  try {
    await supabase.rpc("set_rls_enabled", {
      table_name: "buckets",
      enabled: true,
      schema_name: "storage",
    });
    console.log("Enabled RLS on storage.buckets");
  } catch (error) {
    console.warn("Could not set RLS on buckets:", error.message);
  }

  // Create policies for brand-assets bucket
  try {
    // Public read policy
    await supabase.rpc("create_storage_policy", {
      bucket_name: "brand-assets",
      policy_name: "Public Read Policy",
      definition: "true", // Allow anyone to read
      operation: "SELECT",
    });
    console.log("Created read policy for brand-assets");

    // Authenticated insert policy
    await supabase.rpc("create_storage_policy", {
      bucket_name: "brand-assets",
      policy_name: "Auth Insert Policy",
      definition: "auth.role() = 'authenticated'",
      operation: "INSERT",
    });
    console.log("Created insert policy for brand-assets");
  } catch (error) {
    console.warn("Could not create policies for brand-assets:", error.message);
  }

  // Create policies for profiles bucket
  try {
    // Public read policy
    await supabase.rpc("create_storage_policy", {
      bucket_name: "profiles",
      policy_name: "Public Read Policy",
      definition: "true",
      operation: "SELECT",
    });
    console.log("Created read policy for profiles");

    // Authenticated insert policy
    await supabase.rpc("create_storage_policy", {
      bucket_name: "profiles",
      policy_name: "Auth Insert Policy",
      definition: "auth.role() = 'authenticated'",
      operation: "INSERT",
    });
    console.log("Created insert policy for profiles");
  } catch (error) {
    console.warn("Could not create policies for profiles:", error.message);
  }
}

// Setup missing tables
async function setupTables() {
  try {
    // Check if products table exists by trying to query it
    const { data, error } = await supabase
      .from("products")
      .select("id")
      .limit(1);

    // If we get here with no error, the table exists
    if (!error) {
      console.log("Products table already exists");
      return;
    }

    // If error code indicates table doesn't exist, create it
    if (error && error.code === "42P01") {
      console.log("Products table doesn't exist, creating it...");

      // Try using the RPC method to execute SQL
      try {
        const { error: createError } = await supabase.rpc("exec_sql", {
          sql: `
            CREATE TABLE IF NOT EXISTS public.products (
              id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
              title TEXT NOT NULL,
              description TEXT NOT NULL,
              price DECIMAL(10, 2) NOT NULL,
              sale_price DECIMAL(10, 2),
              image TEXT NOT NULL,
              brand_id TEXT REFERENCES public.brands(id) ON DELETE CASCADE,
              collection_id TEXT REFERENCES public.collections(id) ON DELETE SET NULL,
              category TEXT NOT NULL,
              in_stock BOOLEAN DEFAULT true,
              sizes TEXT[] DEFAULT '{}',
              colors TEXT[] DEFAULT '{}',
              created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
            );
            
            -- Enable row level security
            ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
            
            -- Create policies
            CREATE POLICY "Anyone can view products" 
              ON public.products FOR SELECT 
              USING (true);
            
            CREATE POLICY "Authenticated users can insert products" 
              ON public.products FOR INSERT 
              TO authenticated 
              WITH CHECK (true);
            
            CREATE POLICY "Users can update their own products" 
              ON public.products FOR UPDATE 
              TO authenticated 
              USING (
                EXISTS (
                  SELECT 1 FROM public.brands b 
                  WHERE b.id = brand_id
                )
              );
          `,
        });

        if (createError) {
          throw createError;
        }

        console.log("Products table created successfully with RLS policies");
      } catch (rpcError) {
        console.log(
          "RPC method failed, you need to create the products table manually."
        );
        console.log("Error details:", rpcError.message);
        console.log(
          "\nTo create the products table, run the following SQL in your Supabase SQL editor:"
        );
        console.log(`
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  sale_price DECIMAL(10, 2),
  image TEXT NOT NULL,
  brand_id TEXT REFERENCES public.brands(id) ON DELETE CASCADE,
  collection_id TEXT REFERENCES public.collections(id) ON DELETE SET NULL,
  category TEXT NOT NULL,
  in_stock BOOLEAN DEFAULT true,
  sizes TEXT[] DEFAULT '{}',
  colors TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable row level security
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view products" 
  ON public.products FOR SELECT 
  USING (true);

CREATE POLICY "Authenticated users can insert products" 
  ON public.products FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

CREATE POLICY "Users can update their own products" 
  ON public.products FOR UPDATE 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.brands b 
      WHERE b.id = brand_id
    )
  );
        `);
      }
    } else {
      throw new Error(
        `Unexpected error checking products table: ${error.message}`
      );
    }
  } catch (error) {
    console.error("Error setting up products table:", error);
    throw error;
  }
}

// Run the script
main();
