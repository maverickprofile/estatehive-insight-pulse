-- Update messages schema to use sender_id and add basic policies
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS sender_id text;
ALTER TABLE public.messages
  DROP COLUMN IF EXISTS sender;

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Messages are viewable by authenticated users"
  ON public.messages FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert messages"
  ON public.messages FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Conversations are viewable by authenticated users"
  ON public.conversations FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert conversations"
  ON public.conversations FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');
