// Telegram Webhook Handler for receiving messages
// This handles incoming messages from the Telegram Bot API

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Telegram Bot Token
const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN') || '8395864876:AAGp4QSunYOlLAUGLjquk_ECrMME83eTtq4'

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
    console.log('📨 Telegram Webhook received')
    
    // Parse webhook payload
    const update = await req.json()
    console.log('Telegram update:', JSON.stringify(update, null, 2))

    // Handle different update types
    if (update.message) {
      await handleMessage(update.message)
    } else if (update.edited_message) {
      // Handle edited messages if needed
      console.log('Edited message received, skipping...')
    } else if (update.callback_query) {
      // Handle callback queries from inline keyboards if needed
      console.log('Callback query received, skipping...')
    }

    return new Response('OK', {
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

// Process incoming Telegram message
async function handleMessage(message: any) {
  try {
    console.log('Processing Telegram message:', message)

    // Extract message details
    const chatId = message.chat.id
    const messageText = message.text || message.caption || ''
    const senderUsername = message.from.username || message.from.first_name || 'Unknown'
    const senderFullName = `${message.from.first_name || ''} ${message.from.last_name || ''}`.trim()
    const timestamp = new Date(message.date * 1000).toISOString()

    if (!messageText) {
      console.log('No text content in message, skipping...')
      return
    }

    // Get the first admin user (you might want to make this more sophisticated)
    const { data: users } = await supabase.auth.admin.listUsers()
    if (!users || users.users.length === 0) {
      console.error('No users found in system')
      return
    }
    const adminUserId = users.users[0].id

    // Check if conversation exists
    let { data: conversation } = await supabase
      .from('conversations')
      .select('*')
      .eq('telegram_chat_id', chatId)
      .eq('platform', 'telegram')
      .single()

    if (!conversation) {
      // Create new conversation
      const { data: newConversation, error: convError } = await supabase
        .from('conversations')
        .insert([{
          user_id: adminUserId,
          client_telegram_id: Math.abs(chatId), // Use absolute value for compatibility
          telegram_chat_id: chatId,
          telegram_username: senderUsername,
          client_name: senderFullName || senderUsername,
          platform: 'telegram',
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
          unread_count: (conversation.unread_count || 0) + 1,
          telegram_username: senderUsername // Update username in case it changed
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

    console.log(`✅ Telegram message saved from @${senderUsername}: ${messageText}`)

    // Optional: Send automatic acknowledgment
    if (message.chat.type === 'private') {
      // Only send auto-reply for private chats, not groups
      await sendTypingAction(chatId)
    }
    
  } catch (error) {
    console.error('Process message error:', error)
    throw error
  }
}

// Send typing indicator to show bot is processing
async function sendTypingAction(chatId: number) {
  try {
    const response = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendChatAction`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          action: 'typing'
        })
      }
    )
    
    if (!response.ok) {
      console.error('Failed to send typing action:', await response.text())
    }
  } catch (error) {
    console.error('Error sending typing action:', error)
  }
}

/* 
Telegram Webhook Setup:
1. Deploy this function to Supabase
2. Set the webhook URL using this command:
   curl -X POST "https://api.telegram.org/bot8395864876:AAGp4QSunYOlLAUGLjquk_ECrMME83eTtq4/setWebhook" \
   -H "Content-Type: application/json" \
   -d '{"url": "https://mtjxfyzcuuvtplemliwe.supabase.co/functions/v1/telegram-webhook"}'

3. Verify webhook is set:
   curl "https://api.telegram.org/bot8395864876:AAGp4QSunYOlLAUGLjquk_ECrMME83eTtq4/getWebhookInfo"

Expected Telegram Update Format:
{
  "update_id": 123456789,
  "message": {
    "message_id": 1,
    "from": {
      "id": 12345678,
      "is_bot": false,
      "first_name": "John",
      "last_name": "Doe",
      "username": "johndoe"
    },
    "chat": {
      "id": 12345678,
      "first_name": "John",
      "last_name": "Doe",
      "username": "johndoe",
      "type": "private"
    },
    "date": 1642680600,
    "text": "Hello, I'm interested in properties"
  }
}
*/