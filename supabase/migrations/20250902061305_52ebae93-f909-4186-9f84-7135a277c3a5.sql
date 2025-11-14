-- CollabSpace Database Schema - Fixed Version

-- Create custom types
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
CREATE TYPE public.visibility_type AS ENUM ('public', 'private');
CREATE TYPE public.request_status AS ENUM ('open', 'in_progress', 'completed', 'closed');
CREATE TYPE public.application_status AS ENUM ('pending', 'accepted', 'rejected');
CREATE TYPE public.subscription_plan AS ENUM ('free', 'pro_monthly', 'pro_yearly');
CREATE TYPE public.subscription_status AS ENUM ('active', 'past_due', 'canceled', 'incomplete');
CREATE TYPE public.payment_status AS ENUM ('paid', 'unpaid', 'refunded');
CREATE TYPE public.notification_type AS ENUM ('message', 'application', 'request_update', 'subscription');

-- Update profiles table with additional fields
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS handle TEXT,
ADD COLUMN IF NOT EXISTS display_name TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS skills TEXT[],
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS platforms JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS visibility visibility_type DEFAULT 'public';

-- Create unique constraint on handle (after adding column)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_handle_key') THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_handle_key UNIQUE (handle);
  END IF;
END $$;

-- Create basic indexes
CREATE INDEX IF NOT EXISTS idx_profiles_niche_followers ON public.profiles(niche, follower_count DESC);

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
CREATE POLICY "Users can view all open requests" ON public.collab_requests
FOR SELECT USING (status = 'open' OR owner_id = auth.uid());

CREATE POLICY "Users can create requests" ON public.collab_requests
FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners can update their requests" ON public.collab_requests
FOR UPDATE USING (owner_id = auth.uid());

-- Create indexes for collab_requests
CREATE INDEX IF NOT EXISTS idx_collab_requests_status_created ON public.collab_requests(status, created_at DESC);

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
CREATE POLICY "Users can view applications for their requests" ON public.applications
FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.collab_requests WHERE id = request_id AND owner_id = auth.uid())
  OR applicant_id = auth.uid()
);

CREATE POLICY "Users can create applications" ON public.applications
FOR INSERT WITH CHECK (applicant_id = auth.uid());

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
CREATE POLICY "Users can view their chats" ON public.chats
FOR SELECT USING (participant_a = auth.uid() OR participant_b = auth.uid());

CREATE POLICY "Users can create chats" ON public.chats
FOR INSERT WITH CHECK (participant_a = auth.uid() OR participant_b = auth.uid());

-- Create messages table
CREATE TABLE IF NOT EXISTS public.messages (
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

-- Create index for messages
CREATE INDEX IF NOT EXISTS idx_messages_chat_created ON public.messages(chat_id, created_at);

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
CREATE POLICY "Users can view their notifications" ON public.notifications
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can create notifications" ON public.notifications
FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their notifications" ON public.notifications
FOR UPDATE USING (user_id = auth.uid());

-- Create index for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON public.notifications(user_id, created_at DESC);

-- Update subscriptions table
ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS plan subscription_plan DEFAULT 'free',
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ;

-- Create payments table
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  currency TEXT DEFAULT 'usd',
  kind TEXT DEFAULT 'subscription',
  stripe_session_id TEXT,
  status payment_status DEFAULT 'unpaid',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Create policies for payments
CREATE POLICY "Users can view their payments" ON public.payments
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can create payments" ON public.payments
FOR INSERT WITH CHECK (true);

-- Create additional tables
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.help_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  location TEXT,
  type TEXT,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL,
  target_id UUID NOT NULL,
  reason TEXT NOT NULL,
  details TEXT,
  resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);