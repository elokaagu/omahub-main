-- Create favorites table
CREATE TABLE favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  brand_id TEXT REFERENCES brands(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, brand_id)
);

-- Enable Row Level Security
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- Policies for favorites
-- Allow users to read their own favorites
CREATE POLICY "Allow users to read their own favorites" 
  ON favorites FOR SELECT 
  USING (auth.uid() = user_id);

-- Allow users to create their own favorites
CREATE POLICY "Allow users to create their own favorites" 
  ON favorites FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own favorites
CREATE POLICY "Allow users to delete their own favorites" 
  ON favorites FOR DELETE 
  USING (auth.uid() = user_id); 