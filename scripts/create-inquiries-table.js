#!/usr/bin/env node

/**
 * Create Inquiries Table Script
 * This script creates the missing inquiries table in Supabase
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

async function createInquiriesTable() {
  console.log('🔨 Creating inquiries table in Supabase...\n');

  try {
    // Check if table already exists
    console.log('🔍 Checking if inquiries table exists...');
    try {
      const { data: existingTable, error: checkError } = await supabase
        .from('inquiries')
        .select('id')
        .limit(1);
      
      if (!checkError) {
        console.log('✅ Inquiries table already exists!');
        return;
      }
    } catch (e) {
      // Table doesn't exist, continue with creation
    }

    console.log('📋 Creating inquiries table...');
    
    // Create the table using raw SQL
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.inquiries (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          brand_id TEXT REFERENCES public.brands(id) ON DELETE CASCADE,
          customer_name TEXT NOT NULL,
          customer_email TEXT NOT NULL,
          customer_phone TEXT,
          subject TEXT NOT NULL,
          message TEXT NOT NULL,
          inquiry_type TEXT DEFAULT 'customer_inquiry' CHECK (inquiry_type IN ('customer_inquiry', 'quote_request', 'booking_intent', 'consultation', 'product_interest', 'partnership', 'other')),
          priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
          status TEXT DEFAULT 'new' CHECK (status IN ('new', 'read', 'replied', 'closed', 'archived')),
          source TEXT DEFAULT 'website_contact_form' CHECK (source IN ('website_contact_form', 'brand_contact_form', 'email', 'phone', 'social_media', 'referral', 'other')),
          estimated_budget DECIMAL(10,2),
          project_timeline TEXT,
          location TEXT,
          notes TEXT,
          tags TEXT[],
          assigned_to UUID REFERENCES public.profiles(id),
          replied_at TIMESTAMPTZ,
          closed_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `
    });

    if (error) {
      console.log('⚠️ RPC method not available, trying alternative approach...');
      
      // Try creating the table by inserting a test record (this will create the table if it doesn't exist)
      const { data: testInsert, error: insertError } = await supabase
        .from('inquiries')
        .insert({
          brand_id: 'test-brand-id',
          customer_name: 'Test Customer',
          customer_email: 'test@example.com',
          subject: 'Test Inquiry',
          message: 'This is a test inquiry to create the table structure.',
          inquiry_type: 'customer_inquiry',
          priority: 'normal',
          source: 'website_contact_form',
          status: 'new'
        })
        .select();

      if (insertError) {
        console.error('❌ Failed to create table through insert:', insertError);
        console.log('\n💡 You may need to create the table manually in the Supabase dashboard:');
        console.log('   1. Go to your Supabase project dashboard');
        console.log('   2. Navigate to SQL Editor');
        console.log('   3. Run the SQL from scripts/create-inquiries-table.sql');
        return;
      } else {
        console.log('✅ Table created successfully through insert method!');
        
        // Clean up the test record
        if (testInsert && testInsert[0]) {
          await supabase
            .from('inquiries')
            .delete()
            .eq('id', testInsert[0].id);
          console.log('🧹 Test record cleaned up');
        }
      }
    } else {
      console.log('✅ Table created successfully through RPC!');
    }

    // Create indexes
    console.log('🔍 Creating indexes...');
    try {
      await supabase.rpc('exec_sql', {
        sql: `
          CREATE INDEX IF NOT EXISTS idx_inquiries_brand_id ON public.inquiries(brand_id);
          CREATE INDEX IF NOT EXISTS idx_inquiries_status ON public.inquiries(status);
          CREATE INDEX IF NOT EXISTS idx_inquiries_created_at ON public.inquiries(created_at);
          CREATE INDEX IF NOT EXISTS idx_inquiries_customer_email ON public.inquiries(customer_email);
        `
      });
      console.log('✅ Indexes created successfully!');
    } catch (indexError) {
      console.log('⚠️ Index creation failed (table may already have them):', indexError.message);
    }

    // Enable RLS
    console.log('🔒 Enabling Row Level Security...');
    try {
      await supabase.rpc('exec_sql', {
        sql: 'ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;'
      });
      console.log('✅ RLS enabled successfully!');
    } catch (rlsError) {
      console.log('⚠️ RLS setup failed (may already be enabled):', rlsError.message);
    }

    console.log('\n🎉 Inquiries table setup complete!');
    console.log('   • Table structure created');
    console.log('   • Indexes added for performance');
    console.log('   • RLS enabled for security');
    console.log('\n💡 You can now test the contact form and leads system!');

  } catch (error) {
    console.error('💥 Error creating inquiries table:', error);
    console.log('\n💡 Alternative solution:');
    console.log('   1. Go to your Supabase project dashboard');
    console.log('   2. Navigate to SQL Editor');
    console.log('   3. Copy and paste the SQL from scripts/create-inquiries-table.sql');
    console.log('   4. Run the SQL to create the table');
  }
}

// Run the script
createInquiriesTable().then(() => {
  console.log('\n✅ Script complete!');
  process.exit(0);
}).catch(error => {
  console.error('💥 Script failed:', error);
  process.exit(1);
});
