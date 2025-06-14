-- Enable the net extension for HTTP requests
CREATE EXTENSION IF NOT EXISTS "http" WITH SCHEMA extensions;

-- Grant usage to authenticated users
GRANT USAGE ON SCHEMA extensions TO authenticated;
GRANT USAGE ON SCHEMA extensions TO service_role;

-- Grant execute permission on the http functions
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA extensions TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA extensions TO service_role; 