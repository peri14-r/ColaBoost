-- Fix: Allow authenticated users to see public profiles with user_id
-- The discoverable_profiles view is for anonymous users only
DROP POLICY IF EXISTS "Authenticated users can view own profile" ON public.profiles;

-- Authenticated users can see their own profile AND other public profiles
CREATE POLICY "Authenticated users can view profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() OR visibility = 'public'
);

-- Comment explaining the security model
COMMENT ON POLICY "Authenticated users can view profiles" ON public.profiles IS 
'Authenticated users can see their own profile and public profiles of others. Anonymous users must use discoverable_profiles view which excludes user_id.';