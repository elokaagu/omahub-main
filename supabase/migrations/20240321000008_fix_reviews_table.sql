-- Add user_id column to reviews table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'reviews' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE reviews ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Update RLS policies for reviews to allow anonymous submissions
DROP POLICY IF EXISTS "Allow authenticated users to create reviews" ON reviews;
DROP POLICY IF EXISTS "Allow users to update their own reviews" ON reviews;

-- Allow anyone to create reviews (both authenticated and anonymous users)
CREATE POLICY "Allow anyone to create reviews" 
  ON reviews FOR INSERT 
  WITH CHECK (true);

-- Allow users to update their own reviews if they are authenticated
CREATE POLICY "Allow users to update their own reviews" 
  ON reviews FOR UPDATE 
  USING (
    auth.uid() IS NOT NULL 
    AND user_id = auth.uid()
  );

-- Allow admins to manage all reviews
CREATE POLICY "Allow admins to manage all reviews" 
  ON reviews FOR ALL 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  ); 