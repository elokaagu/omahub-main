#!/bin/bash

echo "🧹 Fixing Next.js build issues..."

# Stop any running Next.js processes
echo "Stopping any running Next.js processes..."
pkill -f "next"

# Clean Next.js cache
echo "Removing Next.js cache..."
rm -rf .next
rm -rf node_modules/.cache

# Clean package manager cache
echo "Cleaning npm cache..."
npm cache clean --force

# Reinstall dependencies
echo "Reinstalling dependencies..."
rm -rf node_modules
npm install

# Rebuild the application
echo "Rebuilding the application..."
npm run build

echo "✅ Next.js cache fixed and application rebuilt!"
echo "Run 'npm run dev' to start the development server." 