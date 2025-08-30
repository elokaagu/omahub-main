#!/usr/bin/env node

/**
 * Database Check Script for Leads and Inquiries
 * This script checks what data already exists in the system
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing environment variables:");
  console.error("   NEXT_PUBLIC_SUPABASE_URL:", !!supabaseUrl);
  console.error("   SUPABASE_SERVICE_ROLE_KEY:", !!supabaseServiceKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkDatabase() {
  console.log("🔍 Checking OmaHub database for leads and inquiries...\n");

  try {
    // Check brands table
    console.log("🏷️ Checking brands...");
    const { data: brands, error: brandsError } = await supabase
      .from("brands")
      .select("id, name, contact_email, category, created_at")
      .order("created_at", { ascending: false })
      .limit(10);

    if (brandsError) {
      console.error("❌ Error fetching brands:", brandsError);
    } else {
      console.log(`✅ Found ${brands.length} brands:`);
      brands.forEach((brand) => {
        console.log(
          `   • ${brand.name} (${brand.id.slice(0, 8)}...) - ${brand.contact_email || "No contact email"}`
        );
      });
    }

    // Check leads table
    console.log("\n📊 Checking leads...");
    try {
      const { data: leads, error: leadsError } = await supabase
        .from("leads")
        .select(
          `
          id,
          brand_id,
          customer_name,
          customer_email,
          source,
          lead_type,
          status,
          priority,
          created_at,
          brands(name, contact_email)
        `
        )
        .order("created_at", { ascending: false })
        .limit(20);

      if (leadsError) {
        console.error("❌ Error fetching leads:", leadsError);
        console.log(
          "   • Leads table might not exist or have different structure"
        );
      } else {
        console.log(`✅ Found ${leads.length} leads:`);
        if (leads.length === 0) {
          console.log("   • No leads found in the system");
        } else {
          leads.forEach((lead) => {
            const brandName = lead.brands?.name || "Unknown Brand";
            const brandEmail = lead.brands?.contact_email || "No contact email";
            console.log(
              `   • ${lead.customer_name} (${lead.customer_email}) - ${brandName} - ${lead.status} - ${lead.source}`
            );
            console.log(`     Brand contact: ${brandEmail}`);
          });
        }
      }
    } catch (leadsTableError) {
      console.log("   • Leads table does not exist or is not accessible");
    }

    // Check inquiries table
    console.log("\n📧 Checking inquiries...");
    try {
      const { data: inquiries, error: inquiriesError } = await supabase
        .from("inquiries")
        .select(
          `
          id,
          brand_id,
          customer_name,
          customer_email,
          subject,
          inquiry_type,
          status,
          source,
          created_at,
          brands(name, contact_email)
        `
        )
        .order("created_at", { ascending: false })
        .limit(20);

      if (inquiriesError) {
        console.error("❌ Error fetching inquiries:", inquiriesError);
        console.log(
          "   • Inquiries table might not exist or have different structure"
        );
      } else {
        console.log(`✅ Found ${inquiries.length} inquiries:`);
        if (inquiries.length === 0) {
          console.log("   • No inquiries found in the system");
        } else {
          inquiries.forEach((inquiry) => {
            const brandName = inquiry.brands?.name || "Unknown Brand";
            const brandEmail =
              inquiry.brands?.contact_email || "No contact email";
            console.log(
              `   • ${inquiry.customer_name} (${inquiry.customer_email}) - ${brandName} - ${inquiry.status} - ${inquiry.source}`
            );
            console.log(`     Subject: ${inquiry.subject}`);
            console.log(`     Brand contact: ${brandEmail}`);
          });
        }
      }
    } catch (inquiriesTableError) {
      console.log("   • Inquiries table does not exist or is not accessible");
    }

    // Check profiles for admin users
    console.log("\n👥 Checking admin profiles...");
    const { data: admins, error: adminsError } = await supabase
      .from("profiles")
      .select("id, email, role, first_name, last_name, created_at")
      .in("role", ["super_admin", "brand_admin"])
      .order("created_at", { ascending: false });

    if (adminsError) {
      console.error("❌ Error fetching admin profiles:", adminsError);
    } else {
      console.log(`✅ Found ${admins.length} admin users:`);
      admins.forEach((admin) => {
        console.log(
          `   • ${admin.email} - ${admin.role} - ${admin.first_name} ${admin.last_name}`
        );
      });
    }

    // Summary
    console.log("\n📈 SUMMARY:");
    console.log(`   • Brands: ${brands?.length || 0}`);

    // Try to get leads count
    let leadsCount = 0;
    try {
      const { count: leadsCountResult } = await supabase
        .from("leads")
        .select("*", { count: "exact", head: true });
      leadsCount = leadsCountResult || 0;
    } catch (e) {
      leadsCount = "Table not accessible";
    }

    // Try to get inquiries count
    let inquiriesCount = 0;
    try {
      const { count: inquiriesCountResult } = await supabase
        .from("inquiries")
        .select("*", { count: "exact", head: true });
      inquiriesCount = inquiriesCountResult || 0;
    } catch (e) {
      inquiriesCount = "Table not accessible";
    }

    console.log(`   • Leads: ${leadsCount}`);
    console.log(`   • Inquiries: ${inquiriesCount}`);
    console.log(`   • Admin Users: ${admins?.length || 0}`);

    if (leadsCount === 0 && inquiriesCount === 0) {
      console.log("\n💡 The system appears to be empty. You can:");
      console.log(
        '   1. Create test leads using the "Create Test Lead" button in Studio'
      );
      console.log("   2. Submit contact forms on brand pages");
      console.log(
        "   3. Place custom orders through the Order Custom Piece modal"
      );
    }
  } catch (error) {
    console.error("💥 Unexpected error:", error);
  }
}

// Run the check
checkDatabase()
  .then(() => {
    console.log("\n✅ Database check complete!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Script failed:", error);
    process.exit(1);
  });
