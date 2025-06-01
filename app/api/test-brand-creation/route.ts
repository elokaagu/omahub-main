import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createBrand } from "@/lib/services/studioService";

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
          error: "No session found",
          sessionError,
        },
        { status: 401 }
      );
    }

    // Get request body
    const body = await request.json();

    console.log("Test brand creation request:", {
      userId: session.user.id,
      brandData: body,
    });

    // Test brand creation
    const testBrandData = {
      name: body.name || "Test Brand",
      description: body.description || "Test description",
      long_description: body.long_description || "Test long description",
      location: body.location || "Test Location",
      price_range: body.price_range || "$",
      category: body.category || "Casual Wear",
      image: body.image || "https://via.placeholder.com/400x300",
      is_verified: false,
      website: body.website,
      instagram: body.instagram,
      founded_year: body.founded_year,
    };

    console.log("About to call createBrand with:", testBrandData);

    const brand = await createBrand(session.user.id, testBrandData);

    console.log("Brand created successfully:", brand);

    return NextResponse.json({
      success: true,
      brand,
      userId: session.user.id,
    });
  } catch (error) {
    console.error("Test brand creation error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
