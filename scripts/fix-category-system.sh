#!/bin/bash

# Fix Category System Script
# This script runs all the necessary fixes to clean up the category system

echo "🔧 Starting Category System Fix..."

# 1. First, check current categories
echo "📊 Checking current categories..."
psql $DATABASE_URL -f scripts/check-brand-categories.sql

# 2. Fix duplicate categories
echo "🔄 Fixing duplicate categories..."
psql $DATABASE_URL -f scripts/fix-duplicate-categories.sql

# 3. Check results after cleanup
echo "✅ Categories after cleanup:"
psql $DATABASE_URL -c "
SELECT 
  category,
  COUNT(*) as brand_count
FROM brands 
WHERE category IS NOT NULL
GROUP BY category
ORDER BY brand_count DESC;
"

echo "🎉 Category system fix completed!"
echo ""
echo "📋 Summary of changes:"
echo "• Added 'Vacation & Resort' category"
echo "• Standardized 'High End Fashion' (removed duplicates)"
echo "• Cleaned up inconsistent category names"
echo "• Updated navigation to include new category"
echo ""
echo "🔄 Please restart your development server to see the changes"
