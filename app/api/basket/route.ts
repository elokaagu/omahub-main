import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

// GET - Fetch user's baskets
export async function GET() {
  try {
    // Create Supabase client with explicit cookie handling
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ 
      cookies: () => cookieStore 
    });
    
    // Try to get the session instead of just the user
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error("Session error in basket API:", sessionError);
      return NextResponse.json(
        { error: "Session error" },
        { status: 401 }
      );
    }
    
    if (!session || !session.user) {
      console.log("No valid session found in basket API");
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    console.log("Basket API: User authenticated:", session.user.id);

    // For now, return empty baskets until database is set up
    return NextResponse.json({ 
      baskets: [],
      user: {
        id: session.user.id,
        email: session.user.email
      }
    });
  } catch (error) {
    console.error("Basket API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Add item to basket
export async function POST(request: NextRequest) {
  try {
    // Create Supabase client with explicit cookie handling
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ 
      cookies: () => cookieStore 
    });
    
    // Try to get the session instead of just the user
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error("Session error in basket API POST:", sessionError);
      return NextResponse.json(
        { error: "Session error" },
        { status: 401 }
      );
    }
    
    if (!session || !session.user) {
      console.log("No valid session found in basket API POST");
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    console.log("Basket API POST: User authenticated:", session.user.id);

    // For now, return success until database is set up
    return NextResponse.json({ 
      message: "Item added to basket (demo mode)",
      user: {
        id: session.user.id,
        email: session.user.email
      }
    });
  } catch (error) {
    console.error("Basket API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH - Update item quantity
export async function PATCH(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get("itemId");
    const { quantity } = await request.json();

    if (!itemId || !quantity) {
      return NextResponse.json(
        { error: "Item ID and quantity are required" },
        { status: 400 }
      );
    }

    // Update item quantity
    const { data, error } = await supabase
      .from("basket_items")
      .update({ quantity })
      .eq("id", itemId)
      .eq("baskets.user_id", user.id)
      .select(`
        *,
        baskets!inner(user_id)
      `)
      .single();

    if (error) {
      console.error("Error updating basket item:", error);
      return NextResponse.json(
        { error: "Failed to update item" },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      message: "Item updated",
      basketItem: data 
    });
  } catch (error) {
    console.error("Basket API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Remove item from basket
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get("itemId");

    if (!itemId) {
      return NextResponse.json(
        { error: "Item ID is required" },
        { status: 400 }
      );
    }

    // Delete item from basket
    const { error } = await supabase
      .from("basket_items")
      .delete()
      .eq("id", itemId)
      .eq("baskets.user_id", user.id);

    if (error) {
      console.error("Error deleting basket item:", error);
      return NextResponse.json(
        { error: "Failed to delete item" },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      message: "Item removed from basket" 
    });
  } catch (error) {
    console.error("Basket API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
