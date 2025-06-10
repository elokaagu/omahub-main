#!/bin/bash

# Load environment variables
source .env.local 2>/dev/null || source .env 2>/dev/null || true

# Check if required environment variables are set
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "❌ Error: Missing required environment variables"
    echo "Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set"
    exit 1
fi

# Extract database URL components
DB_URL=$(echo $NEXT_PUBLIC_SUPABASE_URL | sed 's|https://||' | sed 's|\.supabase\.co||')
PROJECT_REF=$(echo $DB_URL | cut -d'.' -f1)

# Construct PostgreSQL connection string
PG_CONNECTION="postgresql://postgres.${PROJECT_REF}:${SUPABASE_SERVICE_ROLE_KEY}@aws-0-eu-west-2.pooler.supabase.com:6543/postgres"

echo "🔗 Connecting to Supabase database..."
echo "📊 Project: $PROJECT_REF"

# Create temporary SQL file
TEMP_SQL=$(mktemp)
cat > "$TEMP_SQL" << 'EOF'
-- Enable RLS on storage.objects (if not already enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access to product images" ON storage.objects;
DROP POLICY IF EXISTS "Allow owners to update their product images" ON storage.objects;
DROP POLICY IF EXISTS "Allow owners to delete their product images" ON storage.objects;

-- Policy 1: Allow super admins, admins, and brand owners to upload product images
CREATE POLICY "Allow authenticated users to upload product images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'product-images' 
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('super_admin', 'admin', 'brand_owner')
  )
);

-- Policy 2: Allow public read access to product images
CREATE POLICY "Allow public read access to product images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'product-images');

-- Policy 3: Allow authorized users to update their product images
CREATE POLICY "Allow owners to update their product images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'product-images' 
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('super_admin', 'admin', 'brand_owner')
  )
);

-- Policy 4: Allow authorized users to delete their product images
CREATE POLICY "Allow owners to delete their product images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'product-images' 
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('super_admin', 'admin', 'brand_owner')
  )
);

-- Verify policies were created
SELECT 
  policyname, 
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage' 
  AND policyname LIKE '%product images%';
EOF

echo "🚀 Applying storage policies..."

# Execute SQL using psql
if psql "$PG_CONNECTION" -f "$TEMP_SQL"; then
    echo "✅ Storage policies applied successfully!"
    echo "🎯 Super admins should now be able to upload product images."
else
    echo "❌ Failed to apply storage policies"
    echo "💡 You may need to use the Supabase Dashboard Storage interface instead"
fi

# Clean up
rm "$TEMP_SQL" 