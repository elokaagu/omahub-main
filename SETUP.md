# OmaHub Brand Dashboard Setup

This document outlines the updates made to fix issues with the brand dashboard and setup the required backend features.

## Implemented Features

1. **Supabase Storage Permissions**

   - Fixed Row Level Security (RLS) policies for storage buckets
   - Added proper bucket access for both anonymous and authenticated users
   - Implemented retry mechanism for storage operations

2. **Products Table**

   - Added missing products table schema with proper foreign keys
   - Implemented RLS policies for secure access
   - Created service layer for product management (CRUD operations)

3. **Extended Brand Creation Form**

   - Added support for social media fields (website, Instagram)
   - Added founding year selection
   - Improved image upload preview functionality

4. **API Routes**

   - Fixed favorites API to properly handle Supabase authentication
   - Added database setup API for initializing required resources

5. **Setup Script**
   - Created CLI setup script for configuring Supabase environment
   - Handles bucket creation, RLS policies, and table creation

## Setup Instructions

1. Make sure you have the following environment variables in your `.env.local` file:

   ```
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

2. Run the setup script to configure your Supabase environment:

   ```
   npm run setup
   ```

3. Start the development server:

   ```
   npm run dev
   ```

4. Visit the brand dashboard at `/studio/brands` to create brands with all available fields.

## Database Schema

The system now includes the following tables:

- `brands`: Core brand information
- `collections`: Brand collections
- `products`: Products linked to brands and collections
- `favorites`: User's favorite brands
- `reviews`: Brand reviews from users

## Storage Buckets

Two storage buckets are configured:

1. `brand-assets`: For brand images, collection images, and product images
2. `profiles`: For user profile pictures and related content

## Troubleshooting

If you encounter any issues with storage permissions or database access:

1. Check that your Supabase service role key has proper permissions
2. Run the setup script again to ensure all resources are properly configured
3. Check the browser console for specific error messages
4. Ensure your Supabase project has RLS enabled and the proper policies in place

For persistent issues, you may need to:

1. Go to your Supabase dashboard
2. Reset RLS policies for the affected tables
3. Run the setup script again
