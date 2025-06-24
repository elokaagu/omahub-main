const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

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

    // Read the SQL file
    const sqlPath = path.join(__dirname, "create-legal-documents-table.sql");
    const sqlContent = fs.readFileSync(sqlPath, "utf8");

    // Split the SQL into individual statements (removing comments and empty lines)
    const statements = sqlContent
      .split(";")
      .map((stmt) => stmt.trim())
      .filter(
        (stmt) =>
          stmt &&
          !stmt.startsWith("--") &&
          stmt !==
            "SELECT 'Legal Documents Table Created Successfully' as status"
      );

    console.log(`Executing ${statements.length} SQL statements...`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement) {
        try {
          console.log(`Executing statement ${i + 1}/${statements.length}...`);
          const { error } = await supabase.rpc("exec_sql", { sql: statement });
          if (error) {
            console.error(`Error in statement ${i + 1}:`, error);
          }
        } catch (err) {
          console.error(`Error executing statement ${i + 1}:`, err);
        }
      }
    }

    // Test the setup by fetching documents
    console.log("Testing the setup...");
    const { data, error } = await supabase
      .from("legal_documents")
      .select("*")
      .order("document_type", { ascending: true });

    if (error) {
      console.error("Error testing setup:", error);
    } else {
      console.log("✅ Legal documents table setup successful!");
      console.log("Documents found:", data?.length || 0);
      data?.forEach((doc) => {
        console.log(
          `- ${doc.document_type}: ${doc.title} (v${doc.version}, active: ${doc.is_active})`
        );
      });
    }
  } catch (error) {
    console.error("Setup failed:", error);
  }
}

setupLegalDocuments();
