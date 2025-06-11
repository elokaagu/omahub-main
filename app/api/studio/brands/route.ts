import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    console.log("Brand creation API called");

    const cookieStore = cookies();
    console.log("Cookie store created");

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            try {
              const value = cookieStore.get(name)?.value;
              console.log(
                `Getting cookie ${name}:`,
                value ? "found" : "not found"
              );
              return value;
            } catch (error) {
              console.error(`Error getting cookie ${name}:`, error);
              return undefined;
            }
          },
          set(name: string, value: string, options: any) {
            try {
              cookieStore.set({ name, value, ...options });
            } catch (error) {
              console.error(`Error setting cookie ${name}:`, error);
            }
          },
          remove(name: string, options: any) {
            try {
              cookieStore.set({ name, value: "", ...options });
            } catch (error) {
              console.error(`Error removing cookie ${name}:`, error);
            }
          },
        },
      }
    );

    console.log("Supabase client created");

    // Get session with better error handling
    let session, sessionError;
    try {
      const result = await supabase.auth.getSession();
      session = result.data.session;
      sessionError = result.error;
      console.log(
        "Session check:",
        session ? "found" : "not found",
        sessionError ? `error: ${sessionError.message}` : "no error"
      );
    } catch (error) {
      console.error("Error getting session:", error);
      return NextResponse.json(
        {
          error: "Session retrieval failed",
          details: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 500 }
      );
    }

    if (sessionError || !session) {
      console.log(
        "Authentication failed:",
        sessionError?.message || "No session"
      );
      return NextResponse.json(
        {
          error: "Authentication required",
          details: sessionError?.message || "No active session found",
        },
        { status: 401 }
      );
    }

    console.log("User authenticated:", session.user.id);

    // Get user profile to check permissions
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .single();

    console.log(
      "Profile check:",
      profile ? `role: ${profile.role}` : "not found",
      profileError ? `error: ${profileError.message}` : "no error"
    );

    if (profileError || !profile) {
      return NextResponse.json(
        {
          error: "User profile not found",
          details: profileError?.message || "Profile does not exist",
        },
        { status: 404 }
      );
    }

    // Check if user has admin permissions
    const isAdmin = profile.role === "admin" || profile.role === "super_admin";
    console.log(
      "Permission check:",
      isAdmin ? "admin access granted" : "insufficient permissions"
    );

    if (!isAdmin) {
      return NextResponse.json(
        {
          error: "Insufficient permissions. Only admins can create brands.",
          userRole: profile.role,
        },
        { status: 403 }
      );
    }

    // Get request body
    const brandData = await request.json();
    console.log("Brand data received:", {
      name: brandData.name,
      category: brandData.category,
      location: brandData.location,
    });

    // Validate required fields (based on actual schema)
    const missingFields = [];
    if (!brandData.name) missingFields.push("name");
    if (!brandData.description) missingFields.push("description");
    if (!brandData.location) missingFields.push("location");
    if (!brandData.categories || !brandData.categories.length)
      missingFields.push("categories");

    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          error: `Missing required fields: ${missingFields.join(", ")}`,
          received: {
            name: !!brandData.name,
            description: !!brandData.description,
            location: !!brandData.location,
            categories: !!(brandData.categories && brandData.categories.length),
          },
        },
        { status: 400 }
      );
    }

    // Validate character limits
    if (brandData.name && brandData.name.length > 50) {
      return NextResponse.json(
        { error: "Brand name must be 50 characters or less" },
        { status: 400 }
      );
    }

    if (brandData.description && brandData.description.length > 150) {
      return NextResponse.json(
        { error: "Brand description must be 150 characters or less" },
        { status: 400 }
      );
    }

    // Generate a URL-friendly slug from the brand name
    const id = brandData.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    console.log("Generated brand ID:", id);

    // Create the brand (using only columns that exist in the schema)
    const { data: brand, error: createError } = await supabase
      .from("brands")
      .insert({
        id,
        name: brandData.name,
        description: brandData.description || null,
        long_description:
          brandData.long_description || brandData.description || null,
        location: brandData.location || null,
        price_range: brandData.price_range || "$",
        category: brandData.categories[0], // Primary category for backward compatibility
        categories: brandData.categories, // Store all categories
        rating: 0,
        is_verified: brandData.is_verified || false,
        image: brandData.image || null,
        website: brandData.website || null,
        instagram: brandData.instagram || null,
        founded_year: brandData.founded_year || null,
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

    console.log("Brand created successfully:", brand.id);

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
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
