import { createClient } from "@supabase/supabase-js";

// Create a Supabase client with admin privileges
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

// Create a client with admin privileges (service role key)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Fix RLS policies for storage buckets
 */
export async function fixStorageRLS() {
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
  try {
    // Check if table exists first
    const { data: existingTable } = await supabaseAdmin
      .from("information_schema.tables")
      .select("table_name")
      .eq("table_name", "products")
      .eq("table_schema", "public");

    if (existingTable && existingTable.length > 0) {
      console.log("Products table already exists");
      return { success: true, message: "Table already exists" };
    }

    // Create products table
    await supabaseAdmin.rpc("create_products_table", {
      table_definition: `
        CREATE TABLE public.products (
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
        
        -- Create RLS policies for products
        ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
        
        -- Everyone can view products
        CREATE POLICY "Anyone can view products" 
          ON public.products FOR SELECT 
          USING (true);
        
        -- Only authenticated users can insert products
        CREATE POLICY "Authenticated users can insert products" 
          ON public.products FOR INSERT 
          TO authenticated 
          WITH CHECK (true);
        
        -- Only authenticated users can update their own products
        CREATE POLICY "Users can update their own products" 
          ON public.products FOR UPDATE 
          TO authenticated 
          USING (
            EXISTS (
              SELECT 1 FROM public.brands b 
              WHERE b.id = brand_id AND b.user_id = auth.uid()
            )
          );
      `,
    });

    return { success: true, message: "Products table created" };
  } catch (error) {
    console.error("Error creating products table:", error);
    return { success: false, error };
  }
}
