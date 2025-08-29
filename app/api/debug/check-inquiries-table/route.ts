import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Check if inquiries table exists by trying to select from it
    const { data, error } = await supabase
      .from("inquiries")
      .select("id")
      .limit(1);

    if (error && error.code === "42P01") {
      // Table doesn't exist (PostgreSQL error code for undefined table)
      return NextResponse.json({
        exists: false,
        message:
          "Inquiries table does not exist. Run the SQL script to create it.",
        sqlScript: "scripts/fix-contact-form-now.sql",
        error: error.message,
      });
    }

    if (error) {
      // Some other error occurred
      return NextResponse.json({
        exists: false,
        error: error.message,
        message: "Error checking inquiries table",
      });
    }

    // Table exists, check its structure
    const { data: columns, error: columnsError } = await supabase
      .rpc("get_table_columns", { table_name: "inquiries" })
      .select("*");

    if (columnsError) {
      // Fallback: just confirm table exists
      return NextResponse.json({
        exists: true,
        message: "Inquiries table exists and is accessible",
        note: "Could not read table structure details",
      });
    }

    return NextResponse.json({
      exists: true,
      message: "Inquiries table exists and is ready",
      columns: columns || [],
    });
  } catch (error) {
    console.error("Debug API error:", error);
    return NextResponse.json(
      {
        exists: false,
        error: "Failed to check database",
        message: "Could not verify if inquiries table exists",
      },
      { status: 500 }
    );
  }
}
