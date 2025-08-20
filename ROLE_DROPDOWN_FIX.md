# Role Dropdown Fix for User Management

## Issue Description

Shannon reported that when trying to edit a user's role from "User" to "Brand Admin", the dropdown gets stuck and won't show other options.

## Root Cause

The issue is caused by a **role mismatch** between the database and frontend:

1. **Database**: Some users still have the legacy `brand_owner` role
2. **Frontend**: The dropdown only shows `brand_admin` (not `brand_owner`)
3. **Result**: When editing a user with `brand_owner` role, the Select component malfunctions

## Immediate Solutions

### Option 1: Database Fix (Recommended)

Run the SQL script to convert all `brand_owner` roles to `brand_admin`:

```sql
-- Fix remaining brand_owner roles to brand_admin
UPDATE profiles
SET role = 'brand_admin'
WHERE role = 'brand_owner';

-- Verify the fix
SELECT DISTINCT role FROM profiles ORDER BY role;
```

### Option 2: Frontend Fallback (Already Implemented)

The user management page now includes:

- Role normalization to handle `brand_owner` → `brand_admin` conversion
- Fallback radio buttons if the Select dropdown fails
- Debug information in development mode

## How to Apply the Fix

### Step 1: Run the Database Migration

1. Connect to your Supabase database
2. Execute the SQL script from `fix-brand-owner-roles.sql`
3. Verify that all roles are now valid: `user`, `brand_admin`, `admin`, `super_admin`

### Step 2: Test the User Management Interface

1. Go to Studio → Users
2. Try editing a user who previously had issues
3. The role dropdown should now work properly
4. If it still fails, use the fallback radio buttons

### Step 3: Update User Roles

1. Find the user who needs to be changed to Brand Admin
2. Select "Brand Admin" from the dropdown
3. Assign them to their specific brand(s)
4. Save the changes

## Prevention

To prevent this issue in the future:

- Ensure all new users are created with valid roles
- Run the database migration script if you encounter similar issues
- Monitor for any role inconsistencies in the profiles table

## Technical Details

- **Affected Component**: `app/studio/users/page.tsx`
- **Role Values**: `user`, `brand_admin`, `admin`, `super_admin`
- **Legacy Role**: `brand_owner` (should be converted to `brand_admin`)
- **Database Constraint**: `valid_role` check ensures only valid roles

## Support

If the issue persists after applying these fixes, check:

1. Browser console for JavaScript errors
2. Network tab for API failures
3. Database logs for constraint violations
4. User's current role in the profiles table
