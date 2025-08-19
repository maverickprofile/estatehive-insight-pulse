// WATI Webhook Handler for receiving messages from clients
// This handles incoming messages sent to your WATI business number +15557735226
// from clients like 917259778145

import { createWatiIntegration } from '../lib/watiIntegration'

// Webhook endpoint for WATI to send incoming messages
// You'll need to configure this URL in your WATI dashboard
export async function handleWatiWebhook(request: Request): Promise<Response> {
  try {
    // Verify the request method
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 })
    }

    // Parse the webhook payload from WATI
    const payload = await request.json()
    console.log('Received WATI webhook:', payload)

    // Verify webhook signature (optional but recommended for security)
    // const signature = request.headers.get('x-wati-signature')
    // if (!verifyWatiSignature(payload, signature)) {
    //   return new Response('Invalid signature', { status: 401 })
    // }

    // Process the webhook
    const watiIntegration = createWatiIntegration()
    await watiIntegration.handleWebhook(payload)

    return new Response('Webhook processed successfully', { status: 200 })
  } catch (error) {
    console.error('Webhook processing error:', error)
    return new Response('Internal server error', { status: 500 })
  }
}

// Example webhook payload structure from WATI:
/*
{
  "eventType": "message",
  "instanceId": "your-instance-id",
  "data": {
    "id": "message-id-123",
    "whatsappNumber": "917259778145",
    "text": "Hello, I'm interested in your property",
    "type": "text",
    "created": "2024-01-20T10:30:00Z",
    "sender": {
      "name": "John Doe",
      "number": "917259778145"
    },
    "messageId": "wamid.xxx",
    "timestamp": 1642680600
  }
}
*/

// Utility function for webhook signature verification (optional)
function verifyWatiSignature(payload: any, signature: string | null): boolean {
  if (!signature) return false
  
  // Implement signature verification logic based on WATI documentation
  // This typically involves creating a hash of the payload using your webhook secret
  
  return true // Simplified for now
}

// If you're using Next.js, you can export this as an API route:
/*
// pages/api/wati-webhook.ts or app/api/wati-webhook/route.ts
export default async function handler(req: Request) {
  return handleWatiWebhook(req)
}
*/