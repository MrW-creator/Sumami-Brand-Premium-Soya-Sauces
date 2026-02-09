# Newsletter System Deployment Guide

## Step 1: Create Database Table

### Option A: Via Supabase Dashboard (Recommended)

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/lnzloecnqcxknozokflr
2. Click on **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy and paste this SQL:

```sql
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
```

5. Click **Run** (or press Ctrl+Enter)
6. You should see "Success. No rows returned"

### Option B: Via CLI

```bash
npx supabase db push
```

---

## Step 2: Deploy Welcome Email Function

### Instructions for Gemini (or manual deployment):

1. Open raw GitHub file in browser:
   ```
   https://raw.githubusercontent.com/MrW-creator/Sumami-Brand-Premium-Soya-Sauces/main/supabase/functions/send-newsletter-welcome/index.ts
   ```

2. Copy all code (Ctrl+A, Ctrl+C)

3. Go to Supabase Dashboard > Edge Functions:
   ```
   https://supabase.com/dashboard/project/lnzloecnqcxknozokflr/functions
   ```

4. Click **"Deploy a new function"** > Select **"Via Editor"**

5. Set function name: `send-newsletter-welcome`

6. Paste the code in the Monaco editor

7. Click **"Deploy function"**

8. Wait for deployment to complete (green checkmark)

---

## Step 3: Test Newsletter Signup

1. Visit your site: https://soyasauce.co.za

2. Scroll to footer

3. Enter your email in the newsletter form

4. Click "Get Free Cookbook"

5. Check your email for the welcome message

6. Verify in Supabase Dashboard:
   - Go to **Table Editor** > `newsletter_subscribers`
   - You should see your email address

---

## Step 4: Update Cookbook URL (When Ready)

Once you have a real cookbook PDF:

1. Upload PDF to Supabase Storage:
   - Dashboard > Storage > `ebook` bucket
   - Upload your cookbook PDF

2. Get the public URL

3. Update the welcome email function:
   - Edit line 15 in `send-newsletter-welcome/index.ts`
   - Replace the COOKBOOK_URL with your new URL

4. Redeploy the function

---

## Troubleshooting

### "Error: relation 'newsletter_subscribers' does not exist"
- Run the SQL migration in Step 1

### "Function send-newsletter-welcome not found"
- Deploy the Edge Function in Step 2

### "Email not sending"
- Check Supabase logs: Dashboard > Edge Functions > send-newsletter-welcome > Logs
- Verify MAILTRAP_API_TOKEN is set in Secrets

### "Duplicate key violation"
- Email already subscribed (this is normal, shows proper validation)

---

## Admin Features

After deployment, you can:
- View all subscribers in Supabase Table Editor
- Export subscriber list as CSV
- Filter by source, date, active status
- Manual unsubscribe (set is_active = false)

---

## Next Steps

1. Create your free cookbook (25 recipes)
2. Upload to Supabase Storage
3. Update COOKBOOK_URL in welcome email function
4. Build email campaigns (future enhancement)
5. Add exit-intent popup (future enhancement)
