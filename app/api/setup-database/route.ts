import { NextResponse } from "next/server";
import { createProductsTable } from "@/lib/supabase-admin";

// Check if we're in a build process
const isBuildTime =
  process.env.NODE_ENV === "production" &&
  (process.env.NEXT_PHASE === "phase-production-build" ||
    (process.env.VERCEL_ENV === "production" &&
      process.env.VERCEL_BUILD_STEP === "true"));

export async function GET() {
  // Skip actual database operations during build time
  if (isBuildTime) {
    console.log("Build-time detected, skipping database setup");
    return NextResponse.json({
      success: true,
      message: "Build-time skip: Database setup would run in production",
    });
  }

  try {
    // Create products table if it doesn't exist
    const result = await createProductsTable();

    return NextResponse.json({
      success: result.success,
      message: result.message || result.error,
    });
  } catch (error) {
    console.error("Error setting up database:", error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
