-- Drop existing conflicting tables to rebuild with new structure
DROP TABLE IF EXISTS public.messages CASCADE;

-- Create custom types if they don't exist
DO $$ 
BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ 
BEGIN
  CREATE TYPE public.visibility_type AS ENUM ('public', 'private');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ 
BEGIN
  CREATE TYPE public.request_status AS ENUM ('open', 'in_progress', 'completed', 'closed');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ 
BEGIN
  CREATE TYPE public.application_status AS ENUM ('pending', 'accepted', 'rejected');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ 
BEGIN
  CREATE TYPE public.subscription_plan AS ENUM ('free', 'pro_monthly', 'pro_yearly');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ 
BEGIN
  CREATE TYPE public.subscription_status AS ENUM ('active', 'past_due', 'canceled', 'incomplete');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ 
BEGIN
  CREATE TYPE public.payment_status AS ENUM ('paid', 'unpaid', 'refunded');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ 
BEGIN
  CREATE TYPE public.notification_type AS ENUM ('message', 'application', 'request_update', 'subscription');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Update profiles table with new fields
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS handle TEXT,
ADD COLUMN IF NOT EXISTS display_name TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS skills TEXT[],
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS platforms JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS visibility visibility_type DEFAULT 'public';

-- Add unique constraint on handle if it doesn't exist
DO $$ 
BEGIN
  ALTER TABLE public.profiles ADD CONSTRAINT profiles_handle_unique UNIQUE (handle);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Create collab_requests table
CREATE TABLE IF NOT EXISTS public.collab_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  tags TEXT[],
  budget INTEGER,
  status request_status DEFAULT 'open',
  location TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.collab_requests ENABLE ROW LEVEL SECURITY;

-- Create policies for collab_requests
DROP POLICY IF EXISTS "Users can view all open requests" ON public.collab_requests;
CREATE POLICY "Users can view all open requests" ON public.collab_requests
FOR SELECT USING (status = 'open' OR owner_id = auth.uid());

DROP POLICY IF EXISTS "Users can create requests" ON public.collab_requests;
CREATE POLICY "Users can create requests" ON public.collab_requests
FOR INSERT WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "Owners can update their requests" ON public.collab_requests;
CREATE POLICY "Owners can update their requests" ON public.collab_requests
FOR UPDATE USING (owner_id = auth.uid());

-- Create applications table
CREATE TABLE IF NOT EXISTS public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.collab_requests(id) ON DELETE CASCADE,
  applicant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT,
  status application_status DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(request_id, applicant_id)
);

ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- Create policies for applications
DROP POLICY IF EXISTS "Users can view applications for their requests" ON public.applications;
CREATE POLICY "Users can view applications for their requests" ON public.applications
FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.collab_requests WHERE id = request_id AND owner_id = auth.uid())
  OR applicant_id = auth.uid()
);

DROP POLICY IF EXISTS "Users can create applications" ON public.applications;
CREATE POLICY "Users can create applications" ON public.applications
FOR INSERT WITH CHECK (applicant_id = auth.uid());

DROP POLICY IF EXISTS "Request owners can update applications" ON public.applications;
CREATE POLICY "Request owners can update applications" ON public.applications
FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.collab_requests WHERE id = request_id AND owner_id = auth.uid())
);

-- Create chats table
CREATE TABLE IF NOT EXISTS public.chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_a UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  participant_b UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (participant_a != participant_b),
  UNIQUE(participant_a, participant_b)
);

ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;

-- Create policies for chats
DROP POLICY IF EXISTS "Users can view their chats" ON public.chats;
CREATE POLICY "Users can view their chats" ON public.chats
FOR SELECT USING (participant_a = auth.uid() OR participant_b = auth.uid());

DROP POLICY IF EXISTS "Users can create chats" ON public.chats;
CREATE POLICY "Users can create chats" ON public.chats
FOR INSERT WITH CHECK (participant_a = auth.uid() OR participant_b = auth.uid());

-- Create new messages table with correct structure
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  attachment_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  read_at TIMESTAMPTZ
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Create policies for messages
CREATE POLICY "Chat participants can view messages" ON public.messages
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.chats 
    WHERE id = chat_id AND (participant_a = auth.uid() OR participant_b = auth.uid())
  )
);

CREATE POLICY "Chat participants can send messages" ON public.messages
FOR INSERT WITH CHECK (
  sender_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.chats 
    WHERE id = chat_id AND (participant_a = auth.uid() OR participant_b = auth.uid())
  )
);

CREATE POLICY "Users can update their own messages" ON public.messages
FOR UPDATE USING (sender_id = auth.uid());

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  link TEXT,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create policies for notifications
DROP POLICY IF EXISTS "Users can view their notifications" ON public.notifications;
CREATE POLICY "Users can view their notifications" ON public.notifications
FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;
CREATE POLICY "System can create notifications" ON public.notifications
FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update their notifications" ON public.notifications;
CREATE POLICY "Users can update their notifications" ON public.notifications
FOR UPDATE USING (user_id = auth.uid());

-- Update subscriptions table
ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS plan subscription_plan DEFAULT 'free',
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ;

-- Create basic indexes
CREATE INDEX IF NOT EXISTS idx_profiles_niche_followers ON public.profiles(niche, follower_count DESC);
CREATE INDEX IF NOT EXISTS idx_collab_requests_status_created ON public.collab_requests(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_chat_created ON public.messages(chat_id, created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON public.notifications(user_id, created_at DESC);