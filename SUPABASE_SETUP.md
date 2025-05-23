# Supabase Setup Guide for OmaHub

This guide will help you set up Supabase for the OmaHub project.

## Prerequisites

- A Supabase account (sign up at [https://supabase.com](https://supabase.com))
- Node.js and npm installed

## Step 1: Create a Supabase Project

1. Log in to your Supabase account
2. Click "New Project"
3. Enter a name for your project (e.g., "OmaHub")
4. Set a secure database password
5. Choose a region closest to your users
6. Click "Create new project"

## Step 2: Set Up Environment Variables

1. Create a `.env.local` file in the root of your project
2. Add the following variables:

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

3. Replace the placeholder values with your actual Supabase project credentials:
   - Find these values in your Supabase dashboard under Project Settings > API

## Step 3: Create Database Tables

Run the following SQL in the Supabase SQL editor to create the necessary tables:

```sql
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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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
```

## Step 4: Set Up Row Level Security (RLS)

Run the following SQL to set up Row Level Security:

```sql
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
```

## Step 5: Migrate Existing Data

Run the migration script to populate your Supabase database with the existing data:

```bash
# Install dotenv for environment variable loading
npm install dotenv

# Run the migration script
npx ts-node scripts/migrateToSupabase.ts
```

## Step 6: Set Up Authentication

1. In the Supabase dashboard, go to Authentication > Settings
2. Configure your site URL (e.g., http://localhost:3000 for development)
3. Enable the authentication providers you want to use (Email, Google, Facebook, etc.)
4. For email authentication, you can customize the email templates

## Step 7: Test the Integration

1. Start your Next.js development server:

```bash
npm run dev
```

2. Navigate to the login page and test authentication
3. Test the brand listing and detail pages to ensure data is loading correctly

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Next.js with Supabase Guide](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
- [Supabase Auth Helpers for Next.js](https://supabase.com/docs/guides/auth/auth-helpers/nextjs)
