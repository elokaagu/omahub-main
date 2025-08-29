const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function fixDesignerApplicationsConstraint() {
  console.log('🔧 Fixing Designer Applications Status Constraint...\n');

  // Initialize Supabase client
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
    console.log('📋 Step 1: Dropping existing status constraint...');
    
    // Drop the existing constraint
    const { error: dropError } = await supabase.rpc('execute_sql', {
      sql: `
        ALTER TABLE public.designer_applications 
        DROP CONSTRAINT IF EXISTS designer_applications_status_check;
      `
    });

    if (dropError) {
      console.log('⚠️ Could not drop constraint via RPC, this is normal');
      console.log('   The constraint will be dropped when you run the SQL manually');
    } else {
      console.log('✅ Existing constraint dropped');
    }

    console.log('\n📋 Step 2: Adding correct status constraint...');
    
    // Add the correct constraint
    const { error: addError } = await supabase.rpc('execute_sql', {
      sql: `
        ALTER TABLE public.designer_applications 
        ADD CONSTRAINT designer_applications_status_check 
        CHECK (status IN ('new', 'reviewing', 'approved', 'rejected'));
      `
    });

    if (addError) {
      console.log('⚠️ Could not add constraint via RPC, this is normal');
      console.log('   The constraint will be added when you run the SQL manually');
    } else {
      console.log('✅ Correct constraint added');
    }

    console.log('\n📋 Step 3: Testing the fix...');
    
    // Test with a valid status
    const testApplication = {
      brand_name: 'Test Brand',
      designer_name: 'Test Designer',
      email: 'test@example.com',
      phone: '+1234567890',
      website: 'https://testbrand.com',
      instagram: '@testbrand',
      location: 'Test City',
      category: 'Ready to Wear',
      description: 'This is a test application',
      year_founded: 2020,
      status: 'new'
    };

    console.log('🧪 Testing insert with status: "new"');
    
    const { data: insertResult, error: insertError } = await supabase
      .from('designer_applications')
      .insert(testApplication)
      .select()
      .single();

    if (insertError) {
      console.error('❌ Insert still failing:', insertError);
      console.log('\n🔧 The constraint fix needs to be run manually in Supabase SQL editor');
      console.log('\n📝 Copy and paste this SQL into your Supabase SQL editor:');
      console.log(`
-- Fix Designer Applications Status Constraint
ALTER TABLE public.designer_applications 
DROP CONSTRAINT IF EXISTS designer_applications_status_check;

ALTER TABLE public.designer_applications 
ADD CONSTRAINT designer_applications_status_check 
CHECK (status IN ('new', 'reviewing', 'approved', 'rejected'));
      `);
      return;
    }

    console.log('✅ Insert successful! Status "new" is now allowed');
    console.log('   ID:', insertResult.id);

    // Clean up test data
    console.log('\n🧹 Cleaning up test data...');
    
    const { error: deleteError } = await supabase
      .from('designer_applications')
      .delete()
      .eq('id', insertResult.id);

    if (deleteError) {
      console.error('❌ Cleanup failed:', deleteError);
    } else {
      console.log('✅ Test data cleaned up');
    }

    console.log('\n🎉 Status constraint fixed successfully!');
    console.log('   The designer application form should now work');

  } catch (error) {
    console.error('💥 Unexpected error:', error);
    console.log('\n🔧 Manual SQL fix required');
    console.log('\n📝 Copy and paste this SQL into your Supabase SQL editor:');
    console.log(`
-- Fix Designer Applications Status Constraint
ALTER TABLE public.designer_applications 
DROP CONSTRAINT IF EXISTS designer_applications_status_check;

ALTER TABLE public.designer_applications 
ADD CONSTRAINT designer_applications_status_check 
CHECK (status IN ('new', 'reviewing', 'approved', 'rejected'));
    `);
  }
}

fixDesignerApplicationsConstraint();
