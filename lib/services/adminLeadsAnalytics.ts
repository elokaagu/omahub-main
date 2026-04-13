import type { LeadsAdminProfile } from "@/lib/auth/requireLeadsAdmin";
import type { createServerSupabaseClient } from "@/lib/supabase-unified";

type Supabase = Awaited<ReturnType<typeof createServerSupabaseClient>>;

type BrandRevenueAggregate = {
  brand_id: string;
  total_revenue: number;
  total_commission: number;
  booking_count: number;
};

/**
 * Client-side aggregation when `get_leads_analytics` RPC fails.
 * Mirrors previous route behaviour (including monthly trend labelling).
 */
export async function computeFallbackLeadsAnalytics(
  supabase: Supabase,
  profile: LeadsAdminProfile
) {
  let leadsQuery = supabase.from("leads").select("*");

  if (profile.role === "brand_admin") {
    if (profile.owned_brands.length === 0) {
      return {
        total_leads: 0,
        qualified_leads: 0,
        converted_leads: 0,
        total_bookings: 0,
        total_booking_value: 0,
        total_commission_earned: 0,
        average_booking_value: 0,
        conversion_rate: 0,
        this_month_leads: 0,
        this_month_bookings: 0,
        this_month_revenue: 0,
        this_month_commission: 0,
        top_performing_brands: [],
        leads_by_source: {},
        bookings_by_type: {},
        monthly_trends: [],
      };
    }
    leadsQuery = leadsQuery.in("brand_id", profile.owned_brands);
  }

  const { data: leads, error: leadsError } = await leadsQuery;

  if (leadsError) {
    return { error: leadsError as Error };
  }

  const totalLeads = leads?.length || 0;
  const qualifiedLeads =
    leads?.filter((lead) => lead.status === "qualified").length || 0;
  const convertedLeads =
    leads?.filter((lead) => lead.status === "converted").length || 0;

  const thisMonthLeads =
    leads?.filter((lead) => {
      const leadDate = new Date(lead.created_at);
      const now = new Date();
      return (
        leadDate.getMonth() === now.getMonth() &&
        leadDate.getFullYear() === now.getFullYear()
      );
    }).length || 0;

  const leadsBySource =
    leads?.reduce(
      (acc, lead) => {
        acc[lead.source] = (acc[lead.source] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    ) || {};

  const monthlyTrends: Array<{
    month: string;
    leads: number;
    bookings: number;
    revenue: number;
    commission: number;
  }> = [];
  const now = new Date();

  for (let i = 5; i >= 0; i--) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthName = monthDate.toLocaleDateString("en-GB", {
      month: "short",
      year: "numeric",
    });

    const monthLeads =
      leads?.filter((lead) => {
        const leadDate = new Date(lead.created_at);
        return (
          leadDate.getMonth() === monthDate.getMonth() &&
          leadDate.getFullYear() === monthDate.getFullYear()
        );
      }).length || 0;

    monthlyTrends.push({
      month: monthName,
      leads: monthLeads,
      bookings: 0,
      revenue: 0,
      commission: 0,
    });
  }

  let bookingsQuery = supabase.from("bookings").select("*");
  if (profile.role === "brand_admin" && profile.owned_brands.length > 0) {
    bookingsQuery = bookingsQuery.in("brand_id", profile.owned_brands);
  }

  const { data: bookings, error: bookingsError } = await bookingsQuery;

  if (bookingsError) {
    // Continue with empty bookings (e.g. missing table)
  }

  const validBookings =
    bookings?.filter(
      (b) => b.status && !["cancelled", "refunded"].includes(b.status)
    ) || [];

  const totalBookings = validBookings.length;
  const totalBookingValue = validBookings.reduce(
    (sum, b) => sum + (b.booking_value || 0),
    0
  );
  const totalCommissionEarned = validBookings.reduce(
    (sum, b) => sum + (b.commission_amount || 0),
    0
  );
  const averageBookingValue =
    totalBookings > 0 ? totalBookingValue / totalBookings : 0;

  const currentMonthStart = new Date();
  currentMonthStart.setDate(1);
  currentMonthStart.setHours(0, 0, 0, 0);

  const thisMonthBookings = validBookings.filter(
    (b) => new Date(b.booking_date || b.created_at) >= currentMonthStart
  );

  const thisMonthBookingsCount = thisMonthBookings.length;
  const thisMonthRevenue = thisMonthBookings.reduce(
    (sum, b) => sum + (b.booking_value || 0),
    0
  );
  const thisMonthCommission = thisMonthBookings.reduce(
    (sum, b) => sum + (b.commission_amount || 0),
    0
  );

  monthlyTrends.forEach((trend) => {
    const trendDate = new Date(trend.month + "-01");
    const monthStart = new Date(
      trendDate.getFullYear(),
      trendDate.getMonth(),
      1
    );
    const monthEnd = new Date(
      trendDate.getFullYear(),
      trendDate.getMonth() + 1,
      0
    );

    const monthBookings = validBookings.filter((b) => {
      const bookingDate = new Date(b.booking_date || b.created_at);
      return bookingDate >= monthStart && bookingDate <= monthEnd;
    });

    trend.bookings = monthBookings.length;
    trend.revenue = monthBookings.reduce(
      (sum, b) => sum + (b.booking_value || 0),
      0
    );
    trend.commission = monthBookings.reduce(
      (sum, b) => sum + (b.commission_amount || 0),
      0
    );
  });

  const bookingsByType = validBookings.reduce(
    (acc, booking) => {
      const type = booking.booking_type || "unknown";
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  let topPerformingBrands: Array<Record<string, unknown>> = [];
  if (profile.role === "super_admin") {
    const brandRevenue = validBookings.reduce(
      (acc, booking) => {
        const brandId = booking.brand_id;
        if (!acc[brandId]) {
          acc[brandId] = {
            brand_id: brandId,
            total_revenue: 0,
            total_commission: 0,
            booking_count: 0,
          };
        }
        acc[brandId].total_revenue += booking.booking_value || 0;
        acc[brandId].total_commission += booking.commission_amount || 0;
        acc[brandId].booking_count += 1;
        return acc;
      },
      {} as Record<string, BrandRevenueAggregate>
    );

    const brandIds = Object.keys(brandRevenue);
    if (brandIds.length > 0) {
      const { data: brandsData } = await supabase
        .from("brands")
        .select("id, name")
        .in("id", brandIds);

      topPerformingBrands = brandIds
        .map((id) => brandRevenue[id])
        .filter((b): b is BrandRevenueAggregate => b != null)
        .map((brand) => {
          const brandInfo = brandsData?.find((b) => b.id === brand.brand_id);
          return {
            ...brand,
            brand_name: brandInfo?.name || "Unknown Brand",
          };
        })
        .sort((a, b) => b.total_revenue - a.total_revenue)
        .slice(0, 10);
    }
  }

  return {
    total_leads: totalLeads,
    qualified_leads: qualifiedLeads,
    converted_leads: convertedLeads,
    total_bookings: totalBookings,
    total_booking_value: totalBookingValue,
    total_commission_earned: totalCommissionEarned,
    average_booking_value: Math.round(averageBookingValue),
    conversion_rate:
      totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0,
    this_month_leads: thisMonthLeads,
    this_month_bookings: thisMonthBookingsCount,
    this_month_revenue: thisMonthRevenue,
    this_month_commission: thisMonthCommission,
    top_performing_brands: topPerformingBrands,
    leads_by_source: leadsBySource,
    bookings_by_type: bookingsByType,
    monthly_trends: monthlyTrends,
  };
}
