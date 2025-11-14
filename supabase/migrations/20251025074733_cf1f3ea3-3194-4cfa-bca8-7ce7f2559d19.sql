-- Create user_roles table (app_role enum already exists)
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own roles" ON user_roles;
DROP POLICY IF EXISTS "Only system can insert roles" ON user_roles;

-- Users can view their own roles
CREATE POLICY "Users can view own roles"
ON user_roles
FOR SELECT
USING (user_id = auth.uid());

-- Only admins can manage roles (will be enforced via edge functions)
CREATE POLICY "Only system can insert roles"
ON user_roles
FOR INSERT
WITH CHECK (false);

-- Create or replace security definer function to check roles
CREATE OR REPLACE FUNCTION has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

COMMENT ON FUNCTION has_role IS 'Security definer function to check if a user has a specific role. Use this in RLS policies for admin-only tables.';

-- Add database constraints for input validation
-- These are idempotent with IF NOT EXISTS on constraint names

-- Profiles table constraints
DO $$ 
BEGIN
  -- Drop existing constraints if they exist to recreate them
  ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profile_name_length;
  ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profile_bio_length;
  ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profile_niche_length;
  ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profile_handle_length;
  ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profile_display_name_length;
  ALTER TABLE profiles DROP CONSTRAINT IF EXISTS follower_count_positive;
  
  -- Add constraints
  ALTER TABLE profiles ADD CONSTRAINT profile_name_length CHECK (length(name) <= 100);
  ALTER TABLE profiles ADD CONSTRAINT profile_bio_length CHECK (length(bio) <= 500);
  ALTER TABLE profiles ADD CONSTRAINT profile_niche_length CHECK (length(niche) <= 50);
  ALTER TABLE profiles ADD CONSTRAINT profile_handle_length CHECK (length(handle) <= 50);
  ALTER TABLE profiles ADD CONSTRAINT profile_display_name_length CHECK (length(display_name) <= 100);
  ALTER TABLE profiles ADD CONSTRAINT follower_count_positive CHECK (follower_count >= 0);
END $$;

-- Messages table constraints
DO $$
BEGIN
  ALTER TABLE messages DROP CONSTRAINT IF EXISTS message_body_not_empty;
  ALTER TABLE messages DROP CONSTRAINT IF EXISTS message_body_length;
  
  ALTER TABLE messages ADD CONSTRAINT message_body_not_empty CHECK (length(trim(body)) > 0);
  ALTER TABLE messages ADD CONSTRAINT message_body_length CHECK (length(body) <= 5000);
END $$;

-- Collaborations table constraints
DO $$
BEGIN
  ALTER TABLE collaborations DROP CONSTRAINT IF EXISTS collaboration_title_length;
  ALTER TABLE collaborations DROP CONSTRAINT IF EXISTS collaboration_description_length;
  
  ALTER TABLE collaborations ADD CONSTRAINT collaboration_title_length CHECK (length(title) <= 200);
  ALTER TABLE collaborations ADD CONSTRAINT collaboration_description_length CHECK (length(description) <= 2000);
END $$;

-- Collab requests table constraints
DO $$
BEGIN
  ALTER TABLE collab_requests DROP CONSTRAINT IF EXISTS collab_request_title_length;
  ALTER TABLE collab_requests DROP CONSTRAINT IF EXISTS collab_request_description_length;
  ALTER TABLE collab_requests DROP CONSTRAINT IF EXISTS collab_request_category_length;
  ALTER TABLE collab_requests DROP CONSTRAINT IF EXISTS collab_request_location_length;
  
  ALTER TABLE collab_requests ADD CONSTRAINT collab_request_title_length CHECK (length(title) <= 200);
  ALTER TABLE collab_requests ADD CONSTRAINT collab_request_description_length CHECK (length(description) <= 2000);
  ALTER TABLE collab_requests ADD CONSTRAINT collab_request_category_length CHECK (length(category) <= 50);
  ALTER TABLE collab_requests ADD CONSTRAINT collab_request_location_length CHECK (length(location) <= 100);
END $$;

-- Notifications table constraints
DO $$
BEGIN
  ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notification_title_length;
  ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notification_body_length;
  
  ALTER TABLE notifications ADD CONSTRAINT notification_title_length CHECK (length(title) <= 200);
  ALTER TABLE notifications ADD CONSTRAINT notification_body_length CHECK (length(body) <= 1000);
END $$;