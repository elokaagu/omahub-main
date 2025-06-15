-- Create favourites table
CREATE TABLE favourites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  brand_id TEXT REFERENCES brands(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, brand_id)
);

-- Enable Row Level Security
ALTER TABLE favourites ENABLE ROW LEVEL SECURITY;

-- Policies for favourites
-- Allow users to read their own favourites
CREATE POLICY "Allow users to read their own favourites" 
  ON favourites FOR SELECT 
  USING (auth.uid() = user_id);

-- Allow users to create their own favourites
CREATE POLICY "Allow users to create their own favourites" 
  ON favourites FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own favourites
CREATE POLICY "Allow users to delete their own favourites" 
  ON favourites FOR DELETE 
  USING (auth.uid() = user_id); 