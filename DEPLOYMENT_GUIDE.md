# OmaHub Deployment Guide

This guide provides step-by-step instructions for deploying the OmaHub African fashion marketplace application to production.

## Prerequisites

- Supabase account with a project set up
- Vercel account (recommended for deployment)
- Node.js 18+ and npm installed locally

## 1. Database Setup

Before deploying, ensure the Supabase database is properly configured:

1. Execute the comprehensive SQL script to fix all database issues:

   ```bash
   # Copy the SQL from scripts/fix-database.sql and run it in the Supabase SQL Editor
   ```

   This script:

   - Creates the products table with the correct UUID type for collection_id
   - Sets up RLS policies for all tables
   - Configures storage permissions
   - Attempts to create storage buckets if they don't exist

2. Verify that all tables exist and have the correct structure:
   - brands
   - collections
   - products (with collection_id as UUID type)
   - profiles
   - favourites

## 2. Storage Setup

1. If the SQL script did not create the storage buckets, manually create them in the Supabase dashboard:

   - `brand-assets` (public)
   - `profiles` (public)

2. Verify the RLS policies are correctly applied to storage buckets and objects:
   - Public read access for all buckets
   - Authenticated users can insert into buckets
   - Storage.buckets and storage.objects tables have RLS enabled

## 3. Environment Variables

Ensure these environment variables are set in your local `.env.local` file and in your deployment platform:

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

## 4. Fixing Next.js Build Issues

If you encounter Next.js build errors such as "Cannot read properties of undefined (reading 'clientModules')", run:

```bash
# Use the provided script to fix Next.js cache issues
bash scripts/fix-nextjs-cache.sh
```

This script will:

1. Stop running Next.js processes
2. Remove Next.js cache directories
3. Clean npm cache
4. Reinstall dependencies
5. Rebuild the application

## 5. Verify Setup

Run the verification script to ensure everything is set up correctly:

```bash
node scripts/verify-brands.js
```

This should show:

- 19 brands accessible with both service role and anonymous keys
- Storage buckets properly configured
- Ability to list files in the storage buckets

## 6. Build and Deploy

### Local Build Test

Before deploying, test the build locally:

```bash
# Build the application
npm run build

# Test the application locally
npm run start
```

### Deploy to Vercel

1. Install Vercel CLI (if not already installed):

   ```bash
   npm install -g vercel
   ```

2. Deploy to Vercel:

   ```bash
   vercel --prod
   ```

   Or connect your GitHub repository to Vercel for automatic deployments.

3. Configure environment variables in the Vercel dashboard:
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY
   - SUPABASE_SERVICE_ROLE_KEY

## 7. Post-Deployment Verification

After deployment, verify:

1. All 19 brands display in the directory
2. Brand images load correctly
3. Authentication works
4. Brand and collection creation works
5. Products can be associated with collections

## Troubleshooting

### Foreign Key Constraint Error

If you see an error like: `foreign key constraint "products_collection_id_fkey" cannot be implemented - key columns "collection_id" and "id" are of incompatible types: text and uuid`

This means there's a data type mismatch between the `products.collection_id` field (TEXT) and `collections.id` field (UUID). The `fix-database.sql` script fixes this by creating the products table with collection_id as UUID type.

### Storage Permission Errors

If you see errors like: `new row violates row-level security policy`

1. Check that RLS is properly enabled on storage.buckets and storage.objects
2. Verify policies exist allowing public access for SELECT operations
3. Verify policies exist allowing authenticated users to INSERT
4. Manually create the buckets in the Supabase dashboard if needed

### Next.js Build Errors

If you see errors like: `Cannot read properties of undefined (reading 'clientModules')`

1. Run the provided script: `bash scripts/fix-nextjs-cache.sh`
2. If issues persist, try manually clearing all cache:
   ```bash
   rm -rf .next
   rm -rf node_modules/.cache
   npm cache clean --force
   rm -rf node_modules
   npm install
   ```

## Maintenance

Regularly check:

- Supabase storage usage
- Database backups
- Error logs in Vercel
