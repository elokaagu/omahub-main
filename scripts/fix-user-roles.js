const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixUserRoles() {
  console.log('🔍 Checking and fixing user roles...');

  try {
    // Get all profiles
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, email, role, owned_brands, created_at, updated_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching profiles:', error);
      return;
    }

    console.log(`📊 Found ${profiles.length} profiles`);

    // Define users that should be brand_admins
    const brandAdminEmails = [
      'team@houseofagu.com',
      'eloka@culturin.com',
      'eloka.agu96@gmail.com',
      // Add more emails as needed
    ];

    // Define users that should be super_admins
    const superAdminEmails = [
      'eloka.agu@icloud.com',
      'shannonalisa@oma-hub.com',
      'nnamdiohaka@gmail.com',
    ];

    let updatedCount = 0;

    for (const profile of profiles) {
      const { id, email, role } = profile;
      let newRole = null;

      if (superAdminEmails.includes(email) && role !== 'super_admin') {
        newRole = 'super_admin';
      } else if (brandAdminEmails.includes(email) && role !== 'brand_admin') {
        newRole = 'brand_admin';
      }

      if (newRole) {
        console.log(`🔄 Updating ${email} from ${role} to ${newRole}`);
        
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ 
            role: newRole,
            updated_at: new Date().toISOString()
          })
          .eq('id', id);

        if (updateError) {
          console.error(`❌ Error updating ${email}:`, updateError);
        } else {
          console.log(`✅ Successfully updated ${email} to ${newRole}`);
          updatedCount++;
        }
      }
    }

    console.log(`\n🎉 Updated ${updatedCount} user roles`);

    // Show final status
    console.log('\n📋 Final role status:');
    const { data: finalProfiles } = await supabase
      .from('profiles')
      .select('email, role, owned_brands')
      .order('email');

    finalProfiles?.forEach(profile => {
      console.log(`  ${profile.email}: ${profile.role} ${profile.owned_brands ? `(brands: ${profile.owned_brands.length})` : ''}`);
    });

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

fixUserRoles();
