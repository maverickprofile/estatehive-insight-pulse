-- Enable Realtime for messages table
ALTER TABLE public.messages REPLICA IDENTITY FULL;
CREATE PUBLICATION IF NOT EXISTS supabase_realtime;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
