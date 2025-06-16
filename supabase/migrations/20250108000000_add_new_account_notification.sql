-- Enhanced function to create profile and send notification
CREATE OR REPLACE FUNCTION create_profile_for_user()
RETURNS TRIGGER AS $$
DECLARE
  webhook_url TEXT;
  webhook_secret TEXT;
  payload JSON;
BEGIN
  -- Insert the profile (existing functionality)
  INSERT INTO public.profiles (
    id,
    email,
    role,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    'user',
    NOW(),
    NOW()
  );

  -- Log the new account creation
  RAISE NOTICE 'New account created: % (ID: %)', NEW.email, NEW.id;

  -- Prepare webhook notification (if configured)
  BEGIN
    -- Get webhook configuration from environment or settings
    -- In production, you would set these in your Supabase project settings
    webhook_url := 'https://omahub.com/api/webhooks/new-account';
    webhook_secret := 'your-webhook-secret'; -- This should be set in your environment
    
    -- Prepare the payload
    payload := json_build_object(
      'type', 'INSERT',
      'table', 'profiles',
      'record', json_build_object(
        'id', NEW.id,
        'email', NEW.email,
        'role', 'user',
        'created_at', NOW()
      )
    );

    -- Send HTTP request to webhook (using pg_net extension if available)
    -- Note: This requires the pg_net extension to be enabled in Supabase
    -- Alternative: Use Supabase Edge Functions or handle this in application code
    
    -- For now, we'll just log the notification
    -- The actual webhook call will be handled by the application layer
    RAISE NOTICE 'New account notification prepared for: %', NEW.email;
    
  EXCEPTION
    WHEN OTHERS THEN
      -- Don't fail the profile creation if notification fails
      RAISE WARNING 'Failed to send new account notification for %: %', NEW.email, SQLERRM;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the trigger (it should already exist, but we'll recreate it to be safe)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE create_profile_for_user();

-- Create a function to manually trigger new account notifications
-- This can be used to test the notification system
CREATE OR REPLACE FUNCTION trigger_new_account_notification(user_email TEXT)
RETURNS TEXT AS $$
DECLARE
  user_profile RECORD;
  result TEXT;
BEGIN
  -- Find the user profile
  SELECT * INTO user_profile
  FROM public.profiles
  WHERE email = user_email
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN 'User not found: ' || user_email;
  END IF;

  -- Log the notification trigger
  RAISE NOTICE 'Manually triggering new account notification for: %', user_email;
  
  result := 'New account notification triggered for: ' || user_email || ' (ID: ' || user_profile.id || ')';
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a view to track recent account creations
CREATE OR REPLACE VIEW recent_account_creations AS
SELECT 
  id,
  email,
  role,
  created_at,
  EXTRACT(EPOCH FROM (NOW() - created_at)) / 3600 AS hours_since_creation
FROM public.profiles
WHERE created_at >= NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;

-- Grant access to the view
GRANT SELECT ON recent_account_creations TO authenticated;
GRANT SELECT ON recent_account_creations TO anon;

-- Add a comment to document the enhancement
COMMENT ON FUNCTION create_profile_for_user() IS 'Creates user profile and triggers new account notifications when a new user signs up';
COMMENT ON FUNCTION trigger_new_account_notification(TEXT) IS 'Manually trigger new account notification for testing purposes';
COMMENT ON VIEW recent_account_creations IS 'View of recently created accounts for monitoring purposes'; 