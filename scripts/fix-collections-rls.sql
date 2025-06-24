-- Fix RLS policies for collections to allow API creation
-- Drop existing policies and create new ones that work with API routes

DROP POLICY IF EXISTS "Allow public read access to collections" ON collections;
DROP POLICY IF EXISTS "Allow authenticated users to create collections" ON collections;
DROP POLICY IF EXISTS "Allow authenticated users to update collections" ON collections;
DROP POLICY IF EXISTS "Allow authenticated users to delete collections" ON collections;

-- Create new policies that allow API access
CREATE POLICY "Allow public read access to collections" 
  ON collections FOR SELECT 
  USING (true);

-- Allow insert from API routes (no auth required for studio operations)
CREATE POLICY "Allow API to create collections" 
  ON collections FOR INSERT 
  WITH CHECK (true);

-- Allow update from API routes
CREATE POLICY "Allow API to update collections" 
  ON collections FOR UPDATE 
  USING (true);

-- Allow delete from API routes
CREATE POLICY "Allow API to delete collections" 
  ON collections FOR DELETE 
  USING (true); 