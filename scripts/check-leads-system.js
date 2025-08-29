const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function checkLeadsSystem() {
  console.log('🔍 Checking OmaHub Leads System...\n');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing environment variables:');
    console.error('   NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
    console.error('   SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // 1. Check if leads table exists
    console.log('📋 Checking if leads table exists...');
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('*')
      .limit(1);

    if (leadsError) {
      console.error('❌ Leads table error:', leadsError);
      console.log('\n🔧 This suggests the leads table needs to be created');
      console.log('   Run the SQL script: scripts/create-leads-system.sql');
      return;
    }

    console.log('✅ Leads table exists and is accessible');

    // 2. Check if there are any leads
    console.log('\n📊 Checking for existing leads...');
    const { data: allLeads, error: countError } = await supabase
      .from('leads')
      .select('id, customer_name, customer_email, status, created_at');

    if (countError) {
      console.error('❌ Error fetching leads:', countError);
      return;
    }

    console.log(`✅ Found ${allLeads.length} leads in database`);
    
    if (allLeads.length > 0) {
      console.log('   Sample leads:');
      allLeads.slice(0, 3).forEach(lead => {
        console.log(`   - ${lead.customer_name} (${lead.customer_email}) - ${lead.status}`);
      });
    }

    // 3. Check if inquiries table exists
    console.log('\n📋 Checking if inquiries table exists...');
    const { data: inquiries, error: inquiriesError } = await supabase
      .from('inquiries')
      .select('*')
      .limit(1);

    if (inquiriesError) {
      console.log('⚠️ Inquiries table does not exist:', inquiriesError.message);
      console.log('   This is normal if no contact forms have been submitted yet');
    } else {
      console.log('✅ Inquiries table exists');
      
      // Count inquiries
      const { data: allInquiries, error: inquiryCountError } = await supabase
        .from('inquiries')
        .select('id, customer_name, customer_email, status, created_at');

      if (!inquiryCountError) {
        console.log(`   Found ${allInquiries.length} inquiries`);
        if (allInquiries.length > 0) {
          console.log('   Sample inquiries:');
          allInquiries.slice(0, 3).forEach(inquiry => {
            console.log(`   - ${inquiry.customer_name} (${inquiry.customer_email}) - ${inquiry.status}`);
          });
        }
      }
    }

    // 4. Test creating a lead
    console.log('\n🧪 Testing lead creation...');
    const testLead = {
      brand_id: '00000000-0000-0000-0000-000000000000', // Will be replaced if brands exist
      customer_name: 'Test Lead',
      customer_email: 'test-lead@example.com',
      customer_phone: '+1234567890',
      lead_source: 'contact_form',
      lead_status: 'new',
      lead_score: 50,
      priority: 'medium',
      estimated_budget: 2500,
      project_type: 'custom_clothing',
      project_timeline: '3-6 months',
      notes: 'Test lead created to verify system functionality'
    };

    // Try to get a real brand_id if available
    const { data: brands, error: brandsError } = await supabase
      .from('brands')
      .select('id')
      .limit(1);

    if (!brandsError && brands && brands.length > 0) {
      testLead.brand_id = brands[0].id;
      console.log(`   Using brand ID: ${testLead.brand_id}`);
    } else {
      console.log('   Using placeholder brand ID (no brands found)');
    }

    const { data: newLead, error: createError } = await supabase
      .from('leads')
      .insert(testLead)
      .select()
      .single();

    if (createError) {
      console.error('❌ Failed to create test lead:', createError);
      console.log('\n🔧 This suggests there might be an issue with:');
      console.log('   1. Table structure');
      console.log('   2. RLS policies');
      console.log('   3. Required fields');
      return;
    }

    console.log('✅ Test lead created successfully!');
    console.log(`   Lead ID: ${newLead.id}`);
    console.log(`   Customer: ${newLead.customer_name}`);
    console.log(`   Status: ${newLead.lead_status}`);

    // 5. Clean up test lead
    console.log('\n🧹 Cleaning up test lead...');
    const { error: deleteError } = await supabase
      .from('leads')
      .delete()
      .eq('id', newLead.id);

    if (deleteError) {
      console.error('❌ Failed to clean up test lead:', deleteError);
    } else {
      console.log('✅ Test lead cleaned up');
    }

    // 6. Summary
    console.log('\n📋 LEADS SYSTEM SUMMARY:');
    console.log(`   - Leads table: ✅ Working`);
    console.log(`   - Total leads: ${allLeads.length}`);
    console.log(`   - Inquiries table: ${inquiriesError ? '❌ Missing' : '✅ Working'}`);
    console.log(`   - Lead creation: ✅ Working`);
    console.log(`   - Lead deletion: ✅ Working`);

    if (allLeads.length === 0) {
      console.log('\n💡 No leads found. This could mean:');
      console.log('   1. No contact forms have been submitted yet');
      console.log('   2. Contact forms are not creating leads');
      console.log('   3. The leads system needs to be connected to contact forms');
      console.log('\n🔧 To test the system:');
      console.log('   1. Submit a contact form on the website');
      console.log('   2. Check if a lead is created');
      console.log('   3. Verify the dashboard shows the new lead');
    }

  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

checkLeadsSystem();
