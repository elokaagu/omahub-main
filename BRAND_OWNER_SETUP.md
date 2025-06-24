# Brand Owner Setup for eloka@culturin.com

## Current Status ✅

- **User found**: `eloka@culturin.com` (ID: `36466550-d7b8-4ea2-a81b-2e14dc737ac0`)
- **Role updated**: Successfully changed from `user` to `brand_admin`
- **Brand found**: "Ehbs Couture" (ID: `ehbs-couture`)

## Issue Identified 🔍

The `owned_brands` column in the `profiles` table is defined as `uuid[]` but brand IDs are strings (like `'ehbs-couture'`). This causes a type mismatch error when trying to add brands to the owned_brands array.

## Manual Fix Required 🛠️

### Step 1: Fix the Column Type

You need to run this SQL command in the Supabase SQL Editor:

```sql
-- Fix owned_brands column to accept text arrays instead of UUID arrays
ALTER TABLE profiles
ALTER COLUMN owned_brands TYPE text[] USING owned_brands::text[];

-- Update the RLS policy to work with text comparison
DROP POLICY IF EXISTS "Enable update for admins and brand owners" ON brands;

CREATE POLICY "Enable update for admins and brand owners" ON brands
FOR UPDATE TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND (
            profiles.role::text IN ('admin', 'super_admin')
            OR (profiles.role::text = 'brand_admin' AND brands.id = ANY(profiles.owned_brands))
        )
    )
);
```

### Step 2: Complete the Brand Assignment

After running the SQL above, run this script:

```bash
node scripts/complete-brand-owner.js
```

## Alternative: Manual Database Update

If you prefer to do it all manually in the Supabase SQL Editor:

```sql
-- Fix column type
ALTER TABLE profiles
ALTER COLUMN owned_brands TYPE text[] USING owned_brands::text[];

-- Add brand to user's owned_brands
UPDATE profiles
SET owned_brands = array_append(COALESCE(owned_brands, '{}'), 'ehbs-couture')
WHERE email = 'eloka@culturin.com';

-- Verify the update
SELECT id, email, role, owned_brands
FROM profiles
WHERE email = 'eloka@culturin.com';
```

## Expected Final Result 🎯

After completing the setup:

- **User**: `eloka@culturin.com`
- **Role**: `brand_admin`
- **Owned Brands**: `["ehbs-couture"]`
- **Permissions**: Can manage Ehbs Couture brand in the studio

## Verification 🔍

The user should now be able to:

1. Access the studio at `/studio`
2. See and manage the "Ehbs Couture" brand
3. Create/edit products for Ehbs Couture
4. Update brand information for Ehbs Couture

## Notes 📝

- The role has already been successfully updated to `brand_admin`
- The user is already configured in the `BRAND_ADMIN_EMAILS` array in the permissions service
- Only the `owned_brands` array assignment is pending the column type fix
