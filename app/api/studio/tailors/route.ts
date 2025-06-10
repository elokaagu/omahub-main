import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const tailorData = await request.json();

    if (!supabase) {
      return NextResponse.json(
        { error: "Database connection not available" },
        { status: 500 }
      );
    }

    const { data, error } = await supabase
      .from("tailors")
      .insert(tailorData)
      .select()
      .single();

    if (error) {
      console.error("Error creating tailor:", error);
      return NextResponse.json(
        { error: "Failed to create tailor" },
        { status: 500 }
      );
    }

    return NextResponse.json({ tailor: data }, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/studio/tailors:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    if (!supabase) {
      return NextResponse.json(
        { error: "Database connection not available" },
        { status: 500 }
      );
    }

    const { data, error } = await supabase.from("tailors").select(`
        *,
        brand:brands(id, name, location, is_verified, category)
      `);

    if (error) {
      console.error("Error fetching tailors:", error);
      return NextResponse.json(
        { error: "Failed to fetch tailors" },
        { status: 500 }
      );
    }

    return NextResponse.json({ tailors: data }, { status: 200 });
  } catch (error) {
    console.error("Error in GET /api/studio/tailors:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
