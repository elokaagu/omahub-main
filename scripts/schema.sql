-- Create brands table
CREATE TABLE brands (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  long_description TEXT,
  location TEXT NOT NULL,
  price_range TEXT,
  category TEXT NOT NULL,
  rating FLOAT NOT NULL,
  is_verified BOOLEAN DEFAULT FALSE,
  image TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create hero_slides table for managing homepage carousel
CREATE TABLE hero_slides (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  image TEXT NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT,
  link TEXT,
  hero_title TEXT,
  is_editorial BOOLEAN DEFAULT true,
  display_order INT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on hero_slides
ALTER TABLE hero_slides ENABLE ROW LEVEL SECURITY;

-- Create policies for hero_slides
CREATE POLICY "Allow public read access to hero_slides" 
  ON hero_slides FOR SELECT 
  USING (true);

CREATE POLICY "Allow admin users to manage hero_slides" 
  ON hero_slides FOR ALL 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'super_admin'
    )
  );

-- Create reviews table
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id TEXT REFERENCES brands(id) ON DELETE CASCADE,
  author TEXT NOT NULL,
  comment TEXT NOT NULL,
  rating FLOAT NOT NULL,
  date TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create collections table
CREATE TABLE collections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id TEXT REFERENCES brands(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  image TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create profiles table for user data
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT valid_role CHECK (role IN ('user', 'admin', 'super_admin', 'brand_owner'))
);

-- Function to set up super admin users
CREATE OR REPLACE FUNCTION setup_super_admin(admin_email TEXT)
RETURNS void AS $$
BEGIN
  UPDATE profiles
  SET role = 'super_admin'
  WHERE email = admin_email
  AND EXISTS (
    SELECT 1 FROM auth.users
    WHERE email = admin_email
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to create a profile when a new user signs up
CREATE OR REPLACE FUNCTION create_profile_for_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE create_profile_for_user();

-- Enable Row Level Security
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for brands
CREATE POLICY "Allow public read access to brands" 
  ON brands FOR SELECT 
  USING (true);

CREATE POLICY "Allow authenticated users to create brands" 
  ON brands FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

CREATE POLICY "Allow brand owners to update their brands" 
  ON brands FOR UPDATE 
  USING (auth.uid() IN (
    SELECT id FROM profiles WHERE id = auth.uid()
  ));

-- Create policies for reviews
CREATE POLICY "Allow public read access to reviews" 
  ON reviews FOR SELECT 
  USING (true);

CREATE POLICY "Allow authenticated users to create reviews" 
  ON reviews FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

CREATE POLICY "Allow users to update their own reviews" 
  ON reviews FOR UPDATE 
  USING (auth.uid() IN (
    SELECT id FROM profiles WHERE id = auth.uid()
  ));

-- Create policies for collections
CREATE POLICY "Allow public read access to collections" 
  ON collections FOR SELECT 
  USING (true);

CREATE POLICY "Allow authenticated users to create collections" 
  ON collections FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

-- Create policies for profiles
CREATE POLICY "Allow users to read their own profile" 
  ON profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Allow users to update their own profile" 
  ON profiles FOR UPDATE 
  USING (auth.uid() = id); 