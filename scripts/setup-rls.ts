import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing required environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupRLSPolicies() {
  try {
    console.log("Setting up RLS policies...");

    // Enable RLS on brands table
    const { error: enableRLSError } = await supabase.rpc(
      "alter_table_enable_rls",
      {
        table_name: "brands",
      }
    );

    if (enableRLSError) {
      console.error("Error enabling RLS:", enableRLSError);
      return;
    }

    // Create policy for public read access
    const { error: policyError } = await supabase.rpc("create_policy", {
      table_name: "brands",
      policy_name: "Enable read access for all users",
      definition: "true",
      check_statement: "",
      policy_operation: "SELECT",
    });

    if (policyError) {
      console.error("Error creating policy:", policyError);
      return;
    }

    console.log("✅ Successfully set up RLS policies");
  } catch (error) {
    console.error("Error setting up RLS policies:", error);
  }
}

setupRLSPolicies();
