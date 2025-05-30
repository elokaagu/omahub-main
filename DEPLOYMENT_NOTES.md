# OmaHub Deployment Notes

## Current Status

Based on the verification performed, the application is **almost ready** for deployment. Here's a summary of what's working and what still needs to be fixed:

### Working Features

✅ **Database Access**:

- All 19 brands are accessible in the database
- Both admin and public users can see all brands
- 52 collections are properly stored

✅ **Build Process**:

- Application builds successfully without errors
- All routes compile correctly

✅ **Storage**:

- Storage buckets exist (brand-assets, avatars, profiles)
- Files can be listed from the buckets

### Issues to Address Before Deployment

⚠️ **Products Table**:

- The products table is missing and needs to be created using the SQL in `scripts/create-products-table.sql`
- Run this SQL in the Supabase SQL Editor

⚠️ **Storage Permission Issues**:

- There are persistent errors when trying to create storage buckets
- Row-level security policy violations when accessing storage
- Use the fix-storage-permissions.js script or manually set policies in Supabase dashboard

⚠️ **Next.js Runtime Errors**:

- Some "Cannot read properties of undefined" errors occur in development
- These may not affect production but should be monitored

## Deployment Steps

1. **Database Setup**:

   - Run the SQL to create the products table
   - Verify RLS policies on all tables

2. **Storage Setup**:

   - Run the fix-storage-permissions.js script
   - If needed, manually create and configure buckets in Supabase

3. **Build & Deploy**:

   - Clear Next.js cache: `rm -rf .next`
   - Run a production build: `npm run build`
   - Deploy to Vercel

4. **Post-Deployment Verification**:
   - Check that all 19 brands appear in the directory
   - Test image loading from storage
   - Verify the repair-images API works

## Note on Brand Display Issue

The original issue with only 4 brands showing (instead of all 19) was likely caused by:

1. Missing service role key in environment variables
2. Storage permission issues preventing image access
3. Missing products table affecting related queries

After implementing the fixes in this guide, all 19 brands should display correctly.
