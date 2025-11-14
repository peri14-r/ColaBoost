-- Fix search_path for is_profile_boosted function
CREATE OR REPLACE FUNCTION public.is_profile_boosted(profile_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.profile_boosts
    WHERE user_id = profile_user_id
      AND status = 'active'
      AND now() BETWEEN start_date AND end_date
  );
END;
$$;