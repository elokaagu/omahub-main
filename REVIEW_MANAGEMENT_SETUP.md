# Review Management System Setup

This document outlines the setup process for the comprehensive review management system that allows super admins and brand admins to manage reviews and replies.

## Overview

The review management system provides:

- **Super Admins**: Can view, reply to, and delete ALL reviews across the platform
- **Brand Admins**: Can view, reply to, and delete reviews for THEIR brands only
- **Public Users**: Can see reviews with admin replies on brand pages
- **Review Replies**: Admins can reply to reviews, edit their replies, and delete replies

## Database Setup

### 1. Run the SQL Setup Script

Execute the following SQL script in your Supabase SQL editor:

```bash
# Run this file in Supabase SQL Editor
scripts/create-review-replies-table.sql
```

This script will:

- Create the `review_replies` table for admin responses
- Set up proper Row Level Security (RLS) policies
- Create indexes for performance
- Create a `reviews_with_details` view that joins reviews with replies and brand info
- Create a function `get_brand_admin_reviews()` for brand admin access
- Update existing review policies for admin management

### 2. Verify Database Setup

After running the script, verify the following tables and views exist:

- `public.review_replies` - Stores admin replies to reviews
- `public.reviews_with_details` - View that combines reviews with replies and brand information

## Features

### Super Admin Capabilities

- View all reviews across all brands
- Reply to any review
- Edit their own replies
- Delete any review or reply
- Access via `/studio/reviews`

### Brand Admin Capabilities

- View reviews for their owned brands only
- Reply to reviews for their brands
- Edit their own replies
- Delete reviews for their brands
- Delete their own replies
- Access via `/studio/reviews`

### Public Features

- View reviews with admin replies on brand pages
- Admin replies appear below each review with admin name and timestamp
- Clear visual distinction between reviews and admin responses

## API Endpoints

### Admin Review Management

- `GET /api/admin/reviews` - Fetch reviews (filtered by role)
- `DELETE /api/admin/reviews?id=<reviewId>` - Delete a review

### Admin Reply Management

- `POST /api/admin/reviews/replies` - Create a reply
- `PUT /api/admin/reviews/replies` - Update a reply
- `DELETE /api/admin/reviews/replies?id=<replyId>` - Delete a reply

### Public Reviews (Updated)

- `GET /api/reviews?brandId=<brandId>` - Fetch reviews with replies for a brand

## Navigation

The review management link is automatically added to the Studio navigation for:

- Super admins: Shows as "Reviews"
- Brand admins: Shows as "Your Reviews"

## Components

### New Components

- `/app/studio/reviews/page.tsx` - Main review management interface
- `/components/ui/review-display.tsx` - Reusable component for displaying reviews with replies

### Updated Components

- `/app/brand/[id]/ClientBrandProfile.tsx` - Now shows admin replies
- `/app/designer/[id]/ClientBrandProfile.tsx` - Now shows admin replies
- `/lib/hooks/useReviews.ts` - Updated to handle reply data structure

## Security Features

### Row Level Security (RLS)

- Review replies are publicly viewable (for transparency)
- Only admins can create, update, or delete replies
- Brand admins can only manage reviews/replies for their owned brands
- Super admins have full access to all reviews and replies

### Permission Checks

- API endpoints verify admin permissions before allowing access
- Brand admins are restricted to their owned brands only
- Proper authentication token verification

## Usage Instructions

### For Super Admins

1. Navigate to `/studio/reviews`
2. View all reviews across the platform
3. Use search to find specific reviews
4. Click "Reply" to respond to any review
5. Use delete button to remove inappropriate reviews
6. Edit or delete your own replies using the action buttons

### For Brand Admins

1. Navigate to `/studio/reviews`
2. View reviews for your brands only
3. Filter by specific brand if needed
4. Reply to reviews for your brands
5. Manage your brand's review reputation

### For Public Users

1. Visit any brand page (`/brand/[id]` or `/designer/[id]`)
2. View reviews in the "Customer Reviews" section
3. See admin replies clearly marked below each review
4. Admin replies show the admin name and timestamp

## Troubleshooting

### Common Issues

1. **"Access denied" errors**

   - Verify user has `super_admin` or `brand_admin` role
   - Check that brand admins have brands assigned in `owned_brands` field

2. **Reviews not showing replies**

   - Ensure the database setup script was run successfully
   - Verify the `reviews_with_details` view exists
   - Check that the API is using the updated endpoint

3. **Brand admins can't see reviews**
   - Verify the brand admin has brands assigned in their profile
   - Check that the `owned_brands` field contains the correct brand IDs

### Database Verification Queries

```sql
-- Check if review_replies table exists
SELECT * FROM information_schema.tables WHERE table_name = 'review_replies';

-- Check if reviews_with_details view exists
SELECT * FROM information_schema.views WHERE table_name = 'reviews_with_details';

-- Test the view with sample data
SELECT * FROM reviews_with_details LIMIT 5;

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename IN ('reviews', 'review_replies');
```

## Next Steps

After setup, the review management system will be fully functional. Consider:

- Monitoring review engagement and admin response times
- Setting up notifications for new reviews requiring admin attention
- Creating review moderation guidelines for your admin team
- Adding analytics to track review sentiment and admin response effectiveness

The system is designed to be scalable and maintainable, with proper separation of concerns between super admins and brand admins while maintaining a great user experience for customers viewing reviews.
