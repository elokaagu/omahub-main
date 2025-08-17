#!/usr/bin/env node

/**
 * Script to diagnose the profile query issue causing 406 errors
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function diagnoseProfileIssue() {
  try {
    console.log('🔍 Diagnosing profile query issue...');

    // Get all auth users
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) {
      console.error('❌ Error fetching auth users:', authError);
      return;
    }

    console.log(`📊 Found ${authUsers.users.length} auth users`);

    // Get all profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*');

    if (profilesError) {
      console.error('❌ Error fetching profiles:', profilesError);
      return;
    }

    console.log(`📊 Found ${profiles.length} profiles`);

    // Check for mismatches
    const authUserIds = new Set(authUsers.users.map(u => u.id));
    const profileIds = new Set(profiles.map(p => p.id));

    console.log('\n🔍 Checking for ID mismatches...');
    
    // Users without profiles
    const usersWithoutProfiles = authUsers.users.filter(u => !profileIds.has(u.id));
    if (usersWithoutProfiles.length > 0) {
      console.log('⚠️ Users without profiles:');
      usersWithoutProfiles.forEach(u => {
        console.log(`  - ${u.email} (${u.id})`);
      });
    }

    // Profiles without auth users
    const orphanedProfiles = profiles.filter(p => !authUserIds.has(p.id));
    if (orphanedProfiles.length > 0) {
      console.log('⚠️ Orphaned profiles:');
      orphanedProfiles.forEach(p => {
        console.log(`  - ${p.email} (${p.id})`);
      });
    }

    // Test specific queries
    console.log('\n🧪 Testing specific profile queries...');
    
    for (const user of authUsers.users.slice(0, 3)) { // Test first 3 users
      console.log(`\n🔍 Testing query for user: ${user.email} (${user.id})`);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.log(`  ❌ Query failed: ${error.code} - ${error.message}`);
        if (error.code === 'PGRST116') {
          console.log(`    This means: The result contains 0 rows`);
        }
      } else {
        console.log(`  ✅ Query successful: Found profile with role ${data.role}`);
      }
    }

    // Check RLS policies
    console.log('\n🔒 Checking RLS policies...');
    try {
      const { data: policies, error: policiesError } = await supabase
        .from('pg_policies')
        .select('*')
        .eq('tablename', 'profiles');

      if (policiesError) {
        console.log(`  ❌ Could not fetch RLS policies: ${policiesError.message}`);
        console.log(`  This might indicate RLS is not properly configured`);
      } else {
        console.log(`  ✅ Found ${policies.length} RLS policies for profiles table`);
        policies.forEach(policy => {
          console.log(`    - ${policy.policyname}: ${policy.cmd} on ${policy.tablename}`);
        });
      }
    } catch (e) {
      console.log(`  ❌ Error checking RLS: ${e.message}`);
    }

    console.log('\n🎯 Diagnosis complete!');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the script
diagnoseProfileIssue()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
