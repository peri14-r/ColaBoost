-- Verify that safe_subscriptions view is properly secured
-- The view inherits RLS from the underlying subscriptions table when security_invoker is enabled

-- First, verify the subscriptions table has proper RLS enabled
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'subscriptions' 
    AND rowsecurity = true
  ) THEN
    RAISE EXCEPTION 'RLS must be enabled on subscriptions table';
  END IF;
END $$;

-- Add explicit documentation about the security model
COMMENT ON VIEW public.safe_subscriptions IS 
'SECURITY MODEL: This view exposes subscription data WITHOUT sensitive Stripe identifiers (customer_id, subscription_id, session_id). 
Access control: Inherits RLS policies from subscriptions table via security_invoker=true. 
Users can only see their own subscription via the "Users can view own subscription" policy on subscriptions table.
The view filters out: stripe_customer_id, stripe_subscription_id, stripe_session_id to prevent payment system manipulation.';

-- Revoke all existing grants to start fresh
REVOKE ALL ON public.safe_subscriptions FROM PUBLIC;
REVOKE ALL ON public.safe_subscriptions FROM anon;
REVOKE ALL ON public.safe_subscriptions FROM authenticated;

-- Grant SELECT only to authenticated users
-- RLS from subscriptions table ensures users can only see their own data
GRANT SELECT ON public.safe_subscriptions TO authenticated;

-- Verify the view still has security_invoker enabled
ALTER VIEW public.safe_subscriptions SET (security_invoker = true);

-- Add a function to verify the security chain
CREATE OR REPLACE FUNCTION public.verify_safe_subscriptions_security()
RETURNS TABLE (
  security_check text,
  status text,
  details text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check 1: Verify RLS is enabled on subscriptions table
  RETURN QUERY
  SELECT 
    'RLS Enabled on subscriptions'::text,
    CASE WHEN rowsecurity THEN 'PASS'::text ELSE 'FAIL'::text END,
    'Row Level Security must be enabled on the base table'::text
  FROM pg_tables
  WHERE schemaname = 'public' AND tablename = 'subscriptions';
  
  -- Check 2: Verify security_invoker is set on view
  RETURN QUERY
  SELECT 
    'security_invoker on view'::text,
    CASE WHEN reloptions::text LIKE '%security_invoker=true%' THEN 'PASS'::text ELSE 'FAIL'::text END,
    'View must use security_invoker to inherit RLS from base table'::text
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relname = 'safe_subscriptions';
  
  -- Check 3: Verify policies exist on subscriptions table
  RETURN QUERY
  SELECT 
    'RLS Policies on subscriptions'::text,
    CASE WHEN COUNT(*) > 0 THEN 'PASS'::text ELSE 'FAIL'::text END,
    'At least one SELECT policy must exist restricting access'::text
  FROM pg_policies
  WHERE schemaname = 'public' 
    AND tablename = 'subscriptions' 
    AND cmd = 'SELECT';
END;
$$;

-- Run the security verification
-- This will show in the logs
DO $$
DECLARE
  check_result RECORD;
BEGIN
  FOR check_result IN SELECT * FROM public.verify_safe_subscriptions_security()
  LOOP
    RAISE NOTICE '% : % - %', check_result.security_check, check_result.status, check_result.details;
    IF check_result.status = 'FAIL' THEN
      RAISE EXCEPTION 'Security check failed: %', check_result.security_check;
    END IF;
  END LOOP;
  RAISE NOTICE 'All security checks PASSED for safe_subscriptions view';
END;
$$;