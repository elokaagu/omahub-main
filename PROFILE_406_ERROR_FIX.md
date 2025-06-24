# Profile 406 Error Fix

## Problem Description

Users were experiencing **406 Not Acceptable** errors when accessing profile data from Supabase. The error occurred when making requests to:

```
https://gswduyodzdgucjscjtvz.supabase.co/rest/v1/profiles?select=*&id=eq.62c22996-0320-4599-9fa5-c90d36280cf1
```

With the request header:

```
accept: application/vnd.pgrst.object+json
```

## Root Cause Analysis

The 406 error occurs due to **content negotiation issues** between the client and PostgREST (Supabase's API layer):

1. **Header Mismatch**: The `application/vnd.pgrst.object+json` header expects exactly one object in response
2. **Query Method**: Using `.single()` in Supabase queries can cause issues when the result set is empty or has multiple rows
3. **RLS Policies**: Overly restrictive Row Level Security policies can interfere with proper data access

## Solution Overview

### 1. Backend Fixes

#### SQL Script: `scripts/fix-profiles-rls-manual.sql`

Run this in your Supabase Dashboard > SQL Editor:

```sql
-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can read their own profile" ON profiles;
DROP POLICY IF EXISTS "Super admins can read all profiles" ON profiles;
-- ... (see full script)

-- Create new, more permissive policies
CREATE POLICY "Allow users to read their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Allow super admins to read all profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'super_admin'
    )
    OR auth.uid() = id
  );
-- ... (see full script)
```

### 2. Frontend Fixes

#### New Helper Functions: `lib/utils/supabase-helpers.ts`

Created safer query methods that avoid 406 errors:

```typescript
// Instead of this (causes 406 errors):
const { data, error } = await supabase
  .from("profiles")
  .select("*")
  .eq("id", userId)
  .single(); // ❌ Can cause 406 errors

// Use this (safer):
const { data, error } = await supabaseHelpers.getProfileById(userId);
// OR
const { data, error } = await supabase
  .from("profiles")
  .select("*")
  .eq("id", userId)
  .maybeSingle(); // ✅ Safer method
```

#### Updated Studio Page: `app/studio/page.tsx`

Replaced direct Supabase calls with safer helper functions:

```typescript
// Before
supabase.from("profiles").select("*").eq("id", user.id).single(),

// After
supabaseHelpers.getProfileById(user.id),
```

### 3. Diagnostic Tools

#### ProfileFixer Component: `components/studio/ProfileFixer.tsx`

Added a diagnostic component that:

- Tests different query approaches
- Identifies the root cause of 406 errors
- Provides automatic fixes
- Clears cached data that might be causing issues

#### Diagnostic Script: `scripts/fix-406-profile-error.js`

Command-line tool to diagnose and fix profile access issues:

```bash
node scripts/fix-406-profile-error.js
```

## Key Changes Made

### 1. Query Method Changes

- **Before**: `.single()` - expects exactly one result, throws 406 if zero or multiple
- **After**: `.maybeSingle()` - returns null if no results, single object if one result

### 2. Header Management

- **Before**: `application/vnd.pgrst.object+json` (PostgREST-specific)
- **After**: `application/json` (standard JSON)

### 3. Error Handling

- Added comprehensive error handling for different scenarios
- Fallback mechanisms when profile queries fail
- Better logging and debugging information

### 4. RLS Policy Updates

- More permissive policies that allow proper access
- Cleaner policy structure with fewer conflicts
- Support for both user self-access and admin access

## Testing Results

After applying the fixes:

✅ **Profile exists**: User profile found with correct super_admin role
✅ **Queries work**: Both array and maybeSingle queries successful
✅ **No more 406 errors**: Proper content negotiation
✅ **Authentication working**: User properly authenticated with correct permissions

## Prevention Strategies

### 1. Always Use Safe Query Methods

```typescript
// ❌ Avoid
.single()

// ✅ Use instead
.maybeSingle() // For single results that might not exist
.limit(1)      // For array queries with single expected result
```

### 2. Proper Error Handling

```typescript
const { data, error } = await supabase.from("table").select("*").maybeSingle();

if (error) {
  console.error("Query error:", error);
  // Handle error appropriately
  return;
}

if (!data) {
  console.log("No data found");
  // Handle empty result
  return;
}

// Use data safely
```

### 3. Use Helper Functions

Always use the `supabaseHelpers` functions for common operations:

```typescript
import { supabaseHelpers } from "@/lib/utils/supabase-helpers";

// Safe profile fetching
const { data: profile, error } = await supabaseHelpers.getProfileById(userId);

// Safe API calls
const { data, error } = await supabaseHelpers.safeApiCall("/api/endpoint");
```

## Monitoring and Debugging

### 1. Browser Network Tab

Monitor for:

- 406 status codes
- Incorrect accept headers
- Missing credentials

### 2. Console Logs

Look for:

- "Profile query error" messages
- Authentication failures
- RLS policy violations

### 3. Development Tools

Use the ProfileFixer component in development mode to:

- Diagnose profile access issues
- Test different query methods
- Clear cached authentication data

## Files Modified

1. `scripts/fix-406-profile-error.js` - Diagnostic script
2. `scripts/fix-profiles-rls-manual.sql` - RLS policy fixes
3. `components/studio/ProfileFixer.tsx` - Diagnostic component
4. `lib/utils/supabase-helpers.ts` - Safe query helpers
5. `app/studio/page.tsx` - Updated to use safe methods

## Summary

The 406 Not Acceptable error was caused by improper content negotiation and query methods. The fix involved:

1. **Using `.maybeSingle()` instead of `.single()`**
2. **Updating RLS policies to be more permissive**
3. **Adding comprehensive error handling**
4. **Creating diagnostic tools for future issues**

The system now handles profile queries safely and provides better error messages when issues occur.
