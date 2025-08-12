-- Create conversations table to store chat metadata
CREATE TABLE public.conversations (
  id text PRIMARY KEY,
  name text,
  phone text,
  avatar text,
  last_message text,
  updated_at timestamptz DEFAULT now(),
  unread_count integer DEFAULT 0
);

-- Link messages to conversations
ALTER TABLE public.messages
  ADD CONSTRAINT messages_conversation_id_fkey
  FOREIGN KEY (conversation_id)
  REFERENCES public.conversations(id)
  ON DELETE CASCADE;

-- Helpful index for ordering by most recent conversation
CREATE INDEX conversations_updated_at_idx
  ON public.conversations (updated_at DESC);
