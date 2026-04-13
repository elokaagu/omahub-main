import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth/requireSuperAdmin";
import {
  clearAllBrandDependentCaches,
  forceRefreshBrands,
} from "@/lib/services/brandService";

export const dynamic = "force-dynamic";

/**
 * Super-admin only: clear in-memory brand/collection caches on this server,
 * warm fresh brand data into the server-side cache, and revalidate `/`.
 *
 * Client-only homepage (`HomeContent` with ssr: false) still needs a full
 * reload for visitors to pick up new data; revalidation covers the app route
 * shell and any future server-cached segments.
 */
export async function POST() {
  try {
    const auth = await requireSuperAdmin();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    clearAllBrandDependentCaches();
    await forceRefreshBrands(false);
    revalidatePath("/");

    return NextResponse.json({
      success: true,
      message:
        "Brand caches cleared, data refreshed on the server, and homepage path revalidated.",
    });
  } catch (error) {
    console.error("refresh-homepage-brands failed:", error);
    return NextResponse.json(
      { error: "Failed to refresh homepage brands" },
      { status: 500 }
    );
  }
}
