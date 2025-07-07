const { createClient } = require("@supabase/supabase-js");

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing Supabase environment variables");
  console.log("Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSpotlightSetup() {
  console.log("🔍 Checking Spotlight Setup...\n");

  try {
    // 1. Check if spotlight_content table exists
    console.log("1. Checking spotlight_content table...");
    const { data: tableData, error: tableError } = await supabase
      .from("spotlight_content")
      .select("*")
      .limit(1);

    if (tableError) {
      console.error("❌ spotlight_content table error:", tableError.message);
      if (tableError.code === "42P01") {
        console.log("   Table does not exist. Run the migration first.");
      }
    } else {
      console.log("✅ spotlight_content table exists");
    }

    // 2. Check storage buckets
    console.log("\n2. Checking storage buckets...");
    const { data: buckets, error: bucketsError } =
      await supabase.storage.listBuckets();

    if (bucketsError) {
      console.error("❌ Error fetching buckets:", bucketsError.message);
    } else {
      const spotlightImagesBucket = buckets.find(
        (b) => b.name === "spotlight-images"
      );
      const spotlightVideosBucket = buckets.find(
        (b) => b.name === "spotlight-videos"
      );

      if (spotlightImagesBucket) {
        console.log("✅ spotlight-images bucket exists");
      } else {
        console.log("❌ spotlight-images bucket missing");
      }

      if (spotlightVideosBucket) {
        console.log("✅ spotlight-videos bucket exists");
      } else {
        console.log("❌ spotlight-videos bucket missing");
      }
    }

    // 3. Check storage policies
    console.log("\n3. Checking storage policies...");
    const { data: policies, error: policiesError } = await supabase.rpc(
      "get_storage_policies"
    );

    if (policiesError) {
      console.log(
        "⚠️  Could not fetch storage policies:",
        policiesError.message
      );
    } else {
      const spotlightPolicies = policies?.filter(
        (p) =>
          p.bucket_name === "spotlight-videos" ||
          p.bucket_name === "spotlight-images"
      );

      if (spotlightPolicies && spotlightPolicies.length > 0) {
        console.log("✅ Found spotlight storage policies:");
        spotlightPolicies.forEach((p) => {
          console.log(`   - ${p.policy_name} (${p.bucket_name})`);
        });
      } else {
        console.log("❌ No spotlight storage policies found");
      }
    }

    // 4. Check current user profiles
    console.log("\n4. Checking user profiles...");
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, email, role")
      .limit(5);

    if (profilesError) {
      console.error("❌ Error fetching profiles:", profilesError.message);
    } else {
      console.log("✅ Found user profiles:");
      profiles.forEach((p) => {
        console.log(`   - ${p.email || "No email"}: ${p.role || "No role"}`);
      });

      const superAdmins = profiles.filter((p) => p.role === "super_admin");
      if (superAdmins.length > 0) {
        console.log(`✅ Found ${superAdmins.length} super admin(s)`);
      } else {
        console.log("❌ No super admins found");
      }
    }

    // 5. Test video upload permissions
    console.log("\n5. Testing video upload permissions...");
    try {
      const testFileName = "test-video-upload.mp4";
      const testFile = Buffer.from("test video content");

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("spotlight-videos")
        .upload(`test/${testFileName}`, testFile, {
          contentType: "video/mp4",
          upsert: true,
        });

      if (uploadError) {
        console.error("❌ Video upload test failed:", uploadError.message);
        if (uploadError.message.includes("policy")) {
          console.log("   This indicates storage policy issues");
        }
      } else {
        console.log("✅ Video upload test passed");

        // Clean up test file
        await supabase.storage
          .from("spotlight-videos")
          .remove([`test/${testFileName}`]);
      }
    } catch (testError) {
      console.error("❌ Video upload test error:", testError.message);
    }

    console.log("\n🎯 Diagnosis Complete!");
    console.log(
      "\nIf you see errors above, run the SQL fix in QUICK_VIDEO_UPLOAD_FIX.md"
    );
  } catch (error) {
    console.error("❌ Setup check failed:", error.message);
  }
}

checkSpotlightSetup();
