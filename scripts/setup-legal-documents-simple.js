const { createClient } = require("@supabase/supabase-js");

// Load environment variables
require("dotenv").config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing required environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupLegalDocuments() {
  try {
    console.log("Setting up legal documents table...");

    // First, check if the table already exists
    const { data: existingData, error: checkError } = await supabase
      .from("legal_documents")
      .select("id")
      .limit(1);

    if (!checkError) {
      console.log("✅ Legal documents table already exists!");

      // Check if we have documents
      const { data: docs, error: docsError } = await supabase
        .from("legal_documents")
        .select("*");

      if (!docsError) {
        console.log(`Found ${docs?.length || 0} documents`);
        docs?.forEach((doc) => {
          console.log(
            `- ${doc.document_type}: ${doc.title} (v${doc.version}, active: ${doc.is_active})`
          );
        });
      }
      return;
    }

    console.log("Table does not exist, creating...");

    // Create the table using individual operations
    console.log(
      "Please run the SQL script manually in Supabase Dashboard > SQL Editor:"
    );
    console.log(
      "Copy the contents of scripts/create-legal-documents-table.sql"
    );
    console.log("");
    console.log("Or create the table manually with these steps:");
    console.log("1. Go to Supabase Dashboard");
    console.log("2. Navigate to SQL Editor");
    console.log(
      "3. Paste and run the SQL from create-legal-documents-table.sql"
    );
  } catch (error) {
    console.error("Setup failed:", error);
    console.log("");
    console.log("Please manually create the table using Supabase Dashboard:");
    console.log("1. Go to Supabase Dashboard > SQL Editor");
    console.log(
      "2. Copy and paste the SQL from scripts/create-legal-documents-table.sql"
    );
    console.log("3. Run the SQL script");
  }
}

setupLegalDocuments();
