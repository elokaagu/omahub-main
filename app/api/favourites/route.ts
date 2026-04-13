import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-unified";
import {
  enrichUserFavourites,
  partitionFavouritesByType,
  tryRefreshFavouritesCache,
} from "@/lib/services/userFavouritesService";
import {
  parseFavouriteDeleteQuery,
  parseFavouritePostBody,
} from "@/lib/validation/userFavourites";

export const dynamic = "force-dynamic";

function logFavouriteEvent(
  event: string,
  fields: Record<string, string | number | undefined>
) {
  console.error(JSON.stringify({ event, ...fields }));
}

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const userId = user.id;

    const { data: favourites, error: favouritesError } = await supabase
      .from("favourites")
      .select("id, item_id, item_type, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (favouritesError) {
      logFavouriteEvent("favourites_list_failed", {
        code: favouritesError.code ?? "unknown",
      });
      return NextResponse.json(
        { error: "Failed to fetch favourites" },
        { status: 500 }
      );
    }

    const rows = favourites ?? [];
    const enrichedFavourites = await enrichUserFavourites(supabase, rows);
    const { brands, collections, products } =
      partitionFavouritesByType(enrichedFavourites);

    return NextResponse.json(
      {
        favourites: {
          total: enrichedFavourites.length,
          brands: brands.length,
          collections: collections.length,
          products: products.length,
          items: enrichedFavourites,
        },
        summary: { brands, collections, products },
        metadata: {
          fetched_at: new Date().toISOString(),
          timestamp: Date.now(),
          cache_control: "no-cache, no-store, must-revalidate",
        },
      },
      {
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
          "X-Fetched-At": new Date().toISOString(),
        },
      }
    );
  } catch {
    logFavouriteEvent("favourites_get_unhandled", {});
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const userId = user.id;

    let raw: unknown;
    try {
      raw = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const parsed = parseFavouritePostBody(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const { item_id, item_type } = parsed.data;

    const { data: favourite, error: insertError } = await supabase
      .from("favourites")
      .insert({
        user_id: userId,
        item_id,
        item_type,
      })
      .select()
      .single();

    if (insertError) {
      if (insertError.code === "23505") {
        return NextResponse.json(
          { error: "Already favourited" },
          { status: 409 }
        );
      }
      logFavouriteEvent("favourites_insert_failed", {
        code: insertError.code ?? "unknown",
      });
      return NextResponse.json(
        { error: "Failed to add favourite" },
        { status: 500 }
      );
    }

    await tryRefreshFavouritesCache(supabase, userId);

    return NextResponse.json(
      {
        success: true,
        favourite,
        message: "Added to favourites",
      },
      {
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "X-Updated-At": new Date().toISOString(),
        },
      }
    );
  } catch {
    logFavouriteEvent("favourites_post_unhandled", {});
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const userId = user.id;
    const { searchParams } = new URL(request.url);
    const parsed = parseFavouriteDeleteQuery(searchParams);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Missing or invalid parameters" },
        { status: 400 }
      );
    }

    const { item_id, item_type } = parsed.data;

    const { error: deleteError } = await supabase
      .from("favourites")
      .delete()
      .eq("user_id", userId)
      .eq("item_id", item_id)
      .eq("item_type", item_type);

    if (deleteError) {
      logFavouriteEvent("favourites_delete_failed", {
        code: deleteError.code ?? "unknown",
      });
      return NextResponse.json(
        { error: "Failed to remove favourite" },
        { status: 500 }
      );
    }

    await tryRefreshFavouritesCache(supabase, userId);

    return NextResponse.json(
      {
        success: true,
        message: "Removed from favourites",
      },
      {
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "X-Updated-At": new Date().toISOString(),
        },
      }
    );
  } catch {
    logFavouriteEvent("favourites_delete_unhandled", {});
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
