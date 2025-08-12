import { watiBaseUrl, watiApiKey } from './env.ts';

export async function sendWhatsAppMessage(recipient: string, text: string) {
  const response = await fetch(`${watiBaseUrl}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: watiApiKey!,
    },
    body: JSON.stringify({ recipient, text }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `WATI API request failed: ${response.status} ${response.statusText}: ${errorText}`,
    );
  }

  return response.json();
}

export default { sendWhatsAppMessage };
