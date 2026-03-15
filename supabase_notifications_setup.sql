-- 0. Fix missing column (just in case they haven't run the other fix)
ALTER TABLE public.todos ADD COLUMN IF NOT EXISTS due_date DATE;

-- 1. Enable pg_net extension (Recommended for Supabase)
CREATE EXTENSION IF NOT EXISTS "pg_net";

-- 2. Create push_subscriptions table
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

-- Policies for push_subscriptions (Wrapped in DO block to avoid errors if exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage their own subscriptions') THEN
        CREATE POLICY "Users can manage their own subscriptions"
            ON public.push_subscriptions
            FOR ALL
            USING (auth.uid() = user_id);
    END IF;
END $$;

-- 3. Setup Database Webhook for Todos
-- This triggers the 'push-notifications' Edge Function via pg_net (asynchronous)

CREATE OR REPLACE FUNCTION public.handle_todo_notification()
RETURNS TRIGGER AS $$
DECLARE
  -- IMPORTANT: Replace YOUR_SERVICE_ROLE_KEY with your actual service_role key
  -- Find it in Supabase Dashboard > Project Settings > API
  service_role_key TEXT := 'YOUR_SERVICE_ROLE_KEY';
  project_id TEXT := 'oesmmhuiygrrgwvdgymj';
BEGIN
  -- Trigger on INSERT or status updates to 'completed'
  IF (TG_OP = 'INSERT') OR (TG_OP = 'UPDATE' AND OLD.status = 'pending' AND NEW.status = 'completed') THEN
    PERFORM
      net.http_post(
        url := 'https://' || project_id || '.supabase.co/functions/v1/push-notifications',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || service_role_key
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

-- Create the trigger
DROP TRIGGER IF EXISTS on_todo_change ON public.todos;
CREATE TRIGGER on_todo_change
  AFTER INSERT OR UPDATE ON public.todos
  FOR EACH ROW EXECUTE FUNCTION public.handle_todo_notification();

-- 4. Setup Reminders (Optional - Scheduled Job)
-- Requires pg_cron extension
CREATE EXTENSION IF NOT EXISTS "pg_cron";

-- Function to find and notify for upcoming tasks
CREATE OR REPLACE FUNCTION public.check_todo_reminders()
RETURNS void AS $$
DECLARE
  service_role_key TEXT := 'YOUR_SERVICE_ROLE_KEY';
  project_id TEXT := 'oesmmhuiygrrgwvdgymj';
BEGIN
  -- Notify for tasks due in 1 day
  PERFORM
    net.http_post(
      url := 'https://' || project_id || '.supabase.co/functions/v1/push-notifications',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || service_role_key
      ),
      body := jsonb_build_object(
        'type', 'REMINDER',
        'reminder_type', '1d'
      )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule the job (Daily at 8:00 AM)
-- Note: Replace 'todo-reminders-8am' if you need multiple
SELECT cron.schedule('todo-reminders-8am', '0 8 * * *', 'SELECT public.check_todo_reminders()');
