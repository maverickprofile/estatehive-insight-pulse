/* global Deno */

export const watiBaseUrl = Deno.env.get('VITE_WATI_BASE_URL');
export const watiApiKey = Deno.env.get('WATI_API_KEY');
export const watiWebhookSecret = Deno.env.get('WATI_WEBHOOK_SECRET');

if (!watiBaseUrl || !watiApiKey || !watiWebhookSecret) {
  throw new Error('Missing WATI environment variables');
}

export default { watiBaseUrl, watiApiKey, watiWebhookSecret };
