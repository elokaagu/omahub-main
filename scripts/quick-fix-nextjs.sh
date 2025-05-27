#!/bin/bash

echo "🧹 Quick-fixing Next.js build issues..."

# Stop any running Next.js processes
echo "Stopping any running Next.js processes..."
pkill -f "next" || true

# Clean Next.js cache
echo "Removing Next.js cache..."
rm -rf .next
rm -rf node_modules/.cache

# Clear any temporary files
echo "Clearing temporary files..."
find . -name "*.log" -type f -delete
find . -name ".DS_Store" -type f -delete

# Restart development server
echo "✅ Next.js cache cleared!"
echo "Run 'npm run dev' to start the development server." 