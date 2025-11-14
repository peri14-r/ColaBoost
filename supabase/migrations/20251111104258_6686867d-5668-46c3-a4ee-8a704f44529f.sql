-- Create sponsored_posts table for brand promotions
CREATE TABLE public.sponsored_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  link_url TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sponsored_posts ENABLE ROW LEVEL SECURITY;

-- Anyone can view active sponsored posts
CREATE POLICY "Anyone can view active sponsored posts"
ON public.sponsored_posts
FOR SELECT
USING (is_active = true);

-- Only admins can manage sponsored posts (for now, we'll handle this via edge functions)
CREATE POLICY "System can manage sponsored posts"
ON public.sponsored_posts
FOR ALL
USING (false)
WITH CHECK (false);

-- Create profile_boosts table
CREATE TABLE public.profile_boosts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  stripe_payment_intent_id TEXT,
  amount_paid INTEGER NOT NULL DEFAULT 1000,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profile_boosts ENABLE ROW LEVEL SECURITY;

-- Users can view their own boosts
CREATE POLICY "Users can view own boosts"
ON public.profile_boosts
FOR SELECT
USING (user_id = auth.uid());

-- Users can insert their own boosts
CREATE POLICY "Users can create own boosts"
ON public.profile_boosts
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Create index for faster boost lookups
CREATE INDEX idx_profile_boosts_user_dates ON public.profile_boosts(user_id, start_date, end_date);
CREATE INDEX idx_profile_boosts_active ON public.profile_boosts(user_id, end_date) WHERE status = 'active';

-- Create function to check if profile is currently boosted
CREATE OR REPLACE FUNCTION public.is_profile_boosted(profile_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Add updated_at trigger for sponsored_posts
CREATE TRIGGER update_sponsored_posts_updated_at
BEFORE UPDATE ON public.sponsored_posts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some sample sponsored posts
INSERT INTO public.sponsored_posts (title, description, image_url, link_url, display_order, is_active)
VALUES 
  ('Canva Pro', 'Design like a pro with Canva''s premium features', 'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=400', 'https://www.canva.com', 1, true),
  ('Epidemic Sound', 'Unlimited music for your content', 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400', 'https://www.epidemicsound.com', 2, true);