#!/usr/bin/env node

/**
 * Verify Designer Applications Table Structure
 * 
 * This script checks the designer_applications table structure and adds
 * any missing columns or fixes permissions.
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

async function verifyTable() {
  try {
    console.log('🔍 Verifying designer_applications table structure...');
    
    // Check if table exists and get its structure
    const { data: columns, error: columnsError } = await supabase
      .rpc('exec_sql', { 
        sql: `
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'designer_applications'
          ORDER BY ordinal_position;
        `
      });

    if (columnsError) {
      console.log('⚠️ Could not check columns via RPC, trying direct query...');
      
      // Try direct query
      const { data: testData, error: testError } = await supabase
        .from('designer_applications')
        .select('*')
        .limit(1);
      
      if (testError) {
        console.error('❌ Error accessing table:', testError);
        return;
      }
      
      console.log('✅ Table exists and is accessible');
    } else {
      console.log('📊 Current table structure:');
      columns.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
      });
    }

    // Check if notes column exists by trying to insert with it
    console.log('\n🧪 Testing notes column...');
    try {
      const { data: testInsert, error: testError } = await supabase
        .from('designer_applications')
        .insert({
          brand_name: 'Test Brand Notes',
          designer_name: 'Test Designer Notes',
          email: 'test-notes@example.com',
          location: 'Test Location',
          category: 'Test Category',
          description: 'Test application with notes',
          notes: 'This is a test note to verify the notes column exists'
        })
        .select()
        .single();
      
      if (testError) {
        if (testError.message.includes('notes')) {
          console.log('⚠️ Notes column missing, adding it...');
          
          // Add notes column
          const { error: alterError } = await supabase
            .rpc('exec_sql', { 
              sql: 'ALTER TABLE public.designer_applications ADD COLUMN IF NOT EXISTS notes TEXT;'
            });
          
          if (alterError) {
            console.log('⚠️ Could not add notes column via RPC');
          } else {
            console.log('✅ Notes column added successfully');
          }
        } else {
          console.log('⚠️ Test insert failed:', testError.message);
        }
      } else {
        console.log('✅ Notes column exists and works');
        
        // Clean up test data
        await supabase
          .from('designer_applications')
          .delete()
          .eq('id', testInsert.id);
        console.log('🧹 Test data cleaned up');
      }
    } catch (e) {
      console.log('⚠️ Error testing notes column:', e.message);
    }

    // Check and fix RLS policies
    console.log('\n🔒 Checking RLS policies...');
    try {
      // Enable RLS if not already enabled
      const { error: rlsError } = await supabase
        .rpc('exec_sql', { 
          sql: 'ALTER TABLE public.designer_applications ENABLE ROW LEVEL SECURITY;'
        });
      
      if (rlsError) {
        console.log('⚠️ Could not enable RLS via RPC');
      } else {
        console.log('✅ RLS enabled');
      }

      // Create policy for super admins only
      const { error: policyError } = await supabase
        .rpc('exec_sql', { 
          sql: `
            DROP POLICY IF EXISTS "Super admins can manage all designer applications" ON public.designer_applications;
            CREATE POLICY "Super admins can manage all designer applications" ON public.designer_applications
              FOR ALL USING (
                EXISTS (
                  SELECT 1 FROM public.profiles 
                  WHERE profiles.id = auth.uid() 
                  AND profiles.role = 'super_admin'
                )
              );
          `
        });
      
      if (policyError) {
        console.log('⚠️ Could not create policy via RPC');
      } else {
        console.log('✅ RLS policy created - only super admins can access');
      }

    } catch (e) {
      console.log('⚠️ Error setting up RLS:', e.message);
    }

    console.log('\n🎉 Table verification completed!');
    
  } catch (error) {
    console.error('💥 Verification failed:', error);
  }
}

// Run the verification
verifyTable();
