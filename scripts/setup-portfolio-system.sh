#!/bin/bash

# Setup Portfolio System Script
# This script sets up the portfolio system for tailors

echo "🎨 Setting up Portfolio System for Tailors..."

# 1. Run the portfolio database migration
echo "🗄️  Adding portfolio fields to database..."
psql $DATABASE_URL -f supabase/migrations/20250610130000_add_portfolio_support.sql

# 2. Verify the changes
echo "✅ Verifying portfolio fields were added..."
psql $DATABASE_URL -c "
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'products' 
  AND column_name IN ('materials', 'techniques', 'inspiration')
ORDER BY column_name;
"

echo "🎉 Portfolio system setup completed!"
echo ""
echo "📋 What was added:"
echo "• materials (TEXT[]) - Array of materials tailors work with"
echo "• techniques (TEXT[]) - Array of techniques tailors specialize in"
echo "• inspiration (TEXT) - Design inspiration and style notes"
echo "• portfolio service type - New service type for portfolio items"
echo ""
echo "🔄 Please restart your development server to see the new Portfolio section"
echo "📍 Navigate to Studio → Portfolio to start creating portfolio items"
