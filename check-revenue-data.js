require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkRevenueData() {
  console.log("🔍 Checking revenue data in database...\n");

  try {
    // Check bookings table
    console.log("📊 BOOKINGS TABLE:");
    const { data: bookings, error: bookingsError } = await supabase
      .from("bookings")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10);

    if (bookingsError) {
      console.log("❌ Bookings error:", bookingsError.message);
    } else {
      console.log(`✅ Found ${bookings.length} bookings`);

      if (bookings.length > 0) {
        // Calculate totals
        const totalBookingValue = bookings.reduce(
          (sum, b) => sum + (b.booking_value || 0),
          0
        );
        const totalCommission = bookings.reduce(
          (sum, b) => sum + (b.commission_amount || 0),
          0
        );
        const avgBookingValue = totalBookingValue / bookings.length;

        console.log("💰 Revenue Summary:");
        console.log(`   Total Booking Value: $${totalBookingValue.toFixed(2)}`);
        console.log(`   Total Commission: $${totalCommission.toFixed(2)}`);
        console.log(`   Average Booking: $${avgBookingValue.toFixed(2)}`);
        console.log(
          `   Booking Types: ${[...new Set(bookings.map((b) => b.booking_type))].join(", ")}`
        );
        console.log(
          `   Status Distribution: ${JSON.stringify(
            bookings.reduce((acc, b) => {
              acc[b.status] = (acc[b.status] || 0) + 1;
              return acc;
            }, {})
          )}`
        );

        console.log("\n📋 Sample Bookings:");
        bookings.slice(0, 3).forEach((booking, i) => {
          console.log(
            `   ${i + 1}. ${booking.customer_name} - ${booking.booking_type} - $${booking.booking_value} (${booking.status})`
          );
        });
      }
    }

    console.log("\n📈 LEADS TABLE:");
    const { data: leads, error: leadsError } = await supabase
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10);

    if (leadsError) {
      console.log("❌ Leads error:", leadsError.message);
    } else {
      console.log(`✅ Found ${leads.length} leads`);

      if (leads.length > 0) {
        const statusCounts = leads.reduce((acc, l) => {
          acc[l.status] = (acc[l.status] || 0) + 1;
          return acc;
        }, {});

        console.log("📊 Lead Status Distribution:", statusCounts);
        console.log(
          "📊 Lead Sources:",
          [...new Set(leads.map((l) => l.source))].join(", ")
        );

        const totalEstimatedValue = leads.reduce(
          (sum, l) => sum + (l.estimated_value || 0),
          0
        );
        console.log(
          `💡 Total Estimated Value: $${totalEstimatedValue.toFixed(2)}`
        );
      }
    }

    // Check commission structure
    console.log("\n💼 COMMISSION STRUCTURE:");
    const { data: commissions, error: commissionsError } = await supabase
      .from("commission_structure")
      .select("*")
      .eq("is_active", true);

    if (commissionsError) {
      console.log("❌ Commission structure error:", commissionsError.message);
    } else {
      console.log(`✅ Found ${commissions.length} active commission rates`);
      commissions.forEach((c) => {
        console.log(`   ${c.booking_type}: ${c.commission_rate}%`);
      });
    }

    // Check brand financial metrics
    console.log("\n📊 BRAND FINANCIAL METRICS:");
    const { data: metrics, error: metricsError } = await supabase
      .from("brand_financial_metrics")
      .select("*")
      .order("month_year", { ascending: false })
      .limit(5);

    if (metricsError) {
      console.log("❌ Brand metrics error:", metricsError.message);
    } else {
      console.log(`✅ Found ${metrics.length} brand financial records`);
      if (metrics.length > 0) {
        metrics.forEach((m) => {
          console.log(
            `   ${m.brand_id} (${m.month_year}): $${m.total_booking_value} revenue, $${m.total_commission_earned} commission`
          );
        });
      }
    }
  } catch (error) {
    console.error("❌ Error checking revenue data:", error);
  }
}

checkRevenueData();
