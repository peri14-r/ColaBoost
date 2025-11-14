-- Fix critical security vulnerability: Prevent fake system notifications
-- Current policy allows ANYONE to create notifications with "true" condition

-- Drop the insecure policy that allows anyone to create notifications
DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;

-- Create a security definer function to handle notification creation
-- Only this function can insert notifications, preventing direct user access
CREATE OR REPLACE FUNCTION public.create_notification(
  target_user_id uuid,
  notification_type notification_type,
  notification_title text,
  notification_body text DEFAULT NULL,
  notification_link text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  notification_id uuid;
BEGIN
  -- Validate inputs
  IF target_user_id IS NULL OR notification_type IS NULL OR notification_title IS NULL THEN
    RAISE EXCEPTION 'target_user_id, notification_type, and notification_title are required';
  END IF;
  
  -- Insert the notification
  INSERT INTO public.notifications (user_id, type, title, body, link)
  VALUES (target_user_id, notification_type, notification_title, notification_body, notification_link)
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$;

-- Create a restrictive policy that only allows the security definer function to insert
-- No direct user insertions allowed
CREATE POLICY "Only system functions can create notifications"
ON public.notifications
FOR INSERT
WITH CHECK (false); -- Prevents all direct insertions, only security definer functions can insert

-- Grant execute permission to authenticated users so they can call system functions that use this
GRANT EXECUTE ON FUNCTION public.create_notification TO authenticated;

-- Add comment explaining the security model
COMMENT ON FUNCTION public.create_notification IS 'Security definer function for creating system notifications. Only this function can insert notifications to prevent fake notifications.';