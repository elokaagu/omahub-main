import { NextResponse } from "next/server";
import { createProductsTable } from "@/lib/supabase-admin";

export async function GET() {
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
