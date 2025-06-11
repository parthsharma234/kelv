/*
  # Create user count function

  1. New Functions
    - `get_user_count()` - Returns the total number of authenticated users
  
  2. Security
    - Function is accessible to authenticated users
    - Uses security definer to access auth schema
*/

-- Create function to get user count
CREATE OR REPLACE FUNCTION get_user_count()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO user_count FROM auth.users;
  RETURN user_count;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_count() TO authenticated;