#!/usr/bin/env node

/**
 * Direct approach to create sample leads data for dashboard demonstration
 */

const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing required environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createSampleLeads() {
  console.log("🎯 Creating Sample Leads for Dashboard");
  console.log("=====================================");

  try {
    // First, get or create brands
    let { data: brands, error: brandsError } = await supabase
      .from("brands")
      .select("id, name")
      .limit(4);

    if (brandsError) {
      console.error("❌ Error fetching brands:", brandsError);
      return;
    }

    // Create sample brands if none exist
    if (!brands || brands.length === 0) {
      console.log("📦 Creating sample brands...");

      const sampleBrands = [
        {
          name: "Adunni Couture",
          category: "Fashion",
          description:
            "Premium Nigerian fashion house specializing in contemporary African wear",
          location: "Lagos, Nigeria",
          image:
            "https://images.unsplash.com/photo-1445205170230-053b83016050?w=100",
        },
        {
          name: "Kemi Beauty Studio",
          category: "Beauty",
          description:
            "Professional makeup and beauty services for special occasions",
          location: "Abuja, Nigeria",
          image:
            "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=100",
        },
        {
          name: "Tolu Photography",
          category: "Photography",
          description: "Wedding and event photography with artistic flair",
          location: "Lagos, Nigeria",
          image:
            "https://images.unsplash.com/photo-1554048612-b6ebae92138d?w=100",
        },
        {
          name: "Eko Catering Co",
          category: "Catering",
          description: "Authentic Nigerian cuisine for events and celebrations",
          location: "Lagos, Nigeria",
          image:
            "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=100",
        },
      ];

      const { data: newBrands, error: createError } = await supabase
        .from("brands")
        .insert(sampleBrands)
        .select("id, name");

      if (createError) {
        console.error("❌ Error creating brands:", createError);
        return;
      }

      brands = newBrands;
      console.log(`✅ Created ${brands.length} sample brands`);
    }

    console.log(`📦 Using ${brands.length} brands for sample leads`);

    // Clear existing sample leads
    console.log("🧹 Clearing existing sample leads...");
    await supabase
      .from("leads")
      .delete()
      .or("customer_email.like.%@example.com,customer_email.like.%@sample.com");

    // Create diverse sample leads
    const sampleLeads = [
      // Recent leads (this month)
      {
        brand_id: brands[0].id,
        customer_name: "Funmi Adebayo",
        customer_email: "funmi.adebayo@example.com",
        customer_phone: "+234-803-123-4567",
        source: "instagram",
        lead_type: "quote_request",
        status: "new",
        priority: "high",
        estimated_value: 150000.0,
        notes: "Interested in custom wedding dress for December ceremony",
        created_at: new Date(
          Date.now() - 2 * 24 * 60 * 60 * 1000
        ).toISOString(),
        updated_at: new Date(
          Date.now() - 2 * 24 * 60 * 60 * 1000
        ).toISOString(),
      },
      {
        brand_id: brands[1]?.id || brands[0].id,
        customer_name: "Chioma Okafor",
        customer_email: "chioma.okafor@example.com",
        customer_phone: "+234-805-987-6543",
        source: "website",
        lead_type: "booking_intent",
        status: "contacted",
        priority: "urgent",
        estimated_value: 75000.0,
        notes: "Bridal makeup for wedding next month, needs trial session",
        created_at: new Date(
          Date.now() - 5 * 24 * 60 * 60 * 1000
        ).toISOString(),
        updated_at: new Date(
          Date.now() - 1 * 24 * 60 * 60 * 1000
        ).toISOString(),
        contacted_at: new Date(
          Date.now() - 1 * 24 * 60 * 60 * 1000
        ).toISOString(),
      },
      {
        brand_id: brands[2]?.id || brands[0].id,
        customer_name: "David Johnson",
        customer_email: "david.johnson@example.com",
        customer_phone: "+234-807-456-7890",
        source: "referral",
        lead_type: "consultation",
        status: "qualified",
        priority: "high",
        estimated_value: 200000.0,
        notes:
          "Pre-wedding and wedding photography package, referred by previous client",
        created_at: new Date(
          Date.now() - 7 * 24 * 60 * 60 * 1000
        ).toISOString(),
        updated_at: new Date(
          Date.now() - 3 * 24 * 60 * 60 * 1000
        ).toISOString(),
        contacted_at: new Date(
          Date.now() - 5 * 24 * 60 * 60 * 1000
        ).toISOString(),
        qualified_at: new Date(
          Date.now() - 3 * 24 * 60 * 60 * 1000
        ).toISOString(),
      },
      {
        brand_id: brands[3]?.id || brands[0].id,
        customer_name: "Amina Hassan",
        customer_email: "amina.hassan@example.com",
        customer_phone: "+234-809-234-5678",
        source: "whatsapp",
        lead_type: "inquiry",
        status: "converted",
        priority: "normal",
        estimated_value: 120000.0,
        notes: "Traditional wedding catering for 200 guests",
        created_at: new Date(
          Date.now() - 10 * 24 * 60 * 60 * 1000
        ).toISOString(),
        updated_at: new Date(
          Date.now() - 2 * 24 * 60 * 60 * 1000
        ).toISOString(),
        contacted_at: new Date(
          Date.now() - 8 * 24 * 60 * 60 * 1000
        ).toISOString(),
        qualified_at: new Date(
          Date.now() - 6 * 24 * 60 * 60 * 1000
        ).toISOString(),
        converted_at: new Date(
          Date.now() - 2 * 24 * 60 * 60 * 1000
        ).toISOString(),
      },
      {
        brand_id: brands[0].id,
        customer_name: "Grace Emeka",
        customer_email: "grace.emeka@example.com",
        customer_phone: "+234-806-345-6789",
        source: "email",
        lead_type: "product_interest",
        status: "contacted",
        priority: "normal",
        estimated_value: 85000.0,
        notes: "Looking for Ankara outfit for corporate event",
        created_at: new Date(
          Date.now() - 3 * 24 * 60 * 60 * 1000
        ).toISOString(),
        updated_at: new Date(
          Date.now() - 1 * 24 * 60 * 60 * 1000
        ).toISOString(),
        contacted_at: new Date(
          Date.now() - 1 * 24 * 60 * 60 * 1000
        ).toISOString(),
      },
      // Older leads for better analytics
      {
        brand_id: brands[1]?.id || brands[0].id,
        customer_name: "Blessing Okoro",
        customer_email: "blessing.okoro@sample.com",
        customer_phone: "+234-808-567-8901",
        source: "phone",
        lead_type: "booking_intent",
        status: "converted",
        priority: "high",
        estimated_value: 95000.0,
        notes: "Birthday photoshoot and makeup package",
        created_at: new Date(
          Date.now() - 21 * 24 * 60 * 60 * 1000
        ).toISOString(),
        updated_at: new Date(
          Date.now() - 14 * 24 * 60 * 60 * 1000
        ).toISOString(),
        contacted_at: new Date(
          Date.now() - 17 * 24 * 60 * 60 * 1000
        ).toISOString(),
        qualified_at: new Date(
          Date.now() - 14 * 24 * 60 * 60 * 1000
        ).toISOString(),
        converted_at: new Date(
          Date.now() - 14 * 24 * 60 * 60 * 1000
        ).toISOString(),
      },
      {
        brand_id: brands[2]?.id || brands[0].id,
        customer_name: "Michael Ade",
        customer_email: "michael.ade@sample.com",
        customer_phone: "+234-804-678-9012",
        source: "direct",
        lead_type: "consultation",
        status: "lost",
        priority: "low",
        estimated_value: 180000.0,
        notes: "Engagement shoot, client went with another photographer",
        created_at: new Date(
          Date.now() - 30 * 24 * 60 * 60 * 1000
        ).toISOString(),
        updated_at: new Date(
          Date.now() - 21 * 24 * 60 * 60 * 1000
        ).toISOString(),
        contacted_at: new Date(
          Date.now() - 21 * 24 * 60 * 60 * 1000
        ).toISOString(),
      },
      {
        brand_id: brands[3]?.id || brands[0].id,
        customer_name: "Fatima Bello",
        customer_email: "fatima.bello@sample.com",
        customer_phone: "+234-802-789-0123",
        source: "instagram",
        lead_type: "quote_request",
        status: "qualified",
        priority: "normal",
        estimated_value: 250000.0,
        notes: "Corporate event catering, pending final approval",
        created_at: new Date(
          Date.now() - 14 * 24 * 60 * 60 * 1000
        ).toISOString(),
        updated_at: new Date(
          Date.now() - 7 * 24 * 60 * 60 * 1000
        ).toISOString(),
        contacted_at: new Date(
          Date.now() - 10 * 24 * 60 * 60 * 1000
        ).toISOString(),
        qualified_at: new Date(
          Date.now() - 7 * 24 * 60 * 60 * 1000
        ).toISOString(),
      },
      {
        brand_id: brands[0].id,
        customer_name: "Kemi Afolabi",
        customer_email: "kemi.afolabi@sample.com",
        customer_phone: "+234-807-890-1234",
        source: "referral",
        lead_type: "inquiry",
        status: "closed",
        priority: "low",
        estimated_value: 60000.0,
        notes: "Casual wear inquiry, completed purchase in-store",
        created_at: new Date(
          Date.now() - 35 * 24 * 60 * 60 * 1000
        ).toISOString(),
        updated_at: new Date(
          Date.now() - 28 * 24 * 60 * 60 * 1000
        ).toISOString(),
        contacted_at: new Date(
          Date.now() - 28 * 24 * 60 * 60 * 1000
        ).toISOString(),
        qualified_at: new Date(
          Date.now() - 28 * 24 * 60 * 60 * 1000
        ).toISOString(),
        converted_at: new Date(
          Date.now() - 28 * 24 * 60 * 60 * 1000
        ).toISOString(),
      },
      {
        brand_id: brands[1]?.id || brands[0].id,
        customer_name: "Ola Adeyemi",
        customer_email: "ola.adeyemi@sample.com",
        customer_phone: "+234-805-901-2345",
        source: "website",
        lead_type: "consultation",
        status: "new",
        priority: "normal",
        estimated_value: 45000.0,
        notes: "Makeup consultation for professional headshots",
        created_at: new Date(
          Date.now() - 42 * 24 * 60 * 60 * 1000
        ).toISOString(),
        updated_at: new Date(
          Date.now() - 42 * 24 * 60 * 60 * 1000
        ).toISOString(),
      },
    ];

    console.log("📝 Creating sample leads...");

    const { data: createdLeads, error: leadsError } = await supabase
      .from("leads")
      .insert(sampleLeads)
      .select("*");

    if (leadsError) {
      console.error("❌ Error creating leads:", leadsError);
      return;
    }

    console.log(`✅ Created ${createdLeads.length} sample leads`);

    // Show breakdown by status
    const statusCounts = createdLeads.reduce((acc, lead) => {
      acc[lead.status] = (acc[lead.status] || 0) + 1;
      return acc;
    }, {});

    console.log("📊 Leads by status:");
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`   ${status}: ${count}`);
    });

    // Show breakdown by source
    const sourceCounts = createdLeads.reduce((acc, lead) => {
      acc[lead.source] = (acc[lead.source] || 0) + 1;
      return acc;
    }, {});

    console.log("📊 Leads by source:");
    Object.entries(sourceCounts).forEach(([source, count]) => {
      console.log(`   ${source}: ${count}`);
    });

    // Create sample bookings for converted leads
    console.log("💰 Creating sample bookings for converted leads...");

    const convertedLeads = createdLeads.filter(
      (lead) => lead.status === "converted"
    );

    if (convertedLeads.length > 0) {
      const sampleBookings = convertedLeads.map((lead) => ({
        lead_id: lead.id,
        brand_id: lead.brand_id,
        customer_name: lead.customer_name,
        customer_email: lead.customer_email,
        booking_type:
          lead.lead_type === "booking_intent" ? "service" : "product",
        booking_date: new Date(
          new Date(lead.converted_at).getTime() + 7 * 24 * 60 * 60 * 1000
        ).toISOString(),
        booking_value: lead.estimated_value,
        commission_rate: 15.0,
        commission_amount: lead.estimated_value * 0.15,
        status: "confirmed",
        created_at: lead.converted_at,
      }));

      const { error: bookingsError } = await supabase
        .from("bookings")
        .insert(sampleBookings);

      if (bookingsError) {
        console.error("❌ Error creating bookings:", bookingsError);
      } else {
        console.log(`✅ Created ${sampleBookings.length} sample bookings`);
      }
    }

    console.log("");
    console.log("🎉 Sample leads created successfully!");
    console.log("");
    console.log("📝 Next steps:");
    console.log("   1. Visit your studio dashboard at /studio");
    console.log("   2. Check the Leads Tracking section");
    console.log("   3. You should see sample leads with various statuses");
    console.log("   4. Charts should show leads by source and monthly trends");
    console.log("   5. Analytics should show conversion rates and revenue");
    console.log("");
    console.log("🧹 To remove sample data later, run:");
    console.log(
      "   DELETE FROM bookings WHERE customer_email LIKE '%@example.com' OR customer_email LIKE '%@sample.com';"
    );
    console.log(
      "   DELETE FROM leads WHERE customer_email LIKE '%@example.com' OR customer_email LIKE '%@sample.com';"
    );
  } catch (error) {
    console.error("❌ Error creating sample leads:", error);
  }
}

if (require.main === module) {
  createSampleLeads();
}

module.exports = { createSampleLeads };
