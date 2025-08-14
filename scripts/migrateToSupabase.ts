import { createClient } from "@supabase/supabase-js";
import { brandsData } from "../lib/data/brands";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

// Validate environment variables
if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing required environment variables");
  process.exit(1);
}

// Initialize Supabase client with service role key for admin privileges
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function migrateData() {
  console.log("Starting data migration to Supabase...");

  // Migrate brands
  for (const [id, brand] of Object.entries(brandsData)) {
    console.log(`Migrating brand: ${brand.name}`);

    // Insert brand
    const { data: brandData, error: brandError } = await supabase
      .from("brands")
      .insert({
        id,
        name: brand.name,
        description: brand.description,
        long_description: brand.longDescription,
        location: brand.location,
        price_range: brand.priceRange,
        category: brand.category,
        rating: brand.rating,
        is_verified: brand.isVerified,
        image: brand.collections[0]?.image || "", // Use first collection image as brand image
      })
      .select()
      .single();

    if (brandError) {
      console.error(`Error inserting brand ${id}:`, brandError);
      continue;
    }

    // Note: Reviews migration removed as BrandData interface doesn't include reviews
    // Reviews can be added separately through the reviews table

    // Migrate collections
    for (const collection of brand.collections) {
      const { error: collectionError } = await supabase
        .from("collections")
        .insert({
          brand_id: id,
          title: collection.title,
          image: collection.image,
        });

      if (collectionError) {
        console.error(`Error inserting collection for ${id}:`, collectionError);
      }
    }
  }

  console.log("Migration completed successfully!");
}

migrateData().catch(console.error);
