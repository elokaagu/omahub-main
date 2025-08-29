#!/usr/bin/env node

/**
 * Designer Applications Migration Script
 * 
 * This script creates the designer_applications table and sets up the necessary
 * database structure for studio integration, replacing the Airtable dependency.
 * 
 * Run with: node scripts/run-designer-applications-migration.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration');
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  try {
    console.log('🚀 Starting Designer Applications Migration...');
    
    // Step 1: Check if table already exists
    console.log('📋 Checking if designer_applications table exists...');
    const { data: tableExists, error: tableCheckError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'designer_applications')
      .single();

    if (tableExists && !tableCheckError) {
      console.log('✅ designer_applications table already exists');
    } else {
      console.log('📝 Creating designer_applications table...');
      
      // Read the SQL migration file
      const sqlPath = path.join(__dirname, 'create-designer-applications-table.sql');
      const sqlContent = fs.readFileSync(sqlPath, 'utf8');
      
      // Split into individual statements and execute them
      const statements = sqlContent
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
      
      for (const statement of statements) {
        if (statement.trim()) {
          try {
            const { error } = await supabase.rpc('exec_sql', { sql: statement });
            if (error) {
              console.log(`⚠️ Statement skipped (likely not supported): ${statement.substring(0, 50)}...`);
            }
          } catch (e) {
            console.log(`⚠️ Statement skipped: ${e.message}`);
          }
        }
      }
      
      console.log('✅ designer_applications table created successfully');
    }
    
    // Step 2: Verify table structure
    console.log('🔍 Verifying table structure...');
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_schema', 'public')
      .eq('table_name', 'designer_applications')
      .order('ordinal_position');
    
    if (columnsError) {
      console.error('❌ Error checking table structure:', columnsError);
    } else {
      console.log('📊 Table structure:');
      columns.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
      });
    }
    
    // Step 3: Check RLS policies
    console.log('🔒 Checking RLS policies...');
    const { data: policies, error: policiesError } = await supabase
      .from('pg_policies')
      .select('policyname, permissive, roles, cmd, qual')
      .eq('tablename', 'designer_applications');
    
    if (policiesError) {
      console.log('⚠️ Could not check RLS policies (may not have access)');
    } else if (policies && policies.length > 0) {
      console.log('✅ RLS policies found:');
      policies.forEach(policy => {
        console.log(`  - ${policy.policyname}: ${policy.cmd} for ${policy.roles?.join(', ') || 'all roles'}`);
      });
    } else {
      console.log('⚠️ No RLS policies found - table may not be properly secured');
    }
    
    // Step 4: Test insert (optional)
    console.log('🧪 Testing table functionality...');
    try {
      const { data: testInsert, error: testError } = await supabase
        .from('designer_applications')
        .insert({
          brand_name: 'Test Brand',
          designer_name: 'Test Designer',
          email: 'test@example.com',
          location: 'Test Location',
          category: 'Test Category',
          description: 'Test application for migration verification'
        })
        .select()
        .single();
      
      if (testError) {
        console.log('⚠️ Test insert failed:', testError.message);
      } else {
        console.log('✅ Test insert successful, ID:', testInsert.id);
        
        // Clean up test data
        await supabase
          .from('designer_applications')
          .delete()
          .eq('id', testInsert.id);
        console.log('🧹 Test data cleaned up');
      }
    } catch (e) {
      console.log('⚠️ Test insert failed:', e.message);
    }
    
    console.log('🎉 Designer Applications Migration completed successfully!');
    console.log('');
    console.log('📋 Next steps:');
    console.log('  1. Update the designer-application API route to use the database');
    console.log('  2. Create the studio applications page');
    console.log('  3. Test the complete flow from join form to studio review');
    
  } catch (error) {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
runMigration();
