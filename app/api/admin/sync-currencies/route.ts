import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase-admin";
import { syncAllBrandCurrencies, checkCurrencyInconsistencies } from "@/lib/utils/currencySync";

export async function GET(request: NextRequest) {
  try {
    // Check if this is an admin request
    const supabase = await getAdminClient();
    if (!supabase) {
      return NextResponse.json(
        { error: "Admin client not available" },
        { status: 500 }
      );
    }

    // Check for inconsistencies first
    console.log("🔍 Checking for currency inconsistencies...");
    const inconsistencies = await checkCurrencyInconsistencies();
    
    if (!inconsistencies.success) {
      return NextResponse.json(
        { error: "Failed to check currency inconsistencies" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Currency inconsistency check completed",
      inconsistencies: inconsistencies.inconsistencies,
      totalInconsistencies: inconsistencies.inconsistencies.length
    });

  } catch (error) {
    console.error("❌ Error in currency inconsistency check:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check if this is an admin request
    const supabase = await getAdminClient();
    if (!supabase) {
      return NextResponse.json(
        { error: "Admin client not available" },
        { status: 500 }
      );
    }

    // Trigger the currency sync
    console.log("🔄 Starting currency sync for all brands...");
    const syncResult = await syncAllBrandCurrencies();
    
    if (!syncResult.success) {
      return NextResponse.json(
        { error: "Currency sync failed", results: syncResult.results },
        { status: 500 }
      );
    }

    const successfulSyncs = syncResult.results.filter(r => r.success);
    const failedSyncs = syncResult.results.filter(r => !r.success);

    return NextResponse.json({
      message: "Currency sync completed",
      overallSuccess: syncResult.success,
      totalBrands: syncResult.results.length,
      successfulSyncs: successfulSyncs.length,
      failedSyncs: failedSyncs.length,
      results: syncResult.results
    });

  } catch (error) {
    console.error("❌ Error in currency sync:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
