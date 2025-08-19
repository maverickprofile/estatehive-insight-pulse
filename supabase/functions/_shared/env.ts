/* global Deno */

export const watiBaseUrl = Deno.env.get('VITE_WATI_BASE_URL') || Deno.env.get('WATI_BASE_URL');
export const watiApiKey = Deno.env.get('WATI_API_KEY') || Deno.env.get('VITE_WATI_API_KEY');
export const watiWebhookSecret = Deno.env.get('WATI_WEBHOOK_SECRET') || Deno.env.get('VITE_WATI_WEBHOOK_SECRET');

// Only validate when actually used
export function validateWatiConfig() {
  if (!watiBaseUrl || !watiApiKey) {
    throw new Error('Missing WATI environment variables: WATI_BASE_URL and WATI_API_KEY are required');
  }
}

export default { watiBaseUrl, watiApiKey, watiWebhookSecret, validateWatiConfig };
