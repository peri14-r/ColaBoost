-- Fix critical security vulnerability: Replace overly permissive profile access policy
-- This policy currently allows ANYONE to view ALL profiles with "true" condition

-- First, drop the existing insecure policy
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Create secure policies that respect privacy settings and authentication
-- 1. Users can always view their own profile
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (user_id = auth.uid());

-- 2. Authenticated users can view profiles marked as public
CREATE POLICY "Authenticated users can view public profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (visibility = 'public'::visibility_type);

-- 3. Anonymous users can only view profiles explicitly marked as public
-- This is more restrictive and requires authentication for most profile access
CREATE POLICY "Anonymous users can view public profiles only" 
ON public.profiles 
FOR SELECT 
TO anon
USING (visibility = 'public'::visibility_type AND visibility IS NOT NULL);

-- Add index for better performance on visibility queries
CREATE INDEX IF NOT EXISTS idx_profiles_visibility ON public.profiles(visibility);