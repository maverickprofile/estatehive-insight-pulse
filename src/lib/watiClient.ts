import { watiBaseUrl, watiApiKey } from './env';

export async function sendWhatsAppMessage(recipient: string, text: string) {
  const response = await fetch(`${watiBaseUrl}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: watiApiKey,
    },
    body: JSON.stringify({ recipient, text }),
  });

  if (!response.ok) {
    throw new Error(`WATI API request failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

export default { sendWhatsAppMessage };
