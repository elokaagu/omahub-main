const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function promoteUser(email, role = "super_admin") {
  try {
    console.log(`🔧 Promoting ${email} to ${role}...`);

    // Check if user exists
    const { data: user, error: fetchError } = await supabase
      .from("profiles")
      .select("id, email, role")
      .eq("email", email)
      .single();

    if (fetchError) {
      console.error(`❌ User ${email} not found:`, fetchError);
      return;
    }

    console.log(`👤 Found user: ${user.email} (current role: ${user.role})`);

    if (user.role === role) {
      console.log(`✅ User already has ${role} role`);
      return;
    }

    // Update user role
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ role, updated_at: new Date().toISOString() })
      .eq("email", email);

    if (updateError) {
      console.error(`❌ Error updating user:`, updateError);
      return;
    }

    console.log(`✅ Successfully promoted ${email} to ${role}`);

    // Verify the update
    const { data: updatedUser } = await supabase
      .from("profiles")
      .select("id, email, role, updated_at")
      .eq("email", email)
      .single();

    console.log("📋 Updated user profile:");
    console.table([updatedUser]);
  } catch (error) {
    console.error("❌ Script error:", error);
  }
}

// Get email from command line argument
const email = process.argv[2];
const role = process.argv[3] || "super_admin";

if (!email) {
  console.log("Usage: node scripts/promote-user.js <email> [role]");
  console.log(
    "Example: node scripts/promote-user.js user@example.com super_admin"
  );
  console.log("Available roles: user, brand_admin, admin, super_admin");
  process.exit(1);
}

promoteUser(email, role);
