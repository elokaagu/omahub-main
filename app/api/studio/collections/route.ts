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
      .from("collections")
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
      return NextResponse.json(
        { error: "Database connection not available" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { title, description, brand_id, image } = body;

    // Validate required fields
    if (!title?.trim()) {
      return NextResponse.json(
        { error: "Collection title is required" },
        { status: 400 }
      );
    }

    if (!brand_id) {
      return NextResponse.json(
        { error: "Brand ID is required" },
        { status: 400 }
      );
    }

    if (!image) {
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

    // Check if collection with this ID already exists
    const { data: existingCollection } = await supabase
      .from("collections")
      .select("id")
      .eq("id", id)
      .single();

    if (existingCollection) {
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

    const { data: collection, error } = await supabase
      .from("collections")
      .insert([collectionData])
      .select()
      .single();

    if (error) {
      console.error("Error creating collection:", error);
      return NextResponse.json(
        { error: "Failed to create collection" },
        { status: 500 }
      );
    }

    return NextResponse.json({ collection }, { status: 201 });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
