#!/usr/bin/env node

/**
 * Run the inquiries table migration
 * This script will create the inquiries table if it doesn't exist
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Load environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  console.error('');
  console.error('Please set these environment variables and try again.');
  process.exit(1);
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  try {
    console.log('🚀 Starting inquiries table migration...');
    
    // Read the SQL script
    const sqlPath = path.join(process.cwd(), 'scripts', 'create-inquiries-table-simple.sql');
    const sqlScript = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('📖 SQL script loaded, length:', sqlScript.length, 'characters');
    
    // Check if inquiries table already exists
    console.log('🔍 Checking if inquiries table exists...');
    const { data: existingTable, error: checkError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'inquiries')
      .single();
    
    if (existingTable) {
      console.log('✅ Inquiries table already exists!');
      return;
    }
    
    console.log('📝 Inquiries table does not exist, creating it...');
    
    // Run the SQL script
    const { error: migrationError } = await supabase.rpc('exec_sql', { sql: sqlScript });
    
    if (migrationError) {
      console.error('❌ Migration failed:', migrationError);
      
      // If RPC method doesn't exist, provide manual instructions
      if (migrationError.code === '42883') {
        console.log('');
        console.log('💡 The exec_sql RPC method is not available.');
        console.log('Please run the SQL script manually in your Supabase dashboard:');
        console.log('');
        console.log('1. Go to your Supabase project dashboard');
        console.log('2. Navigate to SQL Editor');
        console.log('3. Copy and paste the contents of: scripts/create-inquiries-table-simple.sql');
        console.log('4. Click "Run" to execute the script');
        console.log('');
        console.log('Or use the Supabase CLI:');
        console.log('   supabase db push --include-all');
      }
      
      process.exit(1);
    }
    
    console.log('✅ Migration completed successfully!');
    console.log('🎉 Inquiries table created and ready to use.');
    
  } catch (error) {
    console.error('❌ Migration failed with error:', error);
    process.exit(1);
  }
}

// Run the migration
runMigration();
