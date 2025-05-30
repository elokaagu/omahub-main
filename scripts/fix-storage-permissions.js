#!/usr/bin/env node

const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

// Configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing required environment variables:");
  if (!supabaseUrl) console.error("- NEXT_PUBLIC_SUPABASE_URL");
  if (!supabaseServiceKey) console.error("- SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

// Initialize Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  console.log("Starting OmaHub Storage Permissions Fix...");

  try {
    // Fix RLS policies on storage.buckets and storage.objects tables
    console.log("Fixing storage RLS policies...");
    await fixStorageRLS();

    console.log("Storage permissions fix completed successfully!");
  } catch (error) {
    console.error("Storage fix failed:", error);
    process.exit(1);
  }
}

async function fixStorageRLS() {
  try {
    console.log("Enabling RLS on storage.buckets table...");
    await supabase.rpc("enable_rls", {
      schema_name: "storage",
      table_name: "buckets",
    });

    console.log("Enabling RLS on storage.objects table...");
    await supabase.rpc("enable_rls", {
      schema_name: "storage",
      table_name: "objects",
    });

    // Create public policies for storage.buckets
    console.log("Creating public policies for storage.buckets...");
    await supabase.rpc("create_policy", {
      schema_name: "storage",
      table_name: "buckets",
      name: "Public SELECT policy",
      definition: "true",
      check: "",
      operation: "SELECT",
    });

    // Create policies for storage.objects
    console.log("Creating public policies for storage.objects...");
    await supabase.rpc("create_policy", {
      schema_name: "storage",
      table_name: "objects",
      name: "Public SELECT policy for brand-assets",
      definition: "bucket_id = 'brand-assets'",
      check: "",
      operation: "SELECT",
    });

    await supabase.rpc("create_policy", {
      schema_name: "storage",
      table_name: "objects",
      name: "Auth INSERT policy for brand-assets",
      definition:
        "bucket_id = 'brand-assets' AND auth.role() = 'authenticated'",
      check: "true",
      operation: "INSERT",
    });

    await supabase.rpc("create_policy", {
      schema_name: "storage",
      table_name: "objects",
      name: "Public SELECT policy for profiles",
      definition: "bucket_id = 'profiles'",
      check: "",
      operation: "SELECT",
    });

    await supabase.rpc("create_policy", {
      schema_name: "storage",
      table_name: "objects",
      name: "Auth INSERT policy for profiles",
      definition: "bucket_id = 'profiles' AND auth.role() = 'authenticated'",
      check: "true",
      operation: "INSERT",
    });

    console.log("RLS policies created successfully");
  } catch (error) {
    console.error("Error fixing RLS policies:", error.message);
    throw error;
  }
}

// Run the script
main();
