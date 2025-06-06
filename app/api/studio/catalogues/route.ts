import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    if (!supabase) {
      return NextResponse.json(
        { error: "Database connection not available" },
        { status: 500 }
      );
    }

    const { data: catalogues, error } = await supabase
      .from("catalogues")
      .select(
        `
        *,
        brand:brands(id, name)
      `
      )
      .order("title");

    if (error) {
      console.error("Error fetching catalogues:", error);
      return NextResponse.json(
        { error: "Failed to fetch catalogues" },
        { status: 500 }
      );
    }

    return NextResponse.json({ catalogues });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!supabase) {
      console.error("Supabase client not available");
      return NextResponse.json(
        { error: "Database connection not available" },
        { status: 500 }
      );
    }

    const body = await request.json();
    console.log("Received catalogue data:", body);

    const { title, description, brand_id, image } = body;

    // Validate required fields
    if (!title?.trim()) {
      console.error("Validation failed: Missing title");
      return NextResponse.json(
        { error: "Catalogue title is required" },
        { status: 400 }
      );
    }

    if (!brand_id) {
      console.error("Validation failed: Missing brand_id");
      return NextResponse.json(
        { error: "Brand ID is required" },
        { status: 400 }
      );
    }

    if (!image) {
      console.error("Validation failed: Missing image");
      return NextResponse.json(
        { error: "Catalogue image is required" },
        { status: 400 }
      );
    }

    // Generate catalogue ID from title
    const id = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    console.log("Generated catalogue ID:", id);

    // Check if catalogue with this ID already exists
    const { data: existingCatalogue, error: checkError } = await supabase
      .from("catalogues")
      .select("id")
      .eq("id", id)
      .single();

    if (checkError && checkError.code !== "PGRST116") {
      console.error("Error checking existing catalogue:", checkError);
      return NextResponse.json(
        { error: "Failed to check existing catalogues" },
        { status: 500 }
      );
    }

    if (existingCatalogue) {
      console.error("Catalogue already exists with ID:", id);
      return NextResponse.json(
        { error: "A catalogue with this title already exists" },
        { status: 409 }
      );
    }

    // Create the catalogue
    const catalogueData = {
      id,
      title: title.trim(),
      description: description?.trim() || null,
      brand_id,
      image,
    };

    console.log("Creating catalogue with data:", catalogueData);

    const { data: catalogue, error } = await supabase
      .from("catalogues")
      .insert([catalogueData])
      .select()
      .single();

    if (error) {
      console.error("Error creating catalogue:", error);
      return NextResponse.json(
        { error: `Failed to create catalogue: ${error.message}` },
        { status: 500 }
      );
    }

    console.log("Catalogue created successfully:", catalogue);
    return NextResponse.json({ catalogue }, { status: 201 });
  } catch (error) {
    console.error("Unexpected error in POST /api/studio/catalogues:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
