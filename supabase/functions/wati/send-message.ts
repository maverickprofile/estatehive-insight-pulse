import watiClient from '../_shared/watiClient.ts';
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      {
        status: 405,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }

  try {
    const { phone, message } = await req.json();

    if (
      typeof phone !== 'string' ||
      typeof message !== 'string' ||
      !phone.trim() ||
      !message.trim()
    ) {
      return new Response(
        JSON.stringify({ error: 'phone and message are required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    const result = await watiClient.sendWhatsAppMessage(phone, message);

    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
});
