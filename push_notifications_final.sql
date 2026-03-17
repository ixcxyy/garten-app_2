-- FINAL PUSH NOTIFICATIONS SETUP
-- Run this in your Supabase SQL Editor

-- 1. Ensure extensions
CREATE EXTENSION IF NOT EXISTS "pg_net";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Clean up old table/trigger if they exist in a broken state
-- (Optional: only if you want a fresh start, otherwise ignore)
-- DROP TRIGGER IF EXISTS on_todo_change ON public.todos;
-- DROP FUNCTION IF EXISTS public.handle_todo_notification();

-- 3. Push Subscriptions Table
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, endpoint)
);

-- Enable RLS
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policies
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage their own subscriptions') THEN
        CREATE POLICY "Users can manage their own subscriptions"
            ON public.push_subscriptions
            FOR ALL
            USING (auth.uid() = user_id);
    END IF;
END $$;

-- 4. Trigger Function for Todos
CREATE OR REPLACE FUNCTION public.handle_todo_notification()
RETURNS TRIGGER AS $$
DECLARE
  -- Replace with your actual project ID if different
  project_id TEXT := 'oesmmhuiygrrgwvdgymj';
  -- Use the service_role key for internal function calls if possible,
  -- or ensure the function allows calls with the service_role header.
  -- In Supabase, 'vault.service_role_key' usually needs manual setup.
  -- For now, we use a placeholder or assume the function is accessible via net.http_post.
BEGIN
  -- Trigger on INSERT or status updates to 'completed'
  IF (TG_OP = 'INSERT') OR (TG_OP = 'UPDATE' AND OLD.status = 'pending' AND NEW.status = 'completed') THEN
    PERFORM
      net.http_post(
        url := 'https://' || project_id || '.supabase.co/functions/v1/push-notifications',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('vault.service_role_key', true)
        ),
        body := jsonb_build_object(
          'record', row_to_json(NEW),
          'old_record', CASE WHEN TG_OP = 'UPDATE' THEN row_to_json(OLD) ELSE NULL END,
          'type', TG_OP,
          'table', TG_TABLE_NAME
        )
      );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Re-create Trigger
DROP TRIGGER IF EXISTS on_todo_change ON public.todos;
CREATE TRIGGER on_todo_change
  AFTER INSERT OR UPDATE ON public.todos
  FOR EACH ROW EXECUTE FUNCTION public.handle_todo_notification();

-- NOTE: If you haven't set 'vault.service_role_key', 
-- you might need to enable it or use a different auth method for the Edge Function.
-- You can set it via:
-- select vault.create_secret('YOUR_SERVICE_ROLE_KEY', 'service_role_key');
