import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Helper function to create authenticated Supabase client
async function createAuthenticatedClient() {
  const cookieStore = cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          try {
            const cookie = cookieStore.get(name);
            return cookie?.value;
          } catch (error) {
            console.error(`Error getting cookie ${name}:`, error);
            return undefined;
          }
        },
        set() {},
        remove() {},
      },
    }
  );

  return supabase;
}

// Helper function to get authenticated user
async function getAuthenticatedUser() {
  const supabase = await createAuthenticatedClient();

  try {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      console.error("Session error:", sessionError);
      return null;
    }

    if (session?.user) {
      console.log("User authenticated via session:", session.user.id);
      return session.user;
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      console.error("User error:", userError);
      return null;
    }

    if (user) {
      console.log("User authenticated via direct lookup:", user.id);
      return user;
    }

    console.log("No authenticated user found");
    return null;
  } catch (error) {
    console.error("Authentication error:", error);
    return null;
  }
}

// DELETE - Clear entire basket
export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();

    if (!user) {
      console.log("Authentication failed - no valid user");
      return NextResponse.json(
        { error: "Authentication required - please log in again" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const basketId = searchParams.get("basketId");

    if (!basketId) {
      return NextResponse.json(
        { error: "Basket ID is required" },
        { status: 400 }
      );
    }

    console.log("Basket Clear API: User authenticated:", user.id, "Basket ID:", basketId);

    const supabase = await createAuthenticatedClient();

    // First, verify the basket belongs to the user
    const { data: basket, error: basketError } = await supabase
      .from("baskets")
      .select("user_id")
      .eq("id", basketId)
      .single();

    if (basketError || !basket) {
      console.error("Basket not found:", basketError);
      return NextResponse.json(
        { error: "Basket not found" },
        { status: 404 }
      );
    }

    if (basket.user_id !== user.id) {
      console.error("Unauthorized basket access attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Delete all basket items for this basket
    const { error: deleteItemsError } = await supabase
      .from("basket_items")
      .delete()
      .eq("basket_id", basketId);

    if (deleteItemsError) {
      console.error("Error deleting basket items:", deleteItemsError);
      return NextResponse.json(
        { error: "Failed to clear basket items" },
        { status: 500 }
      );
    }

    // Delete the basket itself
    const { error: deleteBasketError } = await supabase
      .from("baskets")
      .delete()
      .eq("id", basketId);

    if (deleteBasketError) {
      console.error("Error deleting basket:", deleteBasketError);
      return NextResponse.json(
        { error: "Failed to delete basket" },
        { status: 500 }
      );
    }

    console.log("Basket cleared successfully for user:", user.id);

    return NextResponse.json({
      message: "Basket cleared successfully",
      user: {
        id: user.id,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Basket Clear API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
