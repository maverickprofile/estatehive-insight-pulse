// Send Telegram Message Edge Function
// Handles sending messages from CRM to Telegram users

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
    // Get the authorization header to identify the user
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return new Response('Unauthorized', { 
        status: 401, 
        headers: corsHeaders 
      })
    }

    // Verify the user
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return new Response('Unauthorized', { 
        status: 401, 
        headers: corsHeaders 
      })
    }

    // Parse request body
    const { chatId, conversationId, message, parseMode = 'HTML' } = await req.json()

    if (!message) {
      return new Response('Message is required', { 
        status: 400, 
        headers: corsHeaders 
      })
    }

    let telegramChatId = chatId

    // If conversationId is provided, get the chat ID from the database
    if (!telegramChatId && conversationId) {
      const { data: conversation } = await supabase
        .from('conversations')
        .select('telegram_chat_id')
        .eq('id', conversationId)
        .single()

      if (!conversation || !conversation.telegram_chat_id) {
        return new Response('Conversation not found or not a Telegram conversation', { 
          status: 404, 
          headers: corsHeaders 
        })
      }

      telegramChatId = conversation.telegram_chat_id
    }

    if (!telegramChatId) {
      return new Response('Chat ID or Conversation ID is required', { 
        status: 400, 
        headers: corsHeaders 
      })
    }

    // Send message via Telegram Bot API
    const telegramResponse = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: telegramChatId,
          text: message,
          parse_mode: parseMode
        })
      }
    )

    const telegramResult = await telegramResponse.json()

    if (!telegramResponse.ok || !telegramResult.ok) {
      console.error('Telegram API error:', telegramResult)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: telegramResult.description || 'Failed to send message' 
        }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Save the sent message to database if conversationId provided
    if (conversationId) {
      const timestamp = new Date().toISOString()

      // Save message to database
      const { error: messageError } = await supabase
        .from('messages')
        .insert([{
          conversation_id: conversationId,
          sender_id: user.id, // Agent message
          content: message,
          sent_at: timestamp,
          is_read: true // Agent messages are automatically read
        }])

      if (messageError) {
        console.error('Error saving message to database:', messageError)
      }

      // Update conversation's last message
      const { error: updateError } = await supabase
        .from('conversations')
        .update({
          last_message: message,
          last_message_at: timestamp
        })
        .eq('id', conversationId)

      if (updateError) {
        console.error('Error updating conversation:', updateError)
      }
    }

    console.log(`✅ Telegram message sent to chat ${telegramChatId}`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: telegramResult.result.message_id,
        chatId: telegramChatId
      }), 
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Send message error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Internal server error' 
      }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

/* 
Usage from frontend:

const response = await fetch('https://mtjxfyzcuuvtplemliwe.supabase.co/functions/v1/send-telegram-message', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session.access_token}`
  },
  body: JSON.stringify({
    conversationId: 123, // Or use chatId directly
    message: 'Hello from Estate Hive CRM!'
  })
})

const result = await response.json()
if (result.success) {
  console.log('Message sent successfully')
}
*/