import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Force dynamic rendering since we use cookies
export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

function createAuthenticatedClient() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createAuthenticatedClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || profile?.role !== "super_admin") {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const targetEmail = searchParams.get("email");

    if (!targetEmail) {
      return NextResponse.json(
        { error: "Email parameter is required" },
        { status: 400 }
      );
    }

    // Find the user by email
    const { data: targetUser, error: userError } =
      await supabaseAdmin.auth.admin.listUsers();

    if (userError) {
      console.error("Error fetching users:", userError);
      return NextResponse.json(
        { error: "Failed to fetch users" },
        { status: 500 }
      );
    }

    const targetUserId = targetUser.users.find(
      (u) => u.email === targetEmail
    )?.id;

    if (!targetUserId) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Force fresh data by adding timestamp and using service role client
    const timestamp = Date.now();
    console.log(
      `[${timestamp}] Fetching fresh favourites for user: ${targetEmail}`
    );

    // Use service role client to bypass RLS and get immediate updates
    const { data: favourites, error: favouritesError } = await supabaseAdmin
      .from("favourites")
      .select("*")
      .eq("user_id", targetUserId)
      .order("created_at", { ascending: false }); // Most recent first

    if (favouritesError) {
      console.error("Error fetching favourites:", favouritesError);
      return NextResponse.json(
        { error: "Failed to fetch favourites" },
        { status: 500 }
      );
    }

    console.log(`[${timestamp}] Found ${favourites?.length || 0} favourites`);

    // Enrich favourites with actual item data
    const enrichedFavourites = [];

    for (const favourite of favourites || []) {
      try {
        let itemData = null;

        switch (favourite.item_type) {
          case "brand":
            const { data: brand } = await supabaseAdmin
              .from("brands")
              .select(
                "id, name, image, category, location, is_verified, rating"
              )
              .eq("id", favourite.item_id)
              .single();
            if (brand) {
              itemData = {
                ...brand,
                item_type: "brand",
                favourite_id: favourite.id,
              };
            }
            break;

          case "catalogue":
            const { data: catalogue } = await supabaseAdmin
              .from("catalogues")
              .select("id, title, image, brand_id, description")
              .eq("id", favourite.item_id)
              .single();
            if (catalogue) {
              itemData = {
                ...catalogue,
                item_type: "catalogue",
                favourite_id: favourite.id,
              };
            }
            break;

          case "product":
            const { data: product } = await supabaseAdmin
              .from("products")
              .select(
                `
                id, title, image, brand_id, price, sale_price, category,
                brand:brands(id, name, location, price_range, currency)
              `
              )
              .eq("id", favourite.item_id)
              .single();
            if (product) {
              itemData = {
                ...product,
                item_type: "product",
                favourite_id: favourite.id,
                price: product.sale_price || product.price,
                brand: product.brand,
              };
            }
            break;
        }

        if (itemData) {
          enrichedFavourites.push(itemData);
        }
      } catch (itemError) {
        console.error(`Error fetching item ${favourite.item_id}:`, itemError);
      }
    }

    // Categorize items
    const brands = enrichedFavourites.filter(
      (item: any) => item.name && !item.brand_id && !item.price
    );
    const collections = enrichedFavourites.filter(
      (item: any) => item.title && item.brand_id && !item.price
    );
    const products = enrichedFavourites.filter(
      (item: any) => item.title && item.price
    );

    const responseData = {
      user: { id: targetUserId, email: targetEmail },
      favourites: {
        total: enrichedFavourites.length,
        brands: brands.length,
        collections: collections.length,
        products: products.length,
        items: enrichedFavourites,
      },
      summary: {
        brands,
        collections,
        products,
      },
      metadata: {
        fetched_at: new Date().toISOString(),
        timestamp,
        cache_control: "no-cache, no-store, must-revalidate",
      },
    };

    console.log(
      `[${timestamp}] API response ready with ${enrichedFavourites.length} items`
    );

    // Return with cache control headers to ensure fresh data
    return NextResponse.json(responseData, {
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
        "X-Fetched-At": new Date().toISOString(),
        "X-Timestamp": timestamp.toString(),
      },
    });
  } catch (error) {
    console.error("Error in admin user favourites API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
