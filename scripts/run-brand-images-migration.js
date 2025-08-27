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

async function runBrandImagesMigration() {
  try {
    console.log("🚀 Running brand_images table migration...");
    console.log("=".repeat(70));
    console.log("This will create the new table and migrate existing data");
    console.log("");

    // Step 1: Check if table already exists
    console.log("📋 Step 1: Checking if brand_images table exists...");

    try {
      const { data: existing, error: checkError } = await supabase
        .from("brand_images")
        .select("count")
        .limit(1);

      if (!checkError) {
        console.log("✅ brand_images table already exists");
        console.log("🔄 Checking if data migration is needed...");
      } else {
        console.log(
          "❌ Table does not exist, cannot proceed with this approach"
        );
        console.log(
          "💡 You need to run the SQL migration manually in your Supabase dashboard"
        );
        console.log("\n📝 SQL to run:");
        console.log(`
-- Run this in your Supabase SQL editor:

-- Step 1: Create the brand_images table
CREATE TABLE IF NOT EXISTS public.brand_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'cover',
  storage_path text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestampz DEFAULT now(),
  UNIQUE (brand_id, role)
);

-- Step 2: Add indexes
CREATE INDEX IF NOT EXISTS idx_brand_images_brand_id ON public.brand_images(brand_id);
CREATE INDEX IF NOT EXISTS idx_brand_images_role ON public.brand_images(role);
CREATE INDEX IF NOT EXISTS idx_brand_images_storage_path ON public.brand_images(storage_path);

-- Step 3: Enable RLS
ALTER TABLE public.brand_images ENABLE ROW LEVEL SECURITY;

-- Step 4: Add RLS policies
CREATE POLICY "Users can view all brand images" ON public.brand_images
  FOR SELECT USING (true);

CREATE POLICY "Brand owners can manage their own brand images" ON public.brand_images
  FOR ALL USING (
    brand_id IN (
      SELECT id FROM public.brands 
      WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Super admins can manage all brand images" ON public.brand_images
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE user_id = auth.uid() AND role = 'super_admin'
    )
  );

-- Step 5: Migrate existing data
INSERT INTO public.brand_images (brand_id, role, storage_path)
SELECT 
  id, 
  'cover', 
  CASE 
    WHEN image LIKE '%/storage/v1/object/public/brand-assets/%' 
    THEN regexp_replace(image, '^.*/storage/v1/object/public/brand-assets/', '')
    WHEN image LIKE '%/storage/v1/object/public/omahub/%' 
    THEN regexp_replace(image, '^.*/storage/v1/object/public/omahub/', '')
    ELSE image
  END
FROM public.brands
WHERE image IS NOT NULL AND image != '';
        `);
        return;
      }
    } catch (error) {
      console.log("❌ Error checking table:", error.message);
      console.log("💡 You need to run the SQL migration manually");
      return;
    }

    // Step 2: Check if data migration is needed
    console.log("\n🔄 Step 2: Checking migration status...");

    const { data: totalBrands, error: brandsError } = await supabase
      .from("brands")
      .select("id, name, image")
      .not("image", "is", null);

    if (brandsError) {
      console.error("❌ Error fetching brands:", brandsError.message);
      return;
    }

    const { data: totalBrandImages, error: imagesError } = await supabase
      .from("brand_images")
      .select("brand_id, role, storage_path");

    if (imagesError) {
      console.error("❌ Error fetching brand images:", imagesError.message);
      return;
    }

    console.log(`📊 Current status:`);
    console.log(`   📦 Brands with old image field: ${totalBrands.length}`);
    console.log(
      `   🖼️ Entries in brand_images table: ${totalBrandImages.length}`
    );

    if (totalBrandImages.length >= totalBrands.length) {
      console.log("✅ Migration appears to be complete!");
      console.log("🚀 You can now start using the new BrandImageService");
      return;
    }

    // Step 3: Migrate remaining data
    console.log("\n🔄 Step 3: Migrating remaining brand images...");

    const migratedBrandIds = totalBrandImages.map((img) => img.brand_id);
    const brandsToMigrate = totalBrands.filter(
      (brand) => !migratedBrandIds.includes(brand.id)
    );

    console.log(`📦 Brands still needing migration: ${brandsToMigrate.length}`);

    let migratedCount = 0;
    for (const brand of brandsToMigrate) {
      if (!brand.image) continue;

      // Extract storage path from URL
      let storagePath = brand.image;
      if (brand.image.includes("/storage/v1/object/public/brand-assets/")) {
        storagePath = brand.image.replace(
          /^.*\/storage\/v1\/object\/public\/brand-assets\//,
          ""
        );
      } else if (brand.image.includes("/storage/v1/object/public/omahub/")) {
        storagePath = brand.image.replace(
          /^.*\/storage\/v1\/object\/public\/omahub\//,
          ""
        );
      }

      // Insert into brand_images table
      const { error: insertError } = await supabase
        .from("brand_images")
        .insert({
          brand_id: brand.id,
          role: "cover",
          storage_path: storagePath,
        });

      if (insertError) {
        console.log(
          `⚠️ Could not migrate ${brand.name}: ${insertError.message}`
        );
      } else {
        migratedCount++;
        console.log(`✅ Migrated: ${brand.name}`);
      }
    }

    console.log(`\n🎯 Migration completed!`);
    console.log(`   📊 Total migrated: ${migratedCount}`);
    console.log(`   🚀 You can now start using the new BrandImageService`);
  } catch (error) {
    console.error("❌ Migration failed:", error.message);
    console.log(
      "\n💡 Alternative: Run the SQL manually in your Supabase dashboard"
    );
  }
}

// Run the migration
runBrandImagesMigration()
  .then(() => {
    console.log("\n🏁 Script completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });
