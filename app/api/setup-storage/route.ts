import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-unified";

// Storage bucket configurations
const STORAGE_BUCKETS = [
  {
    name: "brand-assets",
    config: {
      public: true,
      fileSizeLimit: 10485760, // 10MB
      allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
    },
  },
  {
    name: "product-images",
    config: {
      public: true,
      fileSizeLimit: 10485760, // 10MB
      allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
    },
  },
  {
    name: "avatars",
    config: {
      public: true,
      fileSizeLimit: 5242880, // 5MB
      allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
    },
  },
  {
    name: "hero-images",
    config: {
      public: true,
      fileSizeLimit: 20971520, // 20MB
      allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
    },
  },
];

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      );
    }

    if (!["super_admin", "admin"].includes(profile.role)) {
      return NextResponse.json(
        { error: "Admin privileges required" },
        { status: 403 }
      );
    }

    console.log("🔧 Setting up storage buckets...");
    const results = [];

    for (const bucketConfig of STORAGE_BUCKETS) {
      try {
        console.log(`📦 Processing bucket: ${bucketConfig.name}`);

        // Check if bucket exists
        const { data: buckets, error: listError } =
          await supabase.storage.listBuckets();

        if (listError) {
          console.error(`❌ Error listing buckets:`, listError);
          results.push({
            bucket: bucketConfig.name,
            status: "error",
            message: `Failed to list buckets: ${listError.message}`,
          });
          continue;
        }

        const bucketExists = buckets?.some((b) => b.name === bucketConfig.name);

        if (!bucketExists) {
          // Create bucket
          const { data: createData, error: createError } =
            await supabase.storage.createBucket(
              bucketConfig.name,
              bucketConfig.config
            );

          if (createError) {
            console.error(
              `❌ Error creating bucket ${bucketConfig.name}:`,
              createError
            );
            results.push({
              bucket: bucketConfig.name,
              status: "error",
              message: `Failed to create: ${createError.message}`,
            });
            continue;
          }

          console.log(`✅ Created bucket: ${bucketConfig.name}`);
          results.push({
            bucket: bucketConfig.name,
            status: "created",
            message: "Bucket created successfully",
          });
        } else {
          console.log(`ℹ️ Bucket already exists: ${bucketConfig.name}`);
          results.push({
            bucket: bucketConfig.name,
            status: "exists",
            message: "Bucket already exists",
          });
        }

        // Test bucket access
        try {
          const testFile = new File(["test"], "test.txt", {
            type: "text/plain",
          });
          const testFileName = `test-${Date.now()}.txt`;

          const { error: uploadError } = await supabase.storage
            .from(bucketConfig.name)
            .upload(testFileName, testFile);

          if (uploadError) {
            console.warn(
              `⚠️ Upload test failed for ${bucketConfig.name}:`,
              uploadError
            );
          } else {
            // Clean up test file
            await supabase.storage
              .from(bucketConfig.name)
              .remove([testFileName]);
            console.log(`✅ Upload test successful for ${bucketConfig.name}`);
          }
        } catch (testError) {
          console.warn(
            `⚠️ Could not test bucket ${bucketConfig.name}:`,
            testError
          );
        }
      } catch (error) {
        console.error(
          `❌ Error processing bucket ${bucketConfig.name}:`,
          error
        );
        results.push({
          bucket: bucketConfig.name,
          status: "error",
          message: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    const successCount = results.filter(
      (r) => r.status === "created" || r.status === "exists"
    ).length;
    const errorCount = results.filter((r) => r.status === "error").length;

    console.log(
      `🎉 Storage setup complete: ${successCount} successful, ${errorCount} errors`
    );

    return NextResponse.json({
      success: true,
      message: `Storage setup complete: ${successCount} buckets configured, ${errorCount} errors`,
      results,
      summary: {
        total: STORAGE_BUCKETS.length,
        successful: successCount,
        errors: errorCount,
      },
    });
  } catch (error) {
    console.error("❌ Storage setup error:", error);
    return NextResponse.json(
      {
        error: "Storage setup failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
