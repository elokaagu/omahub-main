#!/usr/bin/env node

/**
 * Script to fix missing profiles that are causing 406 errors
 * This script will:
 * 1. Check for users without profiles
 * 2. Create missing profiles with appropriate roles
 * 3. Fix the 406 error in the collections page
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.error('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAndFixProfiles() {
  try {
    console.log('🔍 Checking for missing profiles...');

    // Get all auth users
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) {
      console.error('❌ Error fetching auth users:', authError);
      return;
    }

    console.log(`📊 Found ${authUsers.users.length} auth users`);

    // Get all existing profiles
    const { data: existingProfiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, role');

    if (profilesError) {
      console.error('❌ Error fetching existing profiles:', profilesError);
      return;
    }

    console.log(`📊 Found ${existingProfiles.length} existing profiles`);

    // Find users without profiles
    const existingProfileIds = new Set(existingProfiles.map(p => p.id));
    const usersWithoutProfiles = authUsers.users.filter(user => !existingProfileIds.has(user.id));

    console.log(`⚠️ Found ${usersWithoutProfiles.length} users without profiles`);

    if (usersWithoutProfiles.length === 0) {
      console.log('✅ All users have profiles!');
      return;
    }

    // Create missing profiles
    for (const user of usersWithoutProfiles) {
      console.log(`🔄 Creating profile for user: ${user.email} (${user.id})`);

      // Determine role based on email
      let role = 'user';
      if (user.email === 'eloka.agu@icloud.com' || 
          user.email === 'shannonalisa@oma-hub.com' || 
          user.email === 'nnamdiohaka@gmail.com') {
        role = 'super_admin';
      } else if (user.email === 'eloka@culturin.com') {
        role = 'brand_admin';
      }

      const { error: createError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email,
          role: role,
          owned_brands: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (createError) {
        console.error(`❌ Failed to create profile for ${user.email}:`, createError);
      } else {
        console.log(`✅ Created profile for ${user.email} with role: ${role}`);
      }
    }

    console.log('🎯 Profile creation complete!');

    // Verify the fix
    const { data: finalProfiles, error: finalError } = await supabase
      .from('profiles')
      .select('id, email, role');

    if (finalError) {
      console.error('❌ Error verifying profiles:', finalError);
      return;
    }

    console.log(`✅ Final profile count: ${finalProfiles.length}`);
    console.log('🎉 All users should now have profiles!');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the script
checkAndFixProfiles()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
