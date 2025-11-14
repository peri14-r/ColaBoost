-- Fix SECURITY DEFINER function access control
-- Restrict create_notification function to prevent unauthorized RPC calls

-- Revoke execute permission from authenticated users
REVOKE EXECUTE ON FUNCTION public.create_notification FROM authenticated;

-- Grant execute only to service_role (for edge functions and backend processes)
GRANT EXECUTE ON FUNCTION public.create_notification TO service_role;

-- Update function comment to document security restrictions
COMMENT ON FUNCTION public.create_notification IS 
'SECURITY: This function can only be called by service_role or backend edge functions. 
It cannot be called directly by authenticated users via RPC to prevent notification spoofing.
Only system processes and edge functions should create notifications.';