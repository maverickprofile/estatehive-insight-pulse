/* global Deno */
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { watiWebhookSecret } from '../_shared/env.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

function hexToUint8Array(hex: string): Uint8Array {
  if (hex.length % 2 !== 0) {
    throw new Error('Invalid hex string');
  }
  const arr = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    arr[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return arr;
}

async function verifySignature(payload: string, signature: string, secret: string) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
  try {
    return await crypto.subtle.verify(
      'HMAC',
      key,
      hexToUint8Array(signature),
      encoder.encode(payload),
    );
  } catch (_) {
    return false;
  }
}

serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const signature = req.headers.get('x-wati-signature') ?? '';
  const bodyText = await req.text();

  const isValid = await verifySignature(bodyText, signature, watiWebhookSecret!);
  if (!isValid) {
    return new Response(
      JSON.stringify({ error: 'Invalid signature' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } },
    );
  }

  interface WatiMessage {
    conversation_id?: string;
    conversationId?: string;
    conversation?: { id?: string };
    sender?: string;
    from?: string;
    waId?: string;
    body?: string;
    text?: { body?: string } | string;
    message?: string;
    timestamp?: number | string;
    [key: string]: unknown;
  }

  interface WatiPayload {
    message?: WatiMessage;
    messages?: WatiMessage[];
    text?: string;
    timestamp?: number | string;
    [key: string]: unknown;
  }

  let payload: WatiPayload;
  try {
    payload = JSON.parse(bodyText) as WatiPayload;
  } catch (_) {
    return new Response(
      JSON.stringify({ error: 'Invalid JSON payload' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const message: WatiMessage =
    payload.message ?? payload.messages?.[0] ?? (payload as WatiMessage);

  const conversation_id =
    message.conversation_id ??
    message.conversationId ??
    message.conversation?.id;
  const sender = message.sender ?? message.from ?? message.waId;
  const body =
    typeof message.text === 'object'
      ? message.text.body
      : message.text ?? message.body ?? message.message ?? payload.text;
  const timestamp = message.timestamp ?? payload.timestamp ?? Date.now();

  if (!conversation_id || !sender || !body || !timestamp) {
    return new Response(
      JSON.stringify({ error: 'Missing message fields' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const { error } = await supabase.from('messages').insert({
    conversation_id,
    sender,
    body,
    timestamp: new Date(timestamp).toISOString(),
  });

  if (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
});

