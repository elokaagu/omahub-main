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

    const { data: collections, error } = await supabase
      .from("catalogues")
      .select(
        `
        *,
        brand:brands(id, name)
      `
      )
      .order("title");

    if (error) {
      console.error("Error fetching collections:", error);
      return NextResponse.json(
        { error: "Failed to fetch collections" },
        { status: 500 }
      );
    }

    return NextResponse.json({ collections });
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
    console.log("Received collection data:", body);

    const { title, description, brand_id, image } = body;

    // Validate required fields
    if (!title?.trim()) {
      console.error("Validation failed: Missing title");
      return NextResponse.json(
        { error: "Collection title is required" },
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
        { error: "Collection image is required" },
        { status: 400 }
      );
    }

    // Generate collection ID from title
    const id = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    console.log("Generated collection ID:", id);

    // Check if collection with this ID already exists
    const { data: existingCollection, error: checkError } = await supabase
      .from("catalogues")
      .select("id")
      .eq("id", id)
      .single();

    if (checkError && checkError.code !== "PGRST116") {
      console.error("Error checking existing collection:", checkError);
      return NextResponse.json(
        { error: "Failed to check existing collections" },
        { status: 500 }
      );
    }

    if (existingCollection) {
      console.error("Collection already exists with ID:", id);
      return NextResponse.json(
        { error: "A collection with this title already exists" },
        { status: 409 }
      );
    }

    // Create the collection
    const collectionData = {
      id,
      title: title.trim(),
      description: description?.trim() || null,
      brand_id,
      image,
    };

    console.log("Creating collection with data:", collectionData);

    const { data: collection, error } = await supabase
      .from("catalogues")
      .insert([collectionData])
      .select()
      .single();

    if (error) {
      console.error("Error creating collection:", error);
      return NextResponse.json(
        { error: `Failed to create collection: ${error.message}` },
        { status: 500 }
      );
    }

    console.log("Collection created successfully:", collection);
    return NextResponse.json({ collection }, { status: 201 });
  } catch (error) {
    console.error("Unexpected error in POST /api/studio/collections:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
