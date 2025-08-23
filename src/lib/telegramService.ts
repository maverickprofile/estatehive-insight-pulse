// Telegram Service for handling Telegram messaging in the CRM
import { supabase } from './supabaseClient'

export interface TelegramMessage {
  id: number
  conversation_id: number
  sender_id: string | null // null for client messages, UUID for agent messages
  content: string
  sent_at: string
  is_read: boolean
}

export interface TelegramConversation {
  id: number
  user_id: string
  client_telegram_id: number
  telegram_chat_id: number
  telegram_username: string | null
  client_name: string | null
  last_message: string | null
  last_message_at: string | null
  unread_count: number
  platform: 'telegram'
  messages?: TelegramMessage[]
}

export class TelegramService {
  // Get all Telegram conversations for the current user
  static async getConversations(): Promise<TelegramConversation[]> {
    try {
      const { data: conversations, error } = await supabase
        .from('conversations')
        .select(`
          id,
          user_id,
          client_telegram_id,
          telegram_chat_id,
          telegram_username,
          client_name,
          last_message,
          last_message_at,
          unread_count,
          platform
        `)
        .eq('platform', 'telegram')
        .order('last_message_at', { ascending: false })

      if (error) {
        console.error('Error fetching Telegram conversations:', error)
        throw error
      }

      return conversations || []
    } catch (error) {
      console.error('Failed to fetch Telegram conversations:', error)
      throw error
    }
  }

  // Get messages for a specific Telegram conversation
  static async getMessages(conversationId: number): Promise<TelegramMessage[]> {
    try {
      const { data: messages, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('sent_at', { ascending: true })

      if (error) {
        console.error('Error fetching Telegram messages:', error)
        throw error
      }

      return messages || []
    } catch (error) {
      console.error('Failed to fetch Telegram messages:', error)
      throw error
    }
  }

  // Send a message via Telegram
  static async sendMessage(conversationId: number, content: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        throw new Error('User not authenticated')
      }

      // Call the edge function to send the message
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-telegram-message`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({
            conversationId,
            message: content
          })
        }
      )

      const result = await response.json()

      if (!response.ok || !result.success) {
        console.error('Failed to send Telegram message:', result.error)
        return { success: false, error: result.error || 'Failed to send message' }
      }

      console.log('✅ Telegram message sent successfully')
      return { success: true }

    } catch (error) {
      console.error('Failed to send Telegram message:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to send message' 
      }
    }
  }

  // Mark messages as read
  static async markMessagesAsRead(conversationId: number): Promise<void> {
    try {
      // Mark all messages in conversation as read
      const { error: messagesError } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('conversation_id', conversationId)
        .is('sender_id', null) // Only update client messages

      if (messagesError) {
        console.error('Error marking Telegram messages as read:', messagesError)
        throw messagesError
      }

      // Reset unread count
      const { error: conversationError } = await supabase
        .from('conversations')
        .update({ unread_count: 0 })
        .eq('id', conversationId)

      if (conversationError) {
        console.error('Error updating unread count:', conversationError)
        throw conversationError
      }
    } catch (error) {
      console.error('Failed to mark Telegram messages as read:', error)
      throw error
    }
  }

  // Subscribe to real-time updates for Telegram conversations
  static subscribeToConversations(callback: (payload: any) => void) {
    return supabase
      .channel('telegram_conversations_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'conversations',
          filter: 'platform=eq.telegram'
        }, 
        callback
      )
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'messages' 
        }, 
        callback
      )
      .subscribe()
  }

  // Format Telegram username for display
  static formatUsername(username: string | null, clientName: string | null): string {
    if (clientName) return clientName
    if (username) return `@${username}`
    return 'Telegram User'
  }

  // Get Telegram chat link
  static getChatLink(username: string | null): string | null {
    if (!username) return null
    return `https://t.me/${username}`
  }
}