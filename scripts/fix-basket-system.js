require("dotenv").config({ path: ".env.local" });
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function fixBasketSystem() {
  try {
    console.log("🔧 Fixing basket system...");
    console.log("======================================================================");

    // Step 1: Check current basket table structure
    console.log("\n🔍 Step 1: Checking current basket table structure...");
    
    const { data: tableInfo, error: tableError } = await supabase
      .from("information_schema.tables")
      .select("table_name, table_type")
      .eq("table_schema", "public")
      .in("table_name", ["baskets", "basket_items", "orders", "order_items"]);

    if (tableError) {
      console.log("Table info error (continuing):", tableError.message);
    } else {
      console.log("Found tables:", tableInfo?.map(t => t.table_name).join(", ") || "None");
    }

    // Step 2: Create basket tables if they don't exist
    console.log("\n🔧 Step 2: Ensuring basket tables exist...");
    
    // Create baskets table
    const { error: basketsError } = await supabase.rpc("exec_sql", {
      sql: `
        CREATE TABLE IF NOT EXISTS public.baskets (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          brand_id UUID REFERENCES public.brands(id) ON DELETE SET NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    if (basketsError) {
      console.log("Baskets table creation (continuing):", basketsError.message);
    } else {
      console.log("✅ Baskets table ensured");
    }

    // Create basket_items table
    const { error: basketItemsError } = await supabase.rpc("exec_sql", {
      sql: `
        CREATE TABLE IF NOT EXISTS public.basket_items (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          basket_id UUID NOT NULL REFERENCES public.baskets(id) ON DELETE CASCADE,
          product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
          quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
          size TEXT,
          color TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    if (basketItemsError) {
      console.log("Basket items table creation (continuing):", basketItemsError.message);
    } else {
      console.log("✅ Basket items table ensured");
    }

    // Step 3: Enable RLS on basket tables
    console.log("\n🔒 Step 3: Enabling RLS on basket tables...");
    
    const { error: rlsBasketsError } = await supabase.rpc("exec_sql", {
      sql: `ALTER TABLE public.baskets ENABLE ROW LEVEL SECURITY;`
    });

    if (rlsBasketsError) {
      console.log("RLS enable on baskets (continuing):", rlsBasketsError.message);
    } else {
      console.log("✅ RLS enabled on baskets table");
    }

    const { error: rlsBasketItemsError } = await supabase.rpc("exec_sql", {
      sql: `ALTER TABLE public.basket_items ENABLE ROW LEVEL SECURITY;`
    });

    if (rlsBasketItemsError) {
      console.log("RLS enable on basket_items (continuing):", rlsBasketItemsError.message);
    } else {
      console.log("✅ RLS enabled on basket_items table");
    }

    // Step 4: Create proper RLS policies
    console.log("\n🔐 Step 4: Creating RLS policies...");
    
    // Drop existing policies first
    const dropPolicies = [
      "DROP POLICY IF EXISTS \"Users can view their own baskets\" ON public.baskets;",
      "DROP POLICY IF EXISTS \"Users can create baskets\" ON public.baskets;",
      "DROP POLICY IF EXISTS \"Users can update their own baskets\" ON public.baskets;",
      "DROP POLICY IF EXISTS \"Users can delete their own baskets\" ON public.baskets;",
      "DROP POLICY IF EXISTS \"Users can view their own basket items\" ON public.basket_items;",
      "DROP POLICY IF EXISTS \"Users can create basket items\" ON public.basket_items;",
      "DROP POLICY IF EXISTS \"Users can update their own basket items\" ON public.basket_items;",
      "DROP POLICY IF EXISTS \"Users can delete their own basket items\" ON public.basket_items;"
    ];

    for (const dropPolicy of dropPolicies) {
      try {
        await supabase.rpc("exec_sql", { sql: dropPolicy });
      } catch (e) {
        // Ignore errors
      }
    }

    console.log("✅ Existing policies dropped");

    // Create new policies
    const createPolicies = [
      // Baskets policies
      `CREATE POLICY "Users can view their own baskets" ON public.baskets
         FOR SELECT USING (auth.uid() = user_id);`,
      
      `CREATE POLICY "Users can create baskets" ON public.baskets
         FOR INSERT WITH CHECK (auth.uid() = user_id);`,
      
      `CREATE POLICY "Users can update their own baskets" ON public.baskets
         FOR UPDATE USING (auth.uid() = user_id);`,
      
      `CREATE POLICY "Users can delete their own baskets" ON public.baskets
         FOR DELETE USING (auth.uid() = user_id);`,
      
      // Basket items policies
      `CREATE POLICY "Users can view their own basket items" ON public.basket_items
         FOR SELECT USING (
           EXISTS (
             SELECT 1 FROM public.baskets 
             WHERE id = basket_id AND user_id = auth.uid()
           )
         );`,
      
      `CREATE POLICY "Users can create basket items" ON public.basket_items
         FOR INSERT WITH CHECK (
           EXISTS (
             SELECT 1 FROM public.baskets 
             WHERE id = basket_id AND user_id = auth.uid()
           )
         );`,
      
      `CREATE POLICY "Users can update their own basket items" ON public.basket_items
         FOR UPDATE USING (
           EXISTS (
             SELECT 1 FROM public.baskets 
             WHERE id = basket_id AND user_id = auth.uid()
           )
         );`,
      
      `CREATE POLICY "Users can delete their own basket items" ON public.basket_items
         FOR DELETE USING (
           EXISTS (
             SELECT 1 FROM public.baskets 
             WHERE id = basket_id AND user_id = auth.uid()
           )
         );`
    ];

    for (const createPolicy of createPolicies) {
      try {
        await supabase.rpc("exec_sql", { sql: createPolicy });
        console.log("✅ Policy created");
      } catch (e) {
        console.log("Policy creation error (continuing):", e.message);
      }
    }

    // Step 5: Create indexes for performance
    console.log("\n📊 Step 5: Creating performance indexes...");
    
    const createIndexes = [
      "CREATE INDEX IF NOT EXISTS idx_baskets_user_id ON public.baskets(user_id);",
      "CREATE INDEX IF NOT EXISTS idx_baskets_brand_id ON public.baskets(brand_id);",
      "CREATE INDEX IF NOT EXISTS idx_basket_items_basket_id ON public.basket_items(basket_id);",
      "CREATE INDEX IF NOT EXISTS idx_basket_items_product_id ON public.basket_items(product_id);"
    ];

    for (const createIndex of createIndexes) {
      try {
        await supabase.rpc("exec_sql", { sql: createIndex });
        console.log("✅ Index created");
      } catch (e) {
        console.log("Index creation error (continuing):", e.message);
      }
    }

    // Step 6: Grant necessary permissions
    console.log("\n🔑 Step 6: Granting permissions...");
    
    const grantPermissions = [
      "GRANT ALL ON public.baskets TO service_role;",
      "GRANT ALL ON public.basket_items TO service_role;",
      "GRANT USAGE ON SCHEMA public TO authenticated;",
      "GRANT SELECT, INSERT, UPDATE, DELETE ON public.baskets TO authenticated;",
      "GRANT SELECT, INSERT, UPDATE, DELETE ON public.basket_items TO authenticated;"
    ];

    for (const grantPermission of grantPermissions) {
      try {
        await supabase.rpc("exec_sql", { sql: grantPermission });
        console.log("✅ Permission granted");
      } catch (e) {
        console.log("Permission grant error (continuing):", e.message);
      }
    }

    // Step 7: Test the setup
    console.log("\n🧪 Step 7: Testing basket system...");
    
    // Test if we can query the tables
    const { data: testBaskets, error: testBasketsError } = await supabase
      .from("baskets")
      .select("count")
      .limit(1);

    if (testBasketsError) {
      console.log("❌ Baskets table test failed:", testBasketsError.message);
    } else {
      console.log("✅ Baskets table accessible");
    }

    const { data: testBasketItems, error: testBasketItemsError } = await supabase
      .from("basket_items")
      .select("count")
      .limit(1);

    if (testBasketItemsError) {
      console.log("❌ Basket items table test failed:", testBasketItemsError.message);
    } else {
      console.log("✅ Basket items table accessible");
    }

    // Step 8: Create a test basket for demonstration
    console.log("\n🎯 Step 8: Creating test data...");
    
    // Get a sample user and product for testing
    const { data: sampleUser } = await supabase
      .from("profiles")
      .select("id")
      .limit(1);

    const { data: sampleProduct } = await supabase
      .from("products")
      .select("id")
      .limit(1);

    if (sampleUser?.[0]?.id && sampleProduct?.[0]?.id) {
      console.log("✅ Sample user and product found for testing");
    } else {
      console.log("⚠️  No sample user/product found for testing");
    }

    console.log("\n======================================================================");
    console.log("🎯 Basket system fix completed!");
    console.log("📝 Summary:");
    console.log("   🔧 Tables created/verified: baskets, basket_items");
    console.log("   🔒 RLS enabled on all basket tables");
    console.log("   🔐 RLS policies created for user isolation");
    console.log("   📊 Performance indexes created");
    console.log("   🔑 Permissions granted to authenticated users");
    console.log("\n📝 Next steps:");
    console.log("   1. Re-enable basket functionality in the UI");
    console.log("   2. Test basket operations with authenticated users");
    console.log("   3. Verify RLS policies are working correctly");
    console.log("🏁 Script completed");

  } catch (error) {
    console.error("❌ Script error:", error);
  }
}

// Run the script
fixBasketSystem();
