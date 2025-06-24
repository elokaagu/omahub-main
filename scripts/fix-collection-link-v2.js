const { createClient } = require("@supabase/supabase-js");
const { v4: uuidv4 } = require("uuid");

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

    // Generate a proper UUID for the new collection
    const newCollectionId = uuidv4();
    console.log("🆔 Generated new UUID:", newCollectionId);

    // Create a new collection with explicit UUID
    const { data: newCollection, error: createError } = await supabase
      .from("collections")
      .insert({
        id: newCollectionId,
        brand_id: existingCollection.brand_id,
        title: existingCollection.title,
        image: existingCollection.image,
        description: existingCollection.description,
      })
      .select()
      .single();

    if (createError) {
      console.error("❌ Error creating new collection:", createError);
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
      return;
    }

    console.log("✅ Successfully linked product to new collection");

    // Delete the old collection
    console.log("\n🗑️ Removing old collection...");
    const { error: deleteError } = await supabase
      .from("collections")
      .delete()
      .eq("id", "detty-december");

    if (deleteError) {
      console.error("❌ Error deleting old collection:", deleteError);
      console.log("⚠️ You may need to manually remove the old collection");
    } else {
      console.log("✅ Removed old collection");
    }

    console.log("\n🎉 Collection-product linking fixed!");
    console.log("✅ New collection ID:", newCollection.id);
    console.log("✅ Product successfully linked to collection");

    // Verify the fix
    console.log("\n🔍 Verifying the fix...");
    const { data: verifyProduct } = await supabase
      .from("products")
      .select("*, collection:collections(*)")
      .eq("brand_id", "ehbs-couture")
      .single();

    if (verifyProduct && verifyProduct.collection) {
      console.log(
        "✅ Verification successful - product is linked to collection:"
      );
      console.log("   Product:", verifyProduct.title);
      console.log("   Collection:", verifyProduct.collection.title);
    } else {
      console.log("❌ Verification failed - product not properly linked");
    }
  } catch (err) {
    console.error("❌ Unexpected error:", err);
  }
}

fixCollectionLink();
