# Database Migration Instructions

This folder contains SQL migrations for the OmaHub project. Follow these instructions to apply the migrations to your Supabase project.

## Reviews Table Migration

To add the reviews functionality to your Supabase project:

1. Log in to your Supabase dashboard at https://app.supabase.com/
2. Select your project
3. Go to the SQL Editor tab
4. Create a new query
5. Copy the contents of `migrations/reviews_table.sql` and paste it into the query editor
6. Click "Run" to execute the migration

The migration will:

1. Create the `reviews` table with appropriate columns and constraints
2. Set up indexes for performance
3. Enable Row Level Security (RLS) with appropriate policies
4. Create triggers to automatically update the brand rating when reviews are added, updated, or deleted
5. Set up a trigger to update the `updated_at` timestamp automatically

## Verifying the Migration

After running the migration, you can verify it was successful by:

1. Going to the "Table Editor" tab in your Supabase dashboard
2. Checking that the `reviews` table exists with the correct schema
3. Checking the "Policies" tab to ensure RLS policies are set up correctly

## Testing the API

You can test the reviews API endpoints:

1. Using the API endpoints:

   - POST to `/api/reviews` to create a new review
   - GET from `/api/reviews?brandId=<BRAND_ID>` to fetch reviews for a brand

2. Using the Supabase dashboard:
   - Go to the "Table Editor" > "reviews" table
   - Add a test record manually
   - Check that the brand's rating is updated automatically
