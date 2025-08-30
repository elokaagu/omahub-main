#!/usr/bin/env node

/**
 * Check Custom Orders Script
 * This script checks if the tailored_orders table exists and what custom orders are in the database
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

async function checkCustomOrders() {
  console.log('🔍 Checking OmaHub Custom Orders...\n');

  try {
    // Check if tailored_orders table exists
    console.log('📋 Checking tailored_orders table...');
    
    try {
      const { data: orders, error: ordersError } = await supabase
        .from('tailored_orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (ordersError) {
        console.error('❌ Error fetching tailored orders:', ordersError);
        console.log('   • Tailored orders table might not exist or have different structure');
      } else {
        console.log(`✅ Found ${orders.length} custom orders:`);
        if (orders.length === 0) {
          console.log('   • No custom orders found in the system');
        } else {
          console.log('   • Sample order structure:', Object.keys(orders[0]));
          orders.forEach(order => {
            console.log(`   • Order ${order.id?.slice(0, 8) || 'Unknown'}...`);
            console.log(`     Brand ID: ${order.brand_id}, Status: ${order.status}`);
            console.log(`     Amount: ${order.total_amount}, Created: ${order.created_at}`);
          });
        }
      }
    } catch (ordersTableError) {
      console.log('   • Tailored orders table does not exist or is not accessible');
    }

    // Check if there are any other order-related tables
    console.log('\n🔍 Checking for other order-related tables...');
    
    const possibleOrderTables = [
      'orders',
      'custom_orders', 
      'product_orders',
      'brand_orders',
      'customer_orders'
    ];

    for (const tableName of possibleOrderTables) {
      try {
        const { data: tableData, error: tableError } = await supabase
          .from(tableName)
          .select('id')
          .limit(1);

        if (!tableError) {
          console.log(`   • ${tableName} table exists`);
          
          // Get count
          const { count } = await supabase
            .from(tableName)
            .select('*', { count: 'exact', head: true });
          
          console.log(`     - Contains ${count || 0} records`);
        }
      } catch (e) {
        // Table doesn't exist
      }
    }

    // Check if custom orders are creating leads
    console.log('\n📊 Checking if custom orders created leads...');
    
    try {
      const { data: leads, error: leadsError } = await supabase
        .from('leads')
        .select('*')
        .or('lead_source.eq.brand_request_form,lead_source.eq.custom_order')
        .order('created_at', { ascending: false });

      if (leadsError) {
        console.log('   • Could not check leads for custom orders');
      } else {
        const customOrderLeads = leads.filter(lead => 
          lead.lead_source === 'brand_request_form' || 
          lead.lead_source === 'custom_order'
        );
        
        console.log(`   • Found ${customOrderLeads.length} leads from custom orders:`);
        if (customOrderLeads.length > 0) {
          customOrderLeads.forEach(lead => {
            console.log(`     • ${lead.customer_name} - ${lead.lead_source} - ${lead.status}`);
          });
        } else {
          console.log('     • No leads found from custom orders');
        }
      }
    } catch (e) {
      console.log('   • Could not check custom order leads');
    }

    // Summary
    console.log('\n📈 CUSTOM ORDERS SUMMARY:');
    console.log('   • Custom orders are stored in: tailored_orders table');
    console.log('   • Studio inbox shows: inquiries table (contact forms)');
    console.log('   • Custom orders should also create: leads');
    console.log('\n💡 To see custom orders in Studio:');
    console.log('   1. Check if tailored_orders table exists');
    console.log('   2. Custom orders should create leads (check leads dashboard)');
    console.log('   3. Consider adding custom orders to Studio inbox or creating separate orders view');

  } catch (error) {
    console.error('💥 Error checking custom orders:', error);
  }
}

// Run the check
checkCustomOrders().then(() => {
  console.log('\n✅ Custom orders check complete!');
  process.exit(0);
}).catch(error => {
  console.error('💥 Script failed:', error);
  process.exit(1);
});
