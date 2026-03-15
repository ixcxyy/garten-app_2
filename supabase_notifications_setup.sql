-- 1. Create push_subscriptions table (Standard if not already present)
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL UNIQUE,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policies for push_subscriptions
CREATE POLICY "Users can manage their own subscriptions"
    ON public.push_subscriptions
    FOR ALL
    USING (auth.uid() = user_id);

-- 2. Setup Database Webhook for Todos
-- This triggers the 'push-notifications' Edge Function on INSERT and UPDATE (status change)

-- First, ensure the net extension is enabled for HTTP requests
CREATE EXTENSION IF NOT EXISTS "http" WITH SCHEMA "extensions";

-- Function to trigger notification via Edge Function
CREATE OR REPLACE FUNCTION public.handle_todo_notification()
RETURNS TRIGGER AS $$
DECLARE
  service_role_key TEXT := 'YOUR_SERVICE_ROLE_KEY'; -- REPLACE THIS WITH YOUR ACTUAL SERVICE ROLE KEY
  project_id TEXT := 'oesmmhuiygrrgwvdgymj'; -- Your project ID
BEGIN
  -- We only care about INSERT or status updates to 'completed'
  IF (TG_OP = 'INSERT') OR (TG_OP = 'UPDATE' AND OLD.status = 'pending' AND NEW.status = 'completed') THEN
    PERFORM
      extensions.http_post(
        url := 'https://' || project_id || '.supabase.co/functions/v1/push-notifications',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || service_role_key
        ),
        payload := jsonb_build_object(
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

-- Create the trigger
DROP TRIGGER IF EXISTS on_todo_change ON public.todos;
CREATE TRIGGER on_todo_change
  AFTER INSERT OR UPDATE ON public.todos
  FOR EACH ROW EXECUTE FUNCTION public.handle_todo_notification();

-- 3. Setup Reminders (Scheduled Job)
-- This uses pg_cron to check for upcoming tasks every morning

CREATE EXTENSION IF NOT EXISTS "pg_cron";

-- Function to find and notify for upcoming tasks
-- In a real app, this would iterate through users and their subscriptions
-- For simplicity, we trigger the Edge Function with a special payload
CREATE OR REPLACE FUNCTION public.check_todo_reminders()
RETURNS void AS $$
BEGIN
  -- Notify for tasks due in 1 day
  PERFORM
    extensions.http_post(
      url := 'https://' ||'oesmmhuiygrrgwvdgymj' || '.supabase.co/functions/v1/push-notifications',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb,
      payload := jsonb_build_object(
        'type', 'REMINDER',
        'reminder_type', '1d'
      )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule the job (Daily at 8:00 AM)
SELECT cron.schedule('todo-reminders-8am', '0 8 * * *', 'SELECT public.check_todo_reminders()');
