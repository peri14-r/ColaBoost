-- Fix 1: Create a secure view for subscriptions that excludes Stripe identifiers
DROP VIEW IF EXISTS public.safe_subscriptions;
CREATE VIEW public.safe_subscriptions AS
SELECT 
  id,
  user_id,
  subscription_type,
  status,
  current_period_end,
  plan,
  created_at,
  updated_at
FROM public.subscriptions;

-- Enable RLS on the view
ALTER VIEW public.safe_subscriptions SET (security_invoker = true);

-- Grant access to authenticated users
GRANT SELECT ON public.safe_subscriptions TO authenticated;

-- Fix 2: Create a secure view for public profiles that excludes user_id
DROP VIEW IF EXISTS public.discoverable_profiles;
CREATE VIEW public.discoverable_profiles AS
SELECT 
  id,
  name,
  bio,
  niche,
  handle,
  display_name,
  avatar_url,
  profile_picture_url,
  follower_count,
  platforms,
  skills,
  location,
  instagram_url,
  youtube_url,
  tiktok_url,
  created_at,
  updated_at
FROM public.profiles
WHERE visibility = 'public';

-- Enable RLS on the view
ALTER VIEW public.discoverable_profiles SET (security_invoker = true);

-- Grant access to everyone for public profiles
GRANT SELECT ON public.discoverable_profiles TO authenticated, anon;

-- Update profiles RLS policy to prevent user_id exposure in public queries
DROP POLICY IF EXISTS "Anonymous users can view public profiles only" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can view public profiles" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles must use discoverable_profiles view" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can view own profile" ON public.profiles;

-- New policy: Anonymous users can't access profiles table directly
CREATE POLICY "Public profiles must use discoverable_profiles view"
ON public.profiles
FOR SELECT
TO anon
USING (false);

-- Authenticated users can only see their own profile or use discoverable_profiles view
CREATE POLICY "Authenticated users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Comment explaining the security measures
COMMENT ON VIEW public.safe_subscriptions IS 'Secure view that exposes subscription status without Stripe identifiers (customer_id, subscription_id, session_id)';
COMMENT ON VIEW public.discoverable_profiles IS 'Secure view that exposes public profiles without exposing internal user_id field';