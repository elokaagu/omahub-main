#!/usr/bin/env node

/**
 * Script to populate the database with sample leads data for dashboard demonstration
 * This will create diverse leads across different brands, sources, and statuses
 */

const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

// Load environment variables
require("dotenv").config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing required environment variables:");
  console.error("   - NEXT_PUBLIC_SUPABASE_URL");
  console.error("   - SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function populateSampleLeads() {
  try {
    console.log("🚀 Starting sample leads population...");

    // Read the SQL file
    const sqlFilePath = path.join(__dirname, "add-sample-leads.sql");
    const sqlContent = fs.readFileSync(sqlFilePath, "utf8");

    console.log("📄 Executing SQL script...");

    // Execute the SQL script
    const { data, error } = await supabase.rpc("exec_sql", {
      sql: sqlContent,
    });

    if (error) {
      // If exec_sql doesn't exist, try direct execution
      console.log(
        "⚠️  exec_sql function not available, trying direct approach..."
      );

      // Split SQL into individual statements and execute them
      const statements = sqlContent
        .split(";")
        .map((stmt) => stmt.trim())
        .filter((stmt) => stmt.length > 0 && !stmt.startsWith("--"));

      for (const statement of statements) {
        if (statement.includes("DO $$") || statement.includes("SELECT")) {
          console.log("🔄 Executing statement...");
          const { error: stmtError } = await supabase.rpc("exec", {
            query: statement,
          });

          if (stmtError) {
            console.error("❌ Error executing statement:", stmtError);
            // Continue with other statements
          }
        }
      }
    } else {
      console.log("✅ SQL script executed successfully");
    }

    // Verify the data was created by checking leads count
    console.log("🔍 Verifying sample data...");

    const { data: leadsData, error: leadsError } = await supabase
      .from("leads")
      .select("*")
      .or("customer_email.like.%@example.com,customer_email.like.%@sample.com");

    if (leadsError) {
      console.error("❌ Error verifying leads:", leadsError);
    } else {
      console.log(`✅ Sample leads created: ${leadsData.length}`);

      // Show breakdown by status
      const statusCounts = leadsData.reduce((acc, lead) => {
        acc[lead.status] = (acc[lead.status] || 0) + 1;
        return acc;
      }, {});

      console.log("📊 Leads by status:");
      Object.entries(statusCounts).forEach(([status, count]) => {
        console.log(`   ${status}: ${count}`);
      });
    }

    // Check analytics function
    console.log("🧮 Testing analytics function...");

    const { data: analyticsData, error: analyticsError } = await supabase.rpc(
      "get_leads_analytics",
      {
        admin_user_id: "00000000-0000-0000-0000-000000000000", // Placeholder ID
      }
    );

    if (analyticsError) {
      console.error("❌ Analytics function error:", analyticsError);
    } else {
      console.log("✅ Analytics function working:");
      console.log(`   Total leads: ${analyticsData[0]?.total_leads || 0}`);
      console.log(
        `   Conversion rate: ${analyticsData[0]?.conversion_rate || 0}%`
      );
    }

    console.log("🎉 Sample leads population completed!");
    console.log("");
    console.log("📝 Next steps:");
    console.log("   1. Visit your studio dashboard");
    console.log("   2. Check the Leads Tracking section");
    console.log("   3. You should see sample leads with various statuses");
    console.log("   4. Charts should show leads by source and monthly trends");
    console.log("");
    console.log("🧹 To remove sample data later, run:");
    console.log(
      "   DELETE FROM leads WHERE customer_email LIKE '%@example.com' OR customer_email LIKE '%@sample.com';"
    );
  } catch (error) {
    console.error("❌ Error populating sample leads:", error);
    process.exit(1);
  }
}

// Alternative approach: Create leads directly via API calls
async function createSampleLeadsDirectly() {
  console.log("🔄 Creating sample leads directly...");

  const sampleLeads = [
    {
      brand_id: null, // Will be set dynamically
      customer_name: "Funmi Adebayo",
      customer_email: "funmi.adebayo@example.com",
      customer_phone: "+234-803-123-4567",
      source: "instagram",
      lead_type: "quote_request",
      status: "new",
      priority: "high",
      estimated_value: 150000.0,
      notes: "Interested in custom wedding dress for December ceremony",
    },
    {
      brand_id: null,
      customer_name: "Chioma Okafor",
      customer_email: "chioma.okafor@example.com",
      customer_phone: "+234-805-987-6543",
      source: "website",
      lead_type: "booking_intent",
      status: "contacted",
      priority: "urgent",
      estimated_value: 75000.0,
      notes: "Bridal makeup for wedding next month, needs trial session",
    },
    {
      brand_id: null,
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
    },
    {
      brand_id: null,
      customer_name: "Amina Hassan",
      customer_email: "amina.hassan@example.com",
      customer_phone: "+234-809-234-5678",
      source: "whatsapp",
      lead_type: "inquiry",
      status: "converted",
      priority: "normal",
      estimated_value: 120000.0,
      notes: "Traditional wedding catering for 200 guests",
    },
    {
      brand_id: null,
      customer_name: "Grace Emeka",
      customer_email: "grace.emeka@example.com",
      customer_phone: "+234-806-345-6789",
      source: "email",
      lead_type: "product_interest",
      status: "contacted",
      priority: "normal",
      estimated_value: 85000.0,
      notes: "Looking for Ankara outfit for corporate event",
    },
  ];

  // Get first brand ID to use for all sample leads
  const { data: brands, error: brandsError } = await supabase
    .from("brands")
    .select("id")
    .limit(1);

  if (brandsError || !brands || brands.length === 0) {
    console.error("❌ No brands found. Please create brands first.");
    return;
  }

  const brandId = brands[0].id;

  // Create sample leads
  for (const leadData of sampleLeads) {
    leadData.brand_id = brandId;

    const { error } = await supabase.from("leads").insert(leadData);

    if (error) {
      console.error(
        `❌ Error creating lead for ${leadData.customer_name}:`,
        error
      );
    } else {
      console.log(`✅ Created lead for ${leadData.customer_name}`);
    }
  }

  console.log("✅ Sample leads created directly!");
}

// Main execution
async function main() {
  console.log("🎯 OmaHub Sample Leads Population");
  console.log("==================================");

  try {
    // Try SQL approach first, then fallback to direct creation
    await populateSampleLeads();
  } catch (error) {
    console.log("⚠️  SQL approach failed, trying direct creation...");
    await createSampleLeadsDirectly();
  }
}

if (require.main === module) {
  main();
}

module.exports = { populateSampleLeads, createSampleLeadsDirectly };
