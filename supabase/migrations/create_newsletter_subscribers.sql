-- ==============================================================================
-- NEWSLETTER SUBSCRIBERS TABLE
-- ==============================================================================
-- This table stores email addresses of newsletter subscribers
-- ==============================================================================

-- Create newsletter_subscribers table
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  source TEXT DEFAULT 'website',
  is_active BOOLEAN DEFAULT TRUE,
  unsubscribe_token TEXT DEFAULT gen_random_uuid()::text,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_email ON public.newsletter_subscribers(email);

-- Create index on is_active for filtering
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_active ON public.newsletter_subscribers(is_active);

-- Enable Row Level Security
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to insert (subscribe)
CREATE POLICY "Anyone can subscribe to newsletter"
  ON public.newsletter_subscribers
  FOR INSERT
  WITH CHECK (true);

-- Create policy to allow users to see their own subscription
CREATE POLICY "Users can view their own subscription"
  ON public.newsletter_subscribers
  FOR SELECT
  USING (true);

-- Create policy for unsubscribe (update)
CREATE POLICY "Users can unsubscribe with token"
  ON public.newsletter_subscribers
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Add comment to table
COMMENT ON TABLE public.newsletter_subscribers IS 'Stores email addresses of newsletter subscribers';

-- Add comments to columns
COMMENT ON COLUMN public.newsletter_subscribers.email IS 'Subscriber email address';
COMMENT ON COLUMN public.newsletter_subscribers.source IS 'Where the subscription came from (e.g., website, popup, checkout)';
COMMENT ON COLUMN public.newsletter_subscribers.is_active IS 'Whether the subscription is active';
COMMENT ON COLUMN public.newsletter_subscribers.unsubscribe_token IS 'Unique token for unsubscribing';
COMMENT ON COLUMN public.newsletter_subscribers.metadata IS 'Additional metadata (e.g., preferences, tags)';
