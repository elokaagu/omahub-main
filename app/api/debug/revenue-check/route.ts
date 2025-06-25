import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-unified";

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 Checking revenue data in database...");

    const supabase = await createServerSupabaseClient();

    // Check bookings table
    console.log("📊 Checking BOOKINGS table...");
    const { data: bookings, error: bookingsError } = await supabase
      .from("bookings")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10);

    let bookingsInfo = {
      count: 0,
      error: null as string | null,
      totalValue: 0,
      totalCommission: 0,
      avgBookingValue: 0,
      bookingTypes: [] as string[],
      statusDistribution: {} as Record<string, number>,
      sample: [] as Array<{
        customer: string;
        type: string;
        value: number;
        status: string;
        date: string;
      }>,
    };

    if (bookingsError) {
      bookingsInfo.error = bookingsError.message;
    } else {
      bookingsInfo.count = bookings?.length || 0;

      if (bookings && bookings.length > 0) {
        bookingsInfo.totalValue = bookings.reduce(
          (sum, b) => sum + (b.booking_value || 0),
          0
        );
        bookingsInfo.totalCommission = bookings.reduce(
          (sum, b) => sum + (b.commission_amount || 0),
          0
        );
        bookingsInfo.avgBookingValue =
          bookingsInfo.totalValue / bookings.length;
        bookingsInfo.bookingTypes = [
          ...new Set(bookings.map((b) => b.booking_type)),
        ];
        bookingsInfo.statusDistribution = bookings.reduce(
          (acc, b) => {
            acc[b.status] = (acc[b.status] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        );
        bookingsInfo.sample = bookings.slice(0, 3).map((b) => ({
          customer: b.customer_name,
          type: b.booking_type,
          value: b.booking_value,
          status: b.status,
          date: b.created_at,
        }));
      }
    }

    // Check leads table
    console.log("📈 Checking LEADS table...");
    const { data: leads, error: leadsError } = await supabase
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10);

    let leadsInfo = {
      count: 0,
      error: null as string | null,
      statusDistribution: {} as Record<string, number>,
      sources: [] as string[],
      totalEstimatedValue: 0,
    };

    if (leadsError) {
      leadsInfo.error = leadsError.message;
    } else {
      leadsInfo.count = leads?.length || 0;

      if (leads && leads.length > 0) {
        leadsInfo.statusDistribution = leads.reduce(
          (acc, l) => {
            acc[l.status] = (acc[l.status] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        );
        leadsInfo.sources = [...new Set(leads.map((l) => l.source))];
        leadsInfo.totalEstimatedValue = leads.reduce(
          (sum, l) => sum + (l.estimated_value || 0),
          0
        );
      }
    }

    // Check commission structure
    console.log("💼 Checking COMMISSION structure...");
    const { data: commissions, error: commissionsError } = await supabase
      .from("commission_structure")
      .select("*")
      .eq("is_active", true);

    let commissionsInfo = {
      count: 0,
      error: null as string | null,
      rates: {} as Record<string, number>,
    };

    if (commissionsError) {
      commissionsInfo.error = commissionsError.message;
    } else {
      commissionsInfo.count = commissions?.length || 0;
      commissionsInfo.rates =
        commissions?.reduce(
          (acc, c) => {
            acc[c.booking_type] = c.commission_rate;
            return acc;
          },
          {} as Record<string, number>
        ) || {};
    }

    // Check brand financial metrics
    console.log("📊 Checking BRAND FINANCIAL metrics...");
    const { data: metrics, error: metricsError } = await supabase
      .from("brand_financial_metrics")
      .select("*")
      .order("month_year", { ascending: false })
      .limit(5);

    let metricsInfo = {
      count: 0,
      error: null as string | null,
      sample: [] as Array<{
        brand_id: string;
        month: string;
        revenue: number;
        commission: number;
      }>,
    };

    if (metricsError) {
      metricsInfo.error = metricsError.message;
    } else {
      metricsInfo.count = metrics?.length || 0;
      if (metrics && metrics.length > 0) {
        metricsInfo.sample = metrics.map((m) => ({
          brand_id: m.brand_id,
          month: m.month_year,
          revenue: m.total_booking_value,
          commission: m.total_commission_earned,
        }));
      }
    }

    const result = {
      summary: {
        hasRealBookings: bookingsInfo.count > 0,
        hasRealLeads: leadsInfo.count > 0,
        hasCommissionStructure: commissionsInfo.count > 0,
        hasBrandMetrics: metricsInfo.count > 0,
        totalRevenue: bookingsInfo.totalValue,
        totalCommission: bookingsInfo.totalCommission,
      },
      bookings: bookingsInfo,
      leads: leadsInfo,
      commissions: commissionsInfo,
      brandMetrics: metricsInfo,
    };

    console.log("✅ Revenue data check complete:", result.summary);

    return NextResponse.json(result);
  } catch (error) {
    console.error("❌ Error checking revenue data:", error);
    return NextResponse.json(
      {
        error: "Failed to check revenue data",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
