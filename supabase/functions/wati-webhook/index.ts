// Real-time WATI Webhook for receiving WhatsApp messages
// This runs on Supabase Edge Functions for instant message processing

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-wati-signature',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Initialize Supabase client (for database operations)
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Only accept POST requests
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { 
      status: 405, 
      headers: corsHeaders 
    })
  }

  try {
    console.log('📨 WATI Webhook received')
    
    // Parse webhook payload
    const payload = await req.json()
    console.log('Webhook payload:', JSON.stringify(payload, null, 2))

    // Verify webhook signature (optional but recommended)
    const signature = req.headers.get('x-wati-signature')
    if (signature) {
      console.log('Webhook signature:', signature)
      // TODO: Implement signature verification
    }

    // Process the webhook based on event type
    if (payload.eventType === 'message' && payload.data) {
      await processIncomingMessage(payload.data)
    } else {
      console.log('Unhandled webhook event:', payload.eventType)
    }

    return new Response('Webhook processed successfully', {
      status: 200,
      headers: corsHeaders
    })
  } catch (error) {
    console.error('Webhook processing error:', error)
    return new Response('Internal server error', {
      status: 500,
      headers: corsHeaders
    })
  }
})

// Process incoming WhatsApp message
async function processIncomingMessage(messageData: any) {
  try {
    console.log('Processing incoming message:', messageData)

    const phoneNumber = messageData.whatsappNumber || messageData.phoneNumber
    const messageText = messageData.text || messageData.message
    const senderId = messageData.id || messageData.messageId
    const senderName = messageData.sender?.name || messageData.name || `WhatsApp +${phoneNumber}`
    const timestamp = messageData.created || messageData.timestamp || new Date().toISOString()

    if (!phoneNumber || !messageText) {
      console.error('Invalid message data: missing phone number or text')
      return
    }

    // Convert phone number to numeric ID for storage
    const numericPhoneId = parseInt(phoneNumber.toString().replace(/\D/g, ''))

    // Get the first admin user (you might want to make this more sophisticated)
    const { data: users } = await supabase.auth.admin.listUsers()
    if (!users || users.length === 0) {
      console.error('No users found in system')
      return
    }
    const adminUserId = users[0].id

    // Create or get conversation
    let { data: conversation } = await supabase
      .from('conversations')
      .select('*')
      .eq('client_telegram_id', numericPhoneId)
      .single()

    if (!conversation) {
      // Create new conversation
      const { data: newConversation, error: convError } = await supabase
        .from('conversations')
        .insert([{
          user_id: adminUserId,
          client_telegram_id: numericPhoneId,
          client_name: senderName,
          last_message: messageText,
          last_message_at: timestamp,
          unread_count: 1
        }])
        .select()
        .single()

      if (convError) {
        console.error('Error creating conversation:', convError)
        return
      }
      conversation = newConversation
    } else {
      // Update existing conversation
      const { error: updateError } = await supabase
        .from('conversations')
        .update({
          last_message: messageText,
          last_message_at: timestamp,
          unread_count: (conversation.unread_count || 0) + 1
        })
        .eq('id', conversation.id)

      if (updateError) {
        console.error('Error updating conversation:', updateError)
      }
    }

    // Insert the message
    const { error: messageError } = await supabase
      .from('messages')
      .insert([{
        conversation_id: conversation.id,
        sender_id: null, // null indicates client message
        content: messageText,
        sent_at: timestamp,
        is_read: false
      }])

    if (messageError) {
      console.error('Error saving message:', messageError)
      return
    }

    console.log(`✅ Message saved: ${phoneNumber} -> ${messageText}`)

    // Optional: Send push notification or trigger other actions here
    
  } catch (error) {
    console.error('Process message error:', error)
    throw error
  }
}

/* 
WATI Webhook Configuration:
1. In your WATI dashboard, set webhook URL to: 
   https://YOUR_PROJECT_ID.supabase.co/functions/v1/wati-webhook

2. Enable these events:
   - message (for incoming messages)
   - message_status (optional, for delivery status)

3. Expected webhook payload format:
{
  "eventType": "message",
  "instanceId": "your-instance-id",  
  "data": {
    "id": "message-id-123",
    "whatsappNumber": "917259778145",
    "text": "Hello, I need help with property",
    "type": "text",
    "created": "2024-01-20T10:30:00Z",
    "sender": {
      "name": "John Doe",
      "number": "917259778145"
    },
    "messageId": "wamid.xxx"
  }
}
*/