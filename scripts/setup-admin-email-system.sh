#!/bin/bash

echo "🔧 Setting up Admin Email Management System..."
echo "📊 This will move hardcoded admin emails to the database"

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL environment variable not set!"
    echo "💡 Please run this script from your Supabase project or set DATABASE_URL"
    echo "📋 You can also run the SQL manually in your Supabase dashboard:"
    echo ""
    echo "Copy and paste this SQL into your Supabase SQL Editor:"
    echo "----------------------------------------"
    cat scripts/create-admin-email-system.sql
    echo "----------------------------------------"
    exit 1
fi

echo "🗄️ Running migration..."
psql $DATABASE_URL -f scripts/create-admin-email-system.sql

if [ $? -eq 0 ]; then
    echo "✅ Admin email system setup completed successfully!"
    echo "🔄 Please restart your development server to see the changes."
    echo ""
    echo "📋 What was created:"
    echo "  - Admin email settings in platform_settings table"
    - Database functions for checking admin status
    - RLS policies for platform_settings
    - Indexes for better performance
else
    echo "❌ Failed to setup admin email system. Check the error above."
    echo "💡 You might need to run the SQL manually in your Supabase dashboard."
fi
