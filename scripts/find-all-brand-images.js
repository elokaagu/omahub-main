const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

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

async function findAllBrandImages() {
  try {
    console.log("🔍 Comprehensive search for ALL brand images...");
    
    // 1. Check all storage buckets for any image files
    console.log("\n📦 Step 1: Searching all storage buckets...");
    
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    if (bucketsError) {
      console.error("❌ Error listing buckets:", bucketsError);
    } else {
      console.log(`✅ Found ${buckets.length} storage buckets`);
      
      for (const bucket of buckets) {
        console.log(`\n🔍 Searching bucket: ${bucket.name}`);
        
        try {
          // List all files in this bucket
          const { data: files, error: listError } = await supabase.storage
            .from(bucket.name)
            .list("", { limit: 1000 });
          
          if (listError) {
            console.log(`   ❌ Error listing files: ${listError.message}`);
          } else {
            console.log(`   📁 Found ${files.length} files in bucket`);
            
            // Look for image files
            const imageFiles = files.filter(file => 
              file.name.match(/\.(jpg|jpeg|png|gif|webp|svg|ico)$/i) ||
              file.name.includes('brand') ||
              file.name.includes('logo') ||
              file.name.includes('image')
            );
            
            if (imageFiles.length > 0) {
              console.log(`   🖼️ Found ${imageFiles.length} potential image files:`);
              imageFiles.slice(0, 10).forEach(file => {
                console.log(`      - ${file.name} (${file.metadata?.size || 'unknown size'} bytes)`);
              });
              if (imageFiles.length > 10) {
                console.log(`      ... and ${imageFiles.length - 10} more`);
              }
            }
          }
        } catch (bucketError) {
          console.log(`   ❌ Error accessing bucket: ${bucketError.message}`);
        }
      }
    }
    
    // 2. Check for any hidden or backup image fields in the database
    console.log("\n🗄️ Step 2: Checking database for hidden image fields...");
    
    // Get table structure for brands table
    try {
      const { data: columns, error: columnsError } = await supabase
        .rpc('get_table_columns', { table_name: 'brands' });
      
      if (columnsError) {
        console.log("   ⚠️ Couldn't get table structure, checking manually...");
        
        // Try to select all columns to see what exists
        const { data: sampleBrand, error: sampleError } = await supabase
          .from("brands")
          .select("*")
          .limit(1);
        
        if (!sampleError && sampleBrand && sampleBrand[0]) {
          const brandColumns = Object.keys(sampleBrand[0]);
          console.log(`   📋 Brand table columns: ${brandColumns.join(', ')}`);
          
          // Look for any image-related columns
          const imageColumns = brandColumns.filter(col => 
            col.includes('image') || 
            col.includes('logo') || 
            col.includes('photo') ||
            col.includes('picture') ||
            col.includes('media')
          );
          
          if (imageColumns.length > 0) {
            console.log(`   🖼️ Potential image columns found: ${imageColumns.join(', ')}`);
          }
        }
      } else {
        console.log(`   📋 Table columns: ${columns.map(c => c.column_name).join(', ')}`);
      }
    } catch (error) {
      console.log("   ⚠️ Couldn't check table structure");
    }
    
    // 3. Check if there are any backup or archive tables
    console.log("\n🗂️ Step 3: Checking for backup/archive tables...");
    
    try {
      const { data: tables, error: tablesError } = await supabase
        .rpc('get_all_tables');
      
      if (tablesError) {
        console.log("   ⚠️ Couldn't list all tables, checking common backup names...");
        
        // Check common backup table names
        const backupTableNames = [
          'brands_backup', 'brands_archive', 'brands_old', 'brands_previous',
          'brands_temp', 'brands_2024', 'brands_2023', 'brands_original'
        ];
        
        for (const tableName of backupTableNames) {
          try {
            const { data: backupData, error: backupError } = await supabase
              .from(tableName)
              .select("name, image")
              .limit(1);
            
            if (!backupError && backupData && backupData.length > 0) {
              console.log(`   🗂️ Found backup table: ${tableName}`);
              console.log(`      Sample data: ${backupData[0].name} - ${backupData[0].image}`);
            }
          } catch (e) {
            // Table doesn't exist, continue
          }
        }
      } else {
        console.log(`   📋 All tables: ${tables.map(t => t.table_name).join(', ')}`);
        
        // Look for backup tables
        const backupTables = tables.filter(t => 
          t.table_name.includes('brand') && 
          (t.table_name.includes('backup') || t.table_name.includes('archive') || t.table_name.includes('old'))
        );
        
        if (backupTables.length > 0) {
          console.log(`   🗂️ Found backup tables: ${backupTables.map(t => t.table_name).join(', ')}`);
        }
      }
    } catch (error) {
      console.log("   ⚠️ Couldn't check for backup tables");
    }
    
    // 4. Check if images might be stored as base64 or in JSON fields
    console.log("\n🔍 Step 4: Checking for embedded images...");
    
    try {
      const { data: brands, error: brandsError } = await supabase
        .from("brands")
        .select("id, name, image, created_at, updated_at");
      
      if (!brandsError && brands) {
        console.log(`   📋 Checking ${brands.length} brands for embedded data...`);
        
        // Look for brands with very long image URLs (might be base64)
        const longImageBrands = brands.filter(b => 
          b.image && b.image.length > 200
        );
        
        if (longImageBrands.length > 0) {
          console.log(`   🔍 Found ${longImageBrands.length} brands with long image data:`);
          longImageBrands.forEach(brand => {
            console.log(`      ${brand.name}: ${brand.image.substring(0, 100)}...`);
          });
        }
        
        // Check for brands with recent updates (might have lost images)
        const recentBrands = brands.filter(b => 
          b.updated_at && new Date(b.updated_at) > new Date('2025-01-01')
        );
        
        if (recentBrands.length > 0) {
          console.log(`   📅 Found ${recentBrands.length} brands updated in 2025:`);
          recentBrands.slice(0, 5).forEach(brand => {
            console.log(`      ${brand.name}: Updated ${brand.updated_at}`);
          });
        }
      }
    } catch (error) {
      console.log("   ❌ Error checking brands:", error.message);
    }
    
    // 5. Check if there are any image URLs in other fields
    console.log("\n🔗 Step 5: Checking for image URLs in other fields...");
    
    try {
      const { data: allBrands, error: allBrandsError } = await supabase
        .from("brands")
        .select("*");
      
      if (!allBrandsError && allBrands && allBrands[0]) {
        const allColumns = Object.keys(allBrands[0]);
        console.log(`   📋 All brand columns: ${allColumns.join(', ')}`);
        
        // Check each column for potential image URLs
        for (const column of allColumns) {
          if (column !== 'image' && column !== 'id' && column !== 'created_at' && column !== 'updated_at') {
            const columnValues = allBrands
              .map(b => b[column])
              .filter(v => v && typeof v === 'string' && v.includes('http'))
              .slice(0, 3);
            
            if (columnValues.length > 0) {
              console.log(`   🔗 Column '${column}' contains URLs: ${columnValues.join(', ')}`);
            }
          }
        }
      }
    } catch (error) {
      console.log("   ❌ Error checking other fields:", error.message);
    }
    
    console.log("\n🎯 Search completed! Check the output above for any hidden images.");
    
  } catch (error) {
    console.error("❌ Error in findAllBrandImages:", error);
  }
}

// Run the search
findAllBrandImages().then(() => {
  console.log("\n🏁 Script completed");
  process.exit(0);
}).catch((error) => {
  console.error("❌ Script failed:", error);
  process.exit(1);
});
