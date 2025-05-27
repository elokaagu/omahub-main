import { NextRequest, NextResponse } from "next/server";
import migrateImageUrls from "@/lib/services/migrateImages";
import setupStorage from "@/lib/supabase-storage-setup";

// Improved build time detection
const isBuildTime =
  process.env.NODE_ENV === "production" &&
  (process.env.NEXT_PHASE === "phase-production-build" ||
    (process.env.VERCEL_ENV === "production" &&
      process.env.VERCEL_BUILD_STEP === "true"));

// Mark this route as server-side only
export const dynamic = "force-dynamic";
// Disable static generation for this route
export const fetchCache = "force-no-store";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  // During build time, just return a dummy response
  if (isBuildTime) {
    console.log("Running in build process - skipping actual image migration");
    return NextResponse.json({
      success: true,
      message: "Build-time dummy response - actual migration runs at runtime",
      result: { brands: 0, collections: 0, products: 0, profiles: 0, total: 0 },
    });
  }

  try {
    // Check for a secret key to prevent unauthorized access
    const authHeader = request.headers.get("authorization");

    if (
      !authHeader ||
      authHeader !== `Bearer ${process.env.MIGRATION_SECRET_KEY}`
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // First ensure storage buckets are properly set up
    try {
      await setupStorage();
    } catch (storageError) {
      console.warn(
        "Storage setup failed, but continuing with migration:",
        storageError
      );
    }

    // Then run the migration
    const result = await migrateImageUrls();

    return NextResponse.json({
      success: true,
      message: "Image URL migration completed successfully",
      result,
    });
  } catch (error) {
    console.error("Error in migration API route:", error);
    return NextResponse.json(
      {
        error: "Migration failed",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
