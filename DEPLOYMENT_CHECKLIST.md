# OmaHub Deployment Checklist

Before deploying to production, ensure you've completed the following steps:

## Database Setup

- [ ] Execute the `scripts/fix-database.sql` script in your Supabase SQL editor (this will create the products table with the correct UUID type for collection_id)
- [ ] Verify all 19 brands are visible in the Supabase dashboard
- [ ] Verify all 52 collections are visible in the Supabase dashboard
- [ ] Verify the products table was created with the correct schema

## Storage Setup

- [ ] Verify storage buckets exist: `brand-assets` and `profiles` (the SQL script should create these)
- [ ] Verify RLS policies are correctly set up for storage buckets and objects (the SQL script configures these)
- [ ] If buckets are not visible, manually create them in the Supabase dashboard

## Environment Variables

- [ ] Ensure `NEXT_PUBLIC_SUPABASE_URL` is set correctly in `.env.local`
- [ ] Ensure `NEXT_PUBLIC_SUPABASE_ANON_KEY` is set correctly in `.env.local`
- [ ] Ensure `SUPABASE_SERVICE_ROLE_KEY` is set correctly in `.env.local`

## Application Build

- [ ] Fix Next.js build issues by running: `bash scripts/fix-nextjs-cache.sh`
- [ ] Test the application in development mode: `npm run dev`
- [ ] Verify all 19 brands appear in the brands directory
- [ ] Verify brand images load correctly
- [ ] Verify collections display correctly

## Deployment

- [ ] Ensure Vercel project is set up with the correct environment variables
- [ ] Deploy to Vercel: `vercel --prod` or connect GitHub repository
- [ ] After deployment, verify the production site works correctly

## Post-Deployment

- [ ] Test user authentication in production
- [ ] Test brand creation in production
- [ ] Test collection creation in production
- [ ] Monitor error logs in Vercel dashboard

## Known Issues & Fixes

- If storage permissions issues persist after running the SQL script, manually verify that:

  - Storage RLS is enabled for buckets and objects tables
  - Policies allow public access to read from buckets and objects
  - Authenticated users can upload to buckets

- If Next.js errors with "Cannot read properties of undefined (reading 'clientModules')" occur:
  - Run `bash scripts/fix-nextjs-cache.sh` to completely clean the Next.js cache
  - Or manually clear cache: `rm -rf .next node_modules/.cache` and reinstall dependencies
