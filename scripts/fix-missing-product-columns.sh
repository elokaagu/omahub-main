#!/bin/bash
echo "🔧 Fixing Missing Product Columns..."
echo "📊 Adding missing columns for services and portfolio functionality..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL environment variable not set!"
    echo "💡 Please run this script from your Supabase project or set DATABASE_URL"
    echo "📋 You can also run the SQL manually in your Supabase dashboard:"
    echo ""
    echo "Copy and paste this SQL into your Supabase SQL Editor:"
    echo "----------------------------------------"
    cat scripts/fix-missing-product-columns.sql
    echo "----------------------------------------"
    exit 1
fi

echo "🗄️  Running migration..."
psql $DATABASE_URL -f scripts/fix-missing-product-columns.sql

if [ $? -eq 0 ]; then
    echo "✅ Migration completed successfully!"
    echo "🎉 Missing product columns have been added"
    echo ""
    echo "📋 What was added:"
    echo "• contact_for_pricing (BOOLEAN) - For 'Contact for pricing' option"
    echo "• specialties (TEXT[]) - For tailor specialties"
    echo "• consultation_fee (DECIMAL) - For consultation fees"
    echo "• price_range (TEXT) - For price range display"
    echo ""
    echo "🔄 Please restart your development server to see the changes"
else
    echo "❌ Migration failed!"
    echo "💡 Please run the SQL manually in your Supabase dashboard"
fi
