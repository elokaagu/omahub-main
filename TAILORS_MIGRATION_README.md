# Tailors Directory Migration Guide

This guide explains how to migrate existing brands with "Tailored" category to the new Tailors Directory.

## Overview

The Tailors Directory is a specialized section that showcases tailoring services with detailed information like:

- Specialties (e.g., Bespoke Suits, Wedding Dresses, Alterations)
- Price ranges
- Lead times
- Consultation fees

## Migration Options

### Option 1: Automated Node.js Script (Recommended)

The easiest way to migrate tailoring brands is using the automated script:

```bash
npm run migrate:tailors
```

This script will:

1. ✅ Check for existing brands with "Tailored" category
2. ✅ Create the tailors table if it doesn't exist
3. ✅ Migrate tailoring brands to the tailors table
4. ✅ Avoid duplicates
5. ✅ Provide detailed progress feedback
6. ✅ Verify the migration results

### Option 2: Manual SQL Execution

If you prefer to run SQL directly, use the provided SQL files:

1. **For complete setup**: `migrate_tailoring_brands_to_tailors.sql`
2. **For table creation only**: `create_tailors_table.sql`

Execute in your Supabase SQL editor or via command line.

## Current Tailored Brands

The following brands will be migrated:

### 1. Tunis Master Tailors

- **Location**: Tunis, Tunisia
- **Specialties**: Bespoke Suits, Formal Wear, Shirts, Mediterranean Style, Traditional Tailored
- **Price Range**: TND 800 - TND 5,000
- **Lead Time**: 3-4 weeks
- **Consultation Fee**: $75

### 2. Casablanca Cuts

- **Location**: Casablanca, Morocco
- **Specialties**: Bespoke Suits, Traditional Moroccan Wear, Contemporary Menswear, Custom Design, Alterations
- **Price Range**: MAD 5,000 - MAD 30,000
- **Lead Time**: 2-3 weeks
- **Consultation Fee**: $100

## Prerequisites

Before running the migration:

1. **Database Setup**: Ensure your Supabase database is accessible
2. **Environment Variables**: Check that your `.env.local` file contains:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
3. **Brands Table**: Ensure your brands table contains the tailoring brands

## Post-Migration Steps

After successful migration:

1. **Visit the Tailors Directory**: Go to `/tailors` to see the migrated tailors
2. **Test Individual Pages**: Visit `/tailor/[id]` for detailed tailor views
3. **Homepage Integration**: The "Tailored" option on the homepage now routes to `/tailors`

## Adding More Tailors

### Via Admin Interface

Use the API endpoint `/api/studio/tailors` to add more tailors programmatically.

### Via Database

Insert directly into the `tailors` table with the required fields:

- `brand_id` (references brands table)
- `title`
- `image`
- `description`
- `specialties` (array)
- `price_range`
- `lead_time`
- `consultation_fee`

## Extending to Other Categories

You can extend this system to other categories like Bridal:

```javascript
// Example: Add bridal tailors
const bridalTailors = [
  {
    brandId: "zora-atelier",
    title: "Bridal Couture & Custom Gowns",
    specialties: ["Wedding Dresses", "Bridal Wear", "Evening Gowns"],
    priceRange: "KSh 150,000 - KSh 850,000",
    leadTime: "6-8 weeks",
    consultationFee: 150.0,
  },
];
```

## Troubleshooting

### Common Issues

1. **"Table doesn't exist" error**

   - Run the table creation script first
   - Check database permissions

2. **"Brand not found" error**

   - Verify brand IDs in your brands table
   - Check brand names match exactly

3. **Duplicate entries**
   - The script automatically handles duplicates
   - Check existing tailors before manual insertion

### Getting Help

If you encounter issues:

1. Check the console output for detailed error messages
2. Verify your Supabase connection
3. Ensure all required environment variables are set

## Database Schema

The tailors table structure:

```sql
CREATE TABLE tailors (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    brand_id TEXT NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    image TEXT NOT NULL,
    description TEXT,
    specialties TEXT[],
    price_range TEXT,
    lead_time TEXT,
    consultation_fee DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Files Created

- `scripts/migrate-tailoring-brands.js` - Automated migration script
- `migrate_tailoring_brands_to_tailors.sql` - Complete SQL migration
- `create_tailors_table.sql` - Table creation only
- `app/tailors/page.tsx` - Tailors directory page
- `app/tailor/[id]/page.tsx` - Individual tailor pages
- `lib/services/tailorService.ts` - Tailor service functions
- `app/api/studio/tailors/route.ts` - API endpoints
