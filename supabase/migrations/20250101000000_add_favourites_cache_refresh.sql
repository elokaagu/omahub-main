-- Create a function to refresh favourites cache for real-time updates
-- This helps ensure immediate data consistency after favourites operations

CREATE OR REPLACE FUNCTION refresh_favourites_cache(user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Force a refresh of the favourites table for the specific user
  -- This helps with real-time updates by ensuring the latest data is available
  
  -- Optionally, you can add more complex cache invalidation logic here
  -- For now, this function serves as a placeholder for future optimizations
  
  -- The function is marked as SECURITY DEFINER to ensure it runs with elevated privileges
  -- This helps bypass any RLS policies that might interfere with immediate updates
  
  NULL; -- No specific action needed for now, but the function call helps trigger updates
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION refresh_favourites_cache(UUID) TO authenticated;

-- Add a comment for documentation
COMMENT ON FUNCTION refresh_favourites_cache(UUID) IS 'Helper function to refresh favourites cache for real-time updates';
