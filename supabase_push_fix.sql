-- Create push_subscriptions table
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- Storage bucket for todo photos (This usually needs to be done in Supabase UI or via API)
-- But we can define the policies here.
-- Note: Ensure the bucket 'todo-photos' exists in the Supabase Storage dashboard.

CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'todo-photos' );

CREATE POLICY "Authenticated users can upload photos"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'todo-photos' AND
    auth.role() = 'authenticated'
);

CREATE POLICY "Users can delete their own photos"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'todo-photos' AND
    (select auth.uid()) = owner
);

-- Add trigger to call Edge Function for PUSH
-- Note: Replace with your actual Edge Function URL once deployed.

CREATE OR REPLACE FUNCTION public.handle_todo_push()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM
    net.http_post(
      url := 'https://oesmmhuiygrrgwvdgymj.functions.supabase.co/push-notifications',
      headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || auth.uid()),
      body := jsonb_build_object(
        'record', row_to_json(NEW),
        'table', 'todos',
        'type', TG_OP
      )
    );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_todo_change
  AFTER INSERT OR UPDATE ON public.todos
  FOR EACH ROW EXECUTE FUNCTION public.handle_todo_push();
