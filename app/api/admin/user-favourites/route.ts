import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth/requireSuperAdmin";
import { createAdminClient } from "@/lib/supabase-unified";
import {
  fetchEnrichedUserFavourites,
  groupFavouritesByType,
  resolveTargetUserIdByEmail,
} from "@/lib/services/adminUserFavourites";
import { parseAdminUserFavouritesQuery } from "@/lib/validation/adminUserFavourites";

export const dynamic = "force-dynamic";

function jsonValidationError(error: { flatten: () => unknown }) {
  return NextResponse.json(
    { error: "Invalid request", details: error.flatten() },
    { status: 400 }
  );
}

/**
 * Super-admin: inspect another user's favourites with enriched targets.
 * Query: `email` (required, validated).
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireSuperAdmin();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const parsed = parseAdminUserFavouritesQuery(
      new URL(request.url).searchParams
    );
    if (!parsed.success) {
      return jsonValidationError(parsed.error);
    }
    const targetEmail = parsed.data.email;

    let adminDb;
    try {
      adminDb = createAdminClient();
    } catch {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 503 }
      );
    }

    const target = await resolveTargetUserIdByEmail(adminDb, targetEmail);
    if (!target) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { items, error: enrichError } = await fetchEnrichedUserFavourites(
      adminDb,
      target.id
    );

    if (enrichError) {
      return NextResponse.json(
        { error: "Failed to fetch favourites" },
        { status: 500 }
      );
    }

    const { brands, collections, products } = groupFavouritesByType(items);

    const fetchedAt = new Date().toISOString();

    return NextResponse.json(
      {
        user: { id: target.id, email: target.email },
        favourites: {
          total: items.length,
          brands: brands.length,
          collections: collections.length,
          products: products.length,
          items,
        },
        summary: {
          brands,
          collections,
          products,
        },
        metadata: {
          fetched_at: fetchedAt,
        },
      },
      {
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      }
    );
  } catch (error) {
    console.error("GET /api/admin/user-favourites:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
