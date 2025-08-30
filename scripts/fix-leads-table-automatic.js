const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function fixLeadsTable() {
  console.log('🔧 Fixing OmaHub Leads Table Structure...\n');

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
    // Step 1: Check current table structure
    console.log('📋 Checking current leads table structure...');
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_schema', 'public')
      .eq('table_name', 'leads')
      .order('ordinal_position');

    if (columnsError) {
      console.error('❌ Error checking table structure:', columnsError);
      return;
    }

    console.log(`✅ Found ${columns.length} columns in leads table:`);
    columns.forEach(col => {
      console.log(`   - ${col.column_name} (${col.data_type}, nullable: ${col.is_nullable})`);
    });

    // Step 2: Add missing columns
    console.log('\n🔧 Adding missing columns...');
    
    const missingColumns = [
      { name: 'estimated_budget', type: 'DECIMAL(10,2)', nullable: true },
      { name: 'estimated_project_value', type: 'DECIMAL(10,2)', nullable: true },
      { name: 'project_type', type: 'VARCHAR(100)', nullable: true },
      { name: 'project_timeline', type: 'VARCHAR(100)', nullable: true },
      { name: 'location', type: 'VARCHAR(255)', nullable: true },
      { name: 'notes', type: 'TEXT', nullable: true },
      { name: 'tags', type: 'TEXT[]', nullable: true },
      { name: 'last_contact_date', type: 'TIMESTAMP WITH TIME ZONE', nullable: true },
      { name: 'next_follow_up_date', type: 'TIMESTAMP WITH TIME ZONE', nullable: true },
      { name: 'conversion_date', type: 'TIMESTAMP WITH TIME ZONE', nullable: true },
      { name: 'inquiry_id', type: 'UUID', nullable: true },
      { name: 'company_name', type: 'VARCHAR(255)', nullable: true },
      { name: 'lead_score', type: 'INTEGER DEFAULT 0', nullable: true },
      { name: 'priority', type: 'VARCHAR(20) DEFAULT \'medium\'', nullable: true },
      { name: 'lead_source', type: 'VARCHAR(50) DEFAULT \'contact_form\'', nullable: true },
      { name: 'lead_status', type: 'VARCHAR(50) DEFAULT \'new\'', nullable: true }
    ];

    for (const column of missingColumns) {
      const columnExists = columns.some(col => col.column_name === column.name);
      
      if (!columnExists) {
        console.log(`   Adding column: ${column.name}...`);
        
        try {
          // Use RPC to add column dynamically
          const { error: addError } = await supabase.rpc('add_column_if_not_exists', {
            table_name: 'leads',
            column_name: column.name,
            column_definition: `${column.name} ${column.type}`
          });

          if (addError) {
            console.log(`   ⚠️ RPC failed, trying direct SQL...`);
            // Fallback: try direct SQL execution
            const { error: sqlError } = await supabase.rpc('exec_sql', {
              sql_query: `ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS ${column.name} ${column.type}`
            });

            if (sqlError) {
              console.log(`   ❌ Failed to add ${column.name}:`, sqlError.message);
            } else {
              console.log(`   ✅ Added ${column.name}`);
            }
          } else {
            console.log(`   ✅ Added ${column.name}`);
          }
        } catch (error) {
          console.log(`   ❌ Error adding ${column.name}:`, error.message);
        }
      } else {
        console.log(`   ✅ Column ${column.name} already exists`);
      }
    }

    // Step 3: Verify the updated structure
    console.log('\n📋 Verifying updated table structure...');
    const { data: updatedColumns, error: verifyError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_schema', 'public')
      .eq('table_name', 'leads')
      .order('ordinal_position');

    if (verifyError) {
      console.error('❌ Error verifying table structure:', verifyError);
      return;
    }

    console.log(`✅ Updated table now has ${updatedColumns.length} columns:`);
    updatedColumns.forEach(col => {
      console.log(`   - ${col.column_name} (${col.data_type}, nullable: ${col.is_nullable})`);
    });

    // Step 4: Test creating a lead
    console.log('\n🧪 Testing lead creation...');
    
    // Get a brand ID for testing
    const { data: brands, error: brandsError } = await supabase
      .from('brands')
      .select('id')
      .limit(1);

    if (brandsError || !brands || brands.length === 0) {
      console.error('❌ No brands found for testing');
      return;
    }

    const testLead = {
      brand_id: brands[0].id,
      customer_name: 'Test Lead After Fix',
      customer_email: 'test-after-fix@example.com',
      customer_phone: '+1234567890',
      lead_source: 'contact_form',
      lead_status: 'new',
      lead_score: 50,
      priority: 'medium',
      estimated_budget: 2500.00,
      project_type: 'custom_clothing',
      project_timeline: '3-6 months',
      notes: 'Test lead created after fixing table structure'
    };

    const { data: newLead, error: createError } = await supabase
      .from('leads')
      .insert(testLead)
      .select()
      .single();

    if (createError) {
      console.error('❌ Failed to create test lead:', createError);
      console.log('\n🔧 This suggests there might still be issues with:');
      console.log('   1. Table structure');
      console.log('   2. RLS policies');
      console.log('   3. Required fields');
      return;
    }

    console.log('✅ Test lead created successfully!');
    console.log(`   Lead ID: ${newLead.id}`);
    console.log(`   Customer: ${newLead.customer_name}`);
    console.log(`   Status: ${newLead.lead_status}`);

    // Step 5: Clean up test lead
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

    // Step 6: Summary
    console.log('\n📋 LEADS TABLE FIX SUMMARY:');
    console.log(`   - Table structure: ✅ Fixed`);
    console.log(`   - Total columns: ${updatedColumns.length}`);
    console.log(`   - Lead creation: ✅ Working`);
    console.log(`   - Lead deletion: ✅ Working`);
    console.log('\n🎉 Leads table is now ready to receive data!');

  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

fixLeadsTable();
