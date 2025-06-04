const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixCollectionLink() {
  try {
    console.log("🔧 Fixing collection-product linking...");

    // Option 1: Create a new collection with UUID
    console.log("\n📋 Creating new collection with UUID...");

    // First, get the existing collection data
    const { data: existingCollection } = await supabase
      .from("collections")
      .select("*")
      .eq("id", "detty-december")
      .single();

    if (!existingCollection) {
      console.error("❌ Existing collection not found");
      return;
    }

    console.log("✅ Found existing collection:", existingCollection.title);

    // Create a new collection with UUID
    const { data: newCollection, error: createError } = await supabase
      .from("collections")
      .insert({
        brand_id: existingCollection.brand_id,
        title: existingCollection.title,
        image: existingCollection.image,
        description: existingCollection.description,
      })
      .select()
      .single();

    if (createError) {
      console.error("❌ Error creating new collection:", createError);

      // If that fails, let's try updating the product to use null collection_id for now
      console.log(
        "\n🔄 Alternative: Setting collection_id to null and updating product..."
      );

      const { data: updatedProduct, error: updateError } = await supabase
        .from("products")
        .update({
          collection_id: null,
          description:
            existingCollection.description +
            " (Part of " +
            existingCollection.title +
            " collection)",
        })
        .eq("brand_id", "ehbs-couture")
        .select();

      if (updateError) {
        console.error("❌ Error updating product:", updateError);
      } else {
        console.log("✅ Updated product with collection info in description");
      }
      return;
    }

    console.log("✅ Created new collection with UUID:", newCollection.id);

    // Now update the product to use the new collection UUID
    const { data: updatedProduct, error: updateError } = await supabase
      .from("products")
      .update({ collection_id: newCollection.id })
      .eq("brand_id", "ehbs-couture")
      .select();

    if (updateError) {
      console.error("❌ Error linking product to new collection:", updateError);
    } else {
      console.log("✅ Successfully linked product to new collection");
      console.log("Updated product:", updatedProduct[0]);
    }

    // Delete the old collection
    console.log("\n🗑️ Removing old collection...");
    const { error: deleteError } = await supabase
      .from("collections")
      .delete()
      .eq("id", "detty-december");

    if (deleteError) {
      console.error("❌ Error deleting old collection:", deleteError);
    } else {
      console.log("✅ Removed old collection");
    }

    console.log("\n🎉 Collection-product linking fixed!");
    console.log("New collection ID:", newCollection.id);
  } catch (err) {
    console.error("❌ Unexpected error:", err);
  }
}

fixCollectionLink();
