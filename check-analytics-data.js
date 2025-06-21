require("dotenv").config({ path: ".env.local" });
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkAnalyticsData() {
  console.log("🔍 Checking analytics data...\n");

  try {
    // Check leads table
    console.log("📊 Checking leads table...");
    const { data: leads, error: leadsError } = await supabase
      .from("leads")
      .select("*");

    if (leadsError) {
      console.error("❌ Error fetching leads:", leadsError);
      return;
    }

    console.log(`✅ Leads found: ${leads.length}`);
    if (leads.length > 0) {
      console.log("First lead sample:", {
        id: leads[0].id,
        customer_name: leads[0].customer_name,
        status: leads[0].status,
        source: leads[0].source,
        created_at: leads[0].created_at,
      });

      // Check status distribution
      const statusCounts = leads.reduce((acc, lead) => {
        acc[lead.status] = (acc[lead.status] || 0) + 1;
        return acc;
      }, {});
      console.log("Status distribution:", statusCounts);

      // Check source distribution
      const sourceCounts = leads.reduce((acc, lead) => {
        acc[lead.source] = (acc[lead.source] || 0) + 1;
        return acc;
      }, {});
      console.log("Source distribution:", sourceCounts);
    }

    // Check bookings table
    console.log("\n💼 Checking bookings table...");
    const { data: bookings, error: bookingsError } = await supabase
      .from("bookings")
      .select("*");

    if (bookingsError) {
      console.error("❌ Error fetching bookings:", bookingsError);
    } else {
      console.log(`✅ Bookings found: ${bookings.length}`);
      if (bookings.length > 0) {
        console.log("First booking sample:", {
          id: bookings[0].id,
          booking_value: bookings[0].booking_value,
          status: bookings[0].status,
          booking_type: bookings[0].booking_type,
        });
      }
    }

    // Test analytics function
    console.log("\n🧮 Testing analytics function...");
    const { data: analytics, error: analyticsError } = await supabase.rpc(
      "get_leads_analytics"
    );

    if (analyticsError) {
      console.error("❌ Analytics function error:", analyticsError);
      console.error("Error details:", analyticsError);
    } else {
      console.log("✅ Analytics function result:");
      if (analytics && analytics.length > 0) {
        const result = analytics[0];
        console.log({
          total_leads: result.total_leads,
          qualified_leads: result.qualified_leads,
          converted_leads: result.converted_leads,
          total_bookings: result.total_bookings,
          conversion_rate: result.conversion_rate,
          this_month_leads: result.this_month_leads,
          leads_by_source: result.leads_by_source,
          bookings_by_type: result.bookings_by_type,
        });
      } else {
        console.log("No analytics data returned");
      }
    }

    // Test the API endpoint directly
    console.log("\n🌐 Testing API endpoint...");
    try {
      const response = await fetch(
        "http://localhost:3000/api/admin/leads?action=analytics",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const apiData = await response.json();
        console.log("✅ API response:", apiData);
      } else {
        console.error("❌ API error:", response.status, response.statusText);
        const errorText = await response.text();
        console.error("Error details:", errorText);
      }
    } catch (apiError) {
      console.error("❌ API request failed:", apiError.message);
    }
  } catch (error) {
    console.error("❌ Error checking data:", error);
  }
}

checkAnalyticsData().catch(console.error);
