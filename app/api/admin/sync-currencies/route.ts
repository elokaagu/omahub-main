import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth/requireSuperAdmin";
import { getAdminClient } from "@/lib/supabase-admin";
import {
  checkCurrencyInconsistencies,
  syncAllBrandCurrencies,
} from "@/lib/utils/currencySync";

export const dynamic = "force-dynamic";

/**
 * Best-effort single-flight lock for this server instance (one sync at a time per warm lambda/process).
 * Not a distributed lock across multiple instances.
 */
let currencySyncInFlight = false;

function summarizeSyncFailures(
  results: Array<{
    brandId: string;
    brandName: string;
    success: boolean;
    error?: string;
  }>
) {
  return results
    .filter((r) => !r.success)
    .map((r) => ({
      brandId: r.brandId,
      brandName: r.brandName,
      ...(r.error ? { error: r.error } : {}),
    }));
}

// GET — super_admin: inspect brand/product currency mismatches (uses service client inside util)
export async function GET() {
  try {
    const auth = await requireSuperAdmin();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const admin = await getAdminClient();
    if (!admin) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 503 }
      );
    }

    const inconsistencies = await checkCurrencyInconsistencies();

    if (!inconsistencies.success) {
      console.error("sync-currencies GET: inconsistency check failed");
      return NextResponse.json(
        { error: "Failed to check currency inconsistencies" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Currency inconsistency check completed",
      totalInconsistencies: inconsistencies.inconsistencies.length,
      inconsistencies: inconsistencies.inconsistencies,
    });
  } catch (error) {
    console.error("sync-currencies GET:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST — super_admin: sync all product currencies to match brand currency (mutating)
export async function POST() {
  try {
    const auth = await requireSuperAdmin();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    if (currencySyncInFlight) {
      return NextResponse.json(
        {
          error: "Currency sync already in progress",
          code: "SYNC_IN_PROGRESS",
        },
        { status: 409 }
      );
    }
    currencySyncInFlight = true;

    try {
      const admin = await getAdminClient();
      if (!admin) {
        return NextResponse.json(
          { error: "Server configuration error" },
          { status: 503 }
        );
      }

      const syncResult = await syncAllBrandCurrencies();

      const successfulSyncs = syncResult.results.filter((r) => r.success).length;
      const failedSyncs = syncResult.results.filter((r) => !r.success).length;
      const totalBrands = syncResult.results.length;

      if (!syncResult.success) {
        return NextResponse.json(
          {
            error: "Currency sync completed with failures",
            code: "SYNC_PARTIAL_OR_FAILED",
            totalBrands,
            successfulSyncs,
            failedSyncs,
            failures: summarizeSyncFailures(syncResult.results),
          },
          { status: 500 }
        );
      }

      return NextResponse.json({
        message: "Currency sync completed",
        overallSuccess: true,
        totalBrands,
        successfulSyncs,
        failedSyncs,
      });
    } finally {
      currencySyncInFlight = false;
    }
  } catch (error) {
    console.error("sync-currencies POST:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
