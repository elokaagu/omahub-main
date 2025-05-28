import { createClient } from "@supabase/supabase-js";

// Create a Supabase client with admin privileges
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

// Create a client with admin privileges (service role key)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Check if we're in a build process
const isBuildTime =
  process.env.NODE_ENV === "production" &&
  (process.env.NEXT_PHASE === "phase-production-build" ||
    (process.env.VERCEL_ENV === "production" &&
      process.env.VERCEL_BUILD_STEP === "true"));

/**
 * Fix RLS policies for storage buckets
 */
export async function fixStorageRLS() {
  // Skip during build time
  if (isBuildTime) {
    console.log("Build-time detected, skipping fixStorageRLS operation");
    return {
      success: true,
      message: "Build-time skip: Storage RLS setup would run in production",
    };
  }

  try {
    // Enable RLS on the storage.buckets table
    await supabaseAdmin.rpc("set_rls_enabled", {
      table_name: "buckets",
      enabled: true,
      schema_name: "storage",
    });

    // Create policy for anon users to read from buckets
    await supabaseAdmin.rpc("create_storage_policy", {
      bucket_name: "brand-assets",
      policy_name: "Public Read",
      definition: "true", // Allow anyone to read
      operation: "SELECT",
    });

    // Create policy for authenticated users to insert/update in brand-assets
    await supabaseAdmin.rpc("create_storage_policy", {
      bucket_name: "brand-assets",
      policy_name: "Auth Insert",
      definition: 'auth.role() = "authenticated"',
      operation: "INSERT",
    });

    // Create similar policies for profiles bucket
    await supabaseAdmin.rpc("create_storage_policy", {
      bucket_name: "profiles",
      policy_name: "Public Read",
      definition: "true",
      operation: "SELECT",
    });

    await supabaseAdmin.rpc("create_storage_policy", {
      bucket_name: "profiles",
      policy_name: "Auth Insert",
      definition: 'auth.role() = "authenticated"',
      operation: "INSERT",
    });

    return { success: true };
  } catch (error) {
    console.error("Error fixing storage RLS:", error);
    return { success: false, error };
  }
}

/**
 * Create missing products table
 */
export async function createProductsTable() {
  // Skip during build time
  if (isBuildTime) {
    console.log("Build-time detected, skipping createProductsTable operation");
    return {
      success: true,
      message: "Build-time skip: Products table setup would run in production",
    };
  }

  try {
    const adminClient = await getAdminClient();
    if (!adminClient) {
      console.error("Failed to get admin client");
      return { success: false, error: "Failed to get admin client" };
    }

    try {
      // Try a more direct approach using SQL
      const createTableQuery = `
        -- Enable UUID extension
        CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
        
        -- Create products table if it doesn't exist
        CREATE TABLE IF NOT EXISTS public.products (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          title TEXT NOT NULL,
          description TEXT NOT NULL,
          price DECIMAL(10, 2) NOT NULL,
          sale_price DECIMAL(10, 2),
          image TEXT NOT NULL,
          brand_id TEXT REFERENCES public.brands(id) ON DELETE CASCADE,
          collection_id UUID REFERENCES public.collections(id) ON DELETE SET NULL,
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
        -- Only create policies if they don't exist
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT FROM pg_policies 
            WHERE tablename = 'products' AND policyname = 'Anyone can view products'
          ) THEN
            CREATE POLICY "Anyone can view products" ON public.products
              FOR SELECT USING (true);
          END IF;
          
          IF NOT EXISTS (
            SELECT FROM pg_policies 
            WHERE tablename = 'products' AND policyname = 'Authenticated users can insert products'
          ) THEN
            CREATE POLICY "Authenticated users can insert products" ON public.products
              FOR INSERT TO authenticated WITH CHECK (true);
          END IF;
          
          IF NOT EXISTS (
            SELECT FROM pg_policies 
            WHERE tablename = 'products' AND policyname = 'Users can update their own products'
          ) THEN
            CREATE POLICY "Users can update their own products" ON public.products
              FOR UPDATE TO authenticated USING (
                EXISTS (SELECT 1 FROM public.brands b WHERE b.id = brand_id)
              );
          END IF;
        END
        $$;
      `;

      // Execute the SQL directly
      try {
        const { error } = await adminClient.rpc("execute_sql", {
          sql: createTableQuery,
        });
        if (error) {
          console.log("SQL execution error:", error);
          console.log(
            "This is likely because the execute_sql function is not available"
          );
          console.log(
            "Please run the SQL script directly in the Supabase SQL editor:"
          );
          console.log(createTableQuery);

          return {
            success: false,
            error: error.message,
            message: "Please run the SQL manually in the Supabase SQL editor",
          };
        }
      } catch (execError) {
        console.log("Exception during SQL execution:", execError);
        console.log(
          "Please run the SQL script directly in the Supabase SQL editor:"
        );
        console.log(createTableQuery);

        return {
          success: false,
          error: String(execError),
          message: "Please run the SQL manually in the Supabase SQL editor",
        };
      }

      return {
        success: true,
        message: "Products table created or updated successfully",
      };
    } catch (sqlError) {
      console.error("Error in SQL execution:", sqlError);
      return {
        success: false,
        error: String(sqlError),
        message: "Please run the SQL manually in the Supabase SQL editor",
      };
    }
  } catch (error) {
    console.error("Error creating products table:", error);
    return { success: false, error: String(error) };
  }
}

// Get a client with admin privileges (reusable function)
export async function getAdminClient() {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing Supabase configuration");
      return null;
    }

    return createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  } catch (error) {
    console.error("Error creating admin client:", error);
    return null;
  }
}
