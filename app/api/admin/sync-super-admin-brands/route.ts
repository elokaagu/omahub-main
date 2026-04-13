import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth/requireSuperAdmin";
import { createAdminClient } from "@/lib/supabase-unified";

export const dynamic = "force-dynamic";

/**
 * Backfills `profiles.owned_brands` for every super_admin with all brand IDs.
 * Prefer RBAC where super_admin bypasses brand scope so this stays unnecessary — see product/auth design.
 */

/** Best-effort lock per server instance; not distributed across lambdas. */
let syncInFlight = false;

export type SuperAdminBrandSyncDetail =
  | { success: true; userId: string; brandsAdded: number }
  | { success: false; userId: string; error: string };

export type SuperAdminBrandSyncSummary = {
  totalSuperAdmins: number;
  totalBrands: number;
  successful: number;
  failed: number;
  totalBrandsAdded: number;
  details: SuperAdminBrandSyncDetail[];
};

export async function POST() {
  try {
    const auth = await requireSuperAdmin();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const actorUserId = auth.userId;

    if (syncInFlight) {
      return NextResponse.json(
        {
          error: "Super admin brand sync already in progress",
          code: "SYNC_IN_PROGRESS",
        },
        { status: 409 }
      );
    }
    syncInFlight = true;

    try {
      let adminDb;
      try {
        adminDb = createAdminClient();
      } catch {
        return NextResponse.json(
          { error: "Server configuration error" },
          { status: 503 }
        );
      }

      const { data: allBrands, error: brandsError } = await adminDb
        .from("brands")
        .select("id");

      if (brandsError) {
        console.error(
          "sync-super-admin-brands: brands fetch failed:",
          brandsError.code,
          brandsError.message
        );
        return NextResponse.json(
          { error: "Failed to fetch brands" },
          { status: 500 }
        );
      }

      const allBrandIds = (allBrands ?? []).map((b: { id: string }) => b.id);

      const { data: superAdmins, error: superAdminsError } = await adminDb
        .from("profiles")
        .select("id, owned_brands")
        .eq("role", "super_admin");

      if (superAdminsError) {
        console.error(
          "sync-super-admin-brands: profiles fetch failed:",
          superAdminsError.code,
          superAdminsError.message
        );
        return NextResponse.json(
          { error: "Failed to fetch super admins" },
          { status: 500 }
        );
      }

      const admins = superAdmins ?? [];

      const updatePromises = admins.map(
        async (admin: {
          id: string;
          owned_brands: string[] | null;
        }): Promise<SuperAdminBrandSyncDetail> => {
        const currentBrands = Array.isArray(admin.owned_brands)
          ? admin.owned_brands
          : [];
        const missingBrands = allBrandIds.filter(
          (brandId: string) => !currentBrands.includes(brandId)
        );

        if (missingBrands.length === 0) {
          return {
            success: true as const,
            userId: admin.id,
            brandsAdded: 0,
          };
        }

        const updatedBrands = [...new Set([...currentBrands, ...allBrandIds])];

        const { error: updateError } = await adminDb
          .from("profiles")
          .update({
            owned_brands: updatedBrands,
            updated_at: new Date().toISOString(),
          })
          .eq("id", admin.id);

        if (updateError) {
          console.error(
            "sync-super-admin-brands: profile update failed:",
            admin.id,
            updateError.code,
            updateError.message
          );
          return {
            success: false as const,
            userId: admin.id,
            error: updateError.message,
          };
        }

        return {
          success: true as const,
          userId: admin.id,
          brandsAdded: missingBrands.length,
        };
      });

      const settled = await Promise.allSettled(updatePromises);

      const summary: SuperAdminBrandSyncSummary = {
        totalSuperAdmins: admins.length,
        totalBrands: allBrandIds.length,
        successful: 0,
        failed: 0,
        totalBrandsAdded: 0,
        details: [],
      };

      settled.forEach(
        (result: PromiseSettledResult<SuperAdminBrandSyncDetail>, index: number) => {
        if (result.status === "fulfilled") {
          const value = result.value;
          summary.details.push(value);
          if (value.success) {
            summary.successful++;
            summary.totalBrandsAdded += value.brandsAdded;
          } else {
            summary.failed++;
          }
        } else {
          summary.failed++;
          const fallbackId = admins[index]?.id ?? "unknown";
          summary.details.push({
            success: false,
            userId: fallbackId,
            error:
              result.reason instanceof Error
                ? result.reason.message
                : String(result.reason),
          });
        }
      }
      );

      console.log("sync-super-admin-brands complete", {
        actorUserId,
        totalSuperAdmins: summary.totalSuperAdmins,
        totalBrands: summary.totalBrands,
        successful: summary.successful,
        failed: summary.failed,
        totalBrandsAdded: summary.totalBrandsAdded,
      });

      return NextResponse.json({
        message: "Super admin brand sync completed",
        summary,
      });
    } finally {
      syncInFlight = false;
    }
  } catch (error) {
    console.error("sync-super-admin-brands:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
