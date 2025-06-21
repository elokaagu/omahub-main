const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing Supabase environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function diagnoseAuthIssues() {
  console.log("🔍 OMAHUB AUTHENTICATION DIAGNOSTIC\n");

  try {
    // Check database connection
    console.log("1. Testing database connection...");
    const { data, error } = await supabase
      .from("profiles")
      .select("count")
      .limit(1);
    if (error) {
      console.error("❌ Database connection failed:", error.message);
      return;
    }
    console.log("✅ Database connection successful\n");

    // Check user profiles
    console.log("2. Checking user profiles...");
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, email, role, owned_brands")
      .order("created_at", { ascending: false });

    if (profilesError) {
      console.error("❌ Failed to fetch profiles:", profilesError.message);
      return;
    }

    console.log(`✅ Found ${profiles.length} user profiles:`);
    profiles.forEach((profile) => {
      console.log(`   - ${profile.email} (${profile.role})`);
    });
    console.log("");

    // Check for your specific user
    console.log("3. Checking your user account...");
    const targetEmail = "eloka.agu@icloud.com";
    const { data: userProfile, error: userError } = await supabase
      .from("profiles")
      .select("*")
      .eq("email", targetEmail)
      .single();

    if (userError) {
      console.error(`❌ User ${targetEmail} not found:`, userError.message);
    } else {
      console.log(`✅ User ${targetEmail} found:`);
      console.log(`   - ID: ${userProfile.id}`);
      console.log(`   - Role: ${userProfile.role}`);
      console.log(
        `   - Owned Brands: ${JSON.stringify(userProfile.owned_brands)}`
      );
      console.log(`   - Created: ${userProfile.created_at}`);
    }
    console.log("");

    // Test analytics function
    console.log("4. Testing analytics function...");
    const { data: analyticsData, error: analyticsError } = await supabase.rpc(
      "get_leads_analytics"
    );

    if (analyticsError) {
      console.error("❌ Analytics function failed:", analyticsError.message);
    } else {
      console.log("✅ Analytics function working:");
      console.log(`   - Total Leads: ${analyticsData.total_leads}`);
      console.log(`   - This Month: ${analyticsData.this_month_leads}`);
      console.log(`   - Conversion Rate: ${analyticsData.conversion_rate}%`);
    }
    console.log("");

    // Check leads data
    console.log("5. Checking leads data...");
    const { data: leads, error: leadsError } = await supabase
      .from("leads")
      .select("id, customer_name, source, status, created_at")
      .order("created_at", { ascending: false })
      .limit(5);

    if (leadsError) {
      console.error("❌ Failed to fetch leads:", leadsError.message);
    } else {
      console.log(`✅ Found ${leads.length} recent leads:`);
      leads.forEach((lead) => {
        console.log(
          `   - ${lead.customer_name} (${lead.source}, ${lead.status})`
        );
      });
    }
    console.log("");

    // Check inquiries data
    console.log("6. Checking inquiries data...");
    const { data: inquiries, error: inquiriesError } = await supabase
      .from("inquiries")
      .select("id, name, email, status, created_at")
      .order("created_at", { ascending: false })
      .limit(5);

    if (inquiriesError) {
      console.error("❌ Failed to fetch inquiries:", inquiriesError.message);
    } else {
      console.log(`✅ Found ${inquiries.length} recent inquiries:`);
      inquiries.forEach((inquiry) => {
        console.log(
          `   - ${inquiry.name} (${inquiry.email}, ${inquiry.status})`
        );
      });
    }
    console.log("");

    // Check RLS policies
    console.log("7. Checking RLS policies...");
    const { data: policies, error: policiesError } = await supabase
      .rpc("pg_policies")
      .select(
        "schemaname, tablename, policyname, permissive, roles, cmd, qual"
      );

    if (policiesError) {
      console.log("⚠️ Could not check RLS policies (expected in some setups)");
    } else {
      console.log(`✅ Found ${policies.length} RLS policies`);
    }

    console.log("\n🎉 DIAGNOSTIC COMPLETE");
    console.log("\n📝 RECOMMENDATIONS:");
    console.log(
      "1. If APIs are returning 401 errors, the issue is likely frontend session cookies"
    );
    console.log(
      "2. Use the AuthenticationFixer component in your studio dashboard"
    );
    console.log("3. Try signing out completely and signing back in");
    console.log("4. Clear browser storage and cookies if needed");
  } catch (error) {
    console.error("❌ Diagnostic failed:", error);
  }
}

diagnoseAuthIssues();
