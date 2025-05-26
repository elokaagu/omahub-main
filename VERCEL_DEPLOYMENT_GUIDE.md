# Vercel Deployment Guide for OmaHub

## Environment Variables

To deploy OmaHub successfully to Vercel, you need to add the following environment variables in your Vercel project dashboard.

1. Log in to your Vercel account
2. Navigate to your OmaHub project
3. Go to "Settings" > "Environment Variables"
4. Add the following environment variables:

```
NEXT_PUBLIC_SUPABASE_URL: https://gswduyodzdgucjscjtvz.supabase.co

NEXT_PUBLIC_SUPABASE_ANON_KEY: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdzd2R1eW9kemRndWNqc2NqdHZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgwMTc0MzgsImV4cCI6MjA2MzU5MzQzOH0.gEREBStwiffbTmAaZGmBBsXo4FYEqQat8TpT46sS60A

SUPABASE_SERVICE_ROLE_KEY: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdzd2R1eW9kemRndWNqc2NqdHZ6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODAxNzQzOCwiZXhwIjoyMDYzNTkzNDM4fQ.4sqZxnRlSXQwRv7wB5JEWcpdTr5_Ucb97IF-32SRG7k

SEED_KEY: omahub-seed-c74b91e83df9
```

5. Make sure to set them for "Production", "Preview", and "Development" environments
6. Click "Save"
7. Go back to the "Deployments" tab and click "Redeploy" on your latest deployment

## Database Setup

After deploying, you need to initialize the database with sample data:

1. Make sure you've run the SQL migrations in Supabase (as described in `db/INSTRUCTIONS.md`)
2. Visit: `https://your-vercel-app-url.vercel.app/api/seed?key=omahub-seed-c74b91e83df9`

This will populate your database with initial brand data.

## Supabase Storage Setup

For the OmaHub Studio to work properly, you need to set up storage in Supabase:

1. Go to your Supabase project dashboard
2. Navigate to "Storage" > "Buckets"
3. Create a new bucket called "brand-assets"
4. Configure bucket permissions:
   - Make the bucket public or set appropriate RLS policies
   - Ensure authenticated users can upload files

## Admin Access Setup

To access the OmaHub Studio:

1. Create a user account through the regular signup flow
2. In the Supabase dashboard, go to "Table Editor" > "profiles"
3. Find your user and edit their record
4. Add a "role" column with the value "admin"
5. Save the changes

## Accessing the Studio

After deployment, the Studio will be available at:

```
https://your-vercel-app-url.vercel.app/studio
```

You must be logged in with an admin account to access it.

## Manual Deployment

If you want to deploy manually from your local machine:

```bash
# Install Vercel CLI if you haven't already
npm install -g vercel

# Login to Vercel
vercel login

# Deploy to production
vercel --prod
```

## Troubleshooting

If you encounter build errors in Vercel:

1. Check that all environment variables are set correctly
2. Ensure your Supabase instance is running and accessible
3. Check Vercel logs for specific error messages
4. Verify that the SQL migrations have been applied to your Supabase database
5. For Studio access issues, verify that:
   - The user has admin role in the profiles table
   - Supabase storage buckets are properly configured
