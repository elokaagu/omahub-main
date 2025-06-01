import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: any) {
            cookieStore.set({ name, value: "", ...options });
          },
        },
      }
    );

    // Get session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json(
        {
          error: "Authentication required",
        },
        { status: 401 }
      );
    }

    // Get user profile to check permissions
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        {
          error: "User profile not found",
        },
        { status: 404 }
      );
    }

    // Check if user has admin permissions
    const isAdmin = profile.role === "admin" || profile.role === "super_admin";
    if (!isAdmin) {
      return NextResponse.json(
        {
          error: "Insufficient permissions. Only admins can create brands.",
        },
        { status: 403 }
      );
    }

    // Get request body
    const brandData = await request.json();

    // Validate required fields
    if (
      !brandData.name ||
      !brandData.description ||
      !brandData.category ||
      !brandData.location
    ) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: name, description, category, and location are required",
        },
        { status: 400 }
      );
    }

    // Generate a URL-friendly slug from the brand name
    const id = brandData.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    // Create the brand
    const { data: brand, error: createError } = await supabase
      .from("brands")
      .insert({
        id,
        name: brandData.name,
        description: brandData.description,
        long_description: brandData.long_description || brandData.description,
        location: brandData.location,
        price_range: brandData.price_range || "$",
        category: brandData.category,
        image: brandData.image || null,
        is_verified: brandData.is_verified || false,
        website: brandData.website || null,
        instagram: brandData.instagram || null,
        founded_year: brandData.founded_year || null,
        rating: 0, // Default rating for new brands
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (createError) {
      console.error("Error creating brand:", createError);

      // Handle duplicate key error
      if (createError.code === "23505") {
        return NextResponse.json(
          {
            error:
              "A brand with this name already exists. Please choose a different name.",
          },
          { status: 409 }
        );
      }

      return NextResponse.json(
        {
          error: "Failed to create brand",
          details: createError.message,
        },
        { status: 500 }
      );
    }

    console.log("Brand created successfully:", brand);

    return NextResponse.json({
      success: true,
      brand,
    });
  } catch (error) {
    console.error("Brand creation API error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
