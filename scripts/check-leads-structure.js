#!/usr/bin/env node

/**
 * Check Leads Table Structure
 * This script checks the structure of the leads table to see what columns it expects
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkLeadsStructure() {
  console.log('🔍 Checking leads table structure...\n');

  try {
    // Try to get table info by attempting a select
    console.log('📋 Attempting to select from leads table...');
    
    const { data: leads, error: selectError } = await supabase
      .from('leads')
      .select('*')
      .limit(1);

    if (selectError) {
      console.error('❌ Error selecting from leads table:', selectError);
      
      // Try to get table schema information
      console.log('\n🔍 Trying to get table schema...');
      try {
        const { data: schema, error: schemaError } = await supabase
          .rpc('get_table_schema', { table_name: 'leads' });
        
        if (schemaError) {
          console.log('⚠️ Could not get schema info:', schemaError.message);
        } else {
          console.log('📋 Table schema:', schema);
        }
      } catch (e) {
        console.log('⚠️ Schema check failed:', e.message);
      }
      
      return;
    }

    console.log('✅ Leads table is accessible');
    console.log('📊 Sample data structure:', leads.length > 0 ? leads[0] : 'No data yet');

    // Try to insert a test record to see what columns are expected
    console.log('\n🧪 Testing lead insertion...');
    
    const testLeadData = {
      brand_id: 'test-brand-id',
      customer_name: 'Test Lead',
      customer_email: 'test@example.com',
      customer_phone: '',
      source: 'test',
      lead_type: 'test',
      status: 'new',
      priority: 'normal',
      notes: 'Test lead for structure check',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('📝 Test data:', testLeadData);

    const { data: testLead, error: insertError } = await supabase
      .from('leads')
      .insert(testLeadData)
      .select()
      .single();

    if (insertError) {
      console.error('❌ Lead insertion failed:', insertError);
      console.log('💡 This shows what columns the table expects');
    } else {
      console.log('✅ Test lead created successfully:', testLead.id);
      
      // Clean up the test record
      await supabase
        .from('leads')
        .delete()
        .eq('id', testLead.id);
      console.log('🧹 Test lead cleaned up');
    }

  } catch (error) {
    console.error('💥 Error checking leads structure:', error);
  }
}

// Run the check
checkLeadsStructure().then(() => {
  console.log('\n✅ Leads structure check complete!');
  process.exit(0);
}).catch(error => {
  console.error('💥 Script failed:', error);
  process.exit(1);
});
