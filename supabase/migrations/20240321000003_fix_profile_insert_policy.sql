-- Add policy to allow users to insert their own profile during registration
CREATE POLICY "Users can insert their own profile during registration"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Also add a policy to allow profile creation for new users
-- This is needed for the signup process
CREATE POLICY "Allow profile creation during signup"
  ON profiles FOR INSERT
  WITH CHECK (true); 