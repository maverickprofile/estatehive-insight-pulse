/* global Deno */

export const watiBaseUrl = Deno.env.get('VITE_WATI_BASE_URL');
export const watiApiKey = Deno.env.get('WATI_API_KEY');

if (!watiBaseUrl || !watiApiKey) {
  throw new Error('Missing WATI environment variables');
}

export default { watiBaseUrl, watiApiKey };
