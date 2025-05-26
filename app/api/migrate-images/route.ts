import { NextRequest, NextResponse } from "next/server";
import migrateImageUrls from "@/lib/services/migrateImages";
import setupStorage from "@/lib/supabase-storage-setup";

export async function GET(request: NextRequest) {
  // Check for a secret key to prevent unauthorized access
  const authHeader = request.headers.get("authorization");

  if (
    !authHeader ||
    authHeader !== `Bearer ${process.env.MIGRATION_SECRET_KEY}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // First ensure storage buckets are properly set up
    await setupStorage();

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
