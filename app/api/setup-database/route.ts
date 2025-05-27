import { NextResponse } from "next/server";
import { fixStorageRLS, createProductsTable } from "@/lib/supabase-admin";
import { setupStorage } from "@/lib/supabase-storage-setup";

export async function GET() {
  try {
    // Set up storage buckets
    await setupStorage();

    // Fix RLS policies for storage buckets
    const rlsResult = await fixStorageRLS();

    // Create products table if it doesn't exist
    const productsResult = await createProductsTable();

    return NextResponse.json({
      success: true,
      storageRls: rlsResult,
      productsTable: productsResult,
    });
  } catch (error) {
    console.error("Error setting up database:", error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
