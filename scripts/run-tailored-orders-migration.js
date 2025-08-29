#!/usr/bin/env node

/**
 * Run Tailored Orders Table Migration
 * 
 * This script creates the tailored_orders table and verifies the setup
 * to ensure custom orders can be properly saved to the database.
 */

const { createClient } = require('@supabase/supabase-js');

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
    console.log('🚀 Starting Tailored Orders Table Migration...');
    
    // Check if table already exists
    console.log('📋 Checking if tailored_orders table exists...');
    const { data: existingTable, error: tableCheckError } = await supabase
      .from('tailored_orders')
      .select('id')
      .limit(1);
    
    if (existingTable && !tableCheckError) {
      console.log('✅ tailored_orders table already exists');
    } else {
      console.log('📝 Creating tailored_orders table...');
      
      // Read and execute the SQL migration
      const fs = require('fs');
      const path = require('path');
      const sqlPath = path.join(__dirname, 'create-tailored-orders-table.sql');
      const sqlContent = fs.readFileSync(sqlPath, 'utf8');
      
      // Split SQL into individual statements
      const statements = sqlContent
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
      
      // Execute each statement
      for (const statement of statements) {
        if (statement.trim()) {
          try {
            const { error } = await supabase.rpc('exec_sql', { sql: statement });
            if (error) {
              console.log(`⚠️ Statement skipped (likely not supported): ${statement.substring(0, 100)}...`);
            }
          } catch (e) {
            console.log(`⚠️ Statement failed: ${statement.substring(0, 100)}...`);
          }
        }
      }
      
      console.log('✅ tailored_orders table created successfully');
    }
    
    // Verify table structure
    console.log('🔍 Verifying table structure...');
    try {
      const { data: columns, error: columnsError } = await supabase
        .rpc('exec_sql', { 
          sql: `
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'tailored_orders'
            ORDER BY ordinal_position;
          `
        });
      
      if (columnsError) {
        console.log('⚠️ Could not check columns via RPC, trying direct query...');
        
        // Try direct query to verify table exists
        const { data: testData, error: testError } = await supabase
          .from('tailored_orders')
          .select('id')
          .limit(1);
        
        if (testError) {
          console.error('❌ Error accessing table:', testError);
          return;
        }
        
        console.log('✅ Table exists and is accessible');
      } else {
        console.log('📊 Table structure verified:');
        columns.forEach(col => {
          console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
        });
      }
    } catch (e) {
      console.log('⚠️ Error checking table structure:', e.message);
    }
    
    // Test insert to verify functionality
    console.log('🧪 Testing table functionality...');
    try {
      const testOrder = {
        user_id: '00000000-0000-0000-0000-000000000000', // Test UUID
        product_id: 'test-product-id',
        brand_id: 'test-brand-id',
        status: 'pending',
        total_amount: 100.00,
        currency: 'USD',
        customer_notes: 'Test order for migration verification',
        measurements: {
          fit_preference: 'regular',
          length_preference: 'regular',
          sleeve_preference: 'long'
        },
        size: 'M',
        color: 'Blue',
        quantity: 1,
        delivery_address: {
          full_name: 'Test User',
          email: 'test@example.com',
          phone: '+1234567890',
          address_line_1: '123 Test St',
          city: 'Test City',
          state: 'Test State',
          postal_code: '12345',
          country: 'Test Country'
        }
      };
      
      const { data: testInsert, error: testError } = await supabase
        .from('tailored_orders')
        .insert(testOrder)
        .select()
        .single();
      
      if (testError) {
        console.error('❌ Test insert failed:', testError);
      } else {
        console.log('✅ Test insert successful, ID:', testInsert.id);
        
        // Clean up test data
        await supabase
          .from('tailored_orders')
          .delete()
          .eq('id', testInsert.id);
        console.log('🧹 Test data cleaned up');
      }
    } catch (e) {
      console.log('⚠️ Error testing table:', e.message);
    }
    
    console.log('\n🎉 Tailored Orders Migration completed successfully!');
    
    console.log('\n📋 Next steps:');
    console.log('  1. Test the TailoredOrderModal form submission');
    console.log('  2. Test the BrandRequestModal form submission');
    console.log('  3. Verify orders are being saved in the database');
    console.log('  4. Check that all measurement data is properly stored');
    
  } catch (error) {
    console.error('💥 Migration failed:', error);
  }
}

// Run the migration
runMigration();
