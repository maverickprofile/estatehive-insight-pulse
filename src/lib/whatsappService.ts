// WhatsApp service to handle database operations for conversations and messages
import { supabase } from './supabaseClient'

export interface WhatsAppMessage {
  id: number
  conversation_id: number
  sender_id: string | null // null for client messages, UUID for agent messages
  content: string
  sent_at: string
  is_read: boolean
}

export interface WhatsAppConversation {
  id: number
  user_id: string
  client_telegram_id: number // We'll use this for WhatsApp phone numbers
  telegram_chat_id?: number // For Telegram conversations
  telegram_username?: string | null // For Telegram usernames
  client_name: string | null
  last_message: string | null
  last_message_at: string | null
  unread_count: number
  platform?: 'whatsapp' | 'telegram' // Platform indicator
  messages?: WhatsAppMessage[]
}

export class WhatsAppService {
  // Get all conversations for the current user (both WhatsApp and Telegram)
  static async getConversations(): Promise<WhatsAppConversation[]> {
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
        .order('last_message_at', { ascending: false })

      if (error) {
        console.error('Error fetching conversations:', error)
        throw error
      }

      return conversations || []
    } catch (error) {
      console.error('Failed to fetch conversations:', error)
      throw error
    }
  }

  // Get messages for a specific conversation
  static async getMessages(conversationId: number): Promise<WhatsAppMessage[]> {
    try {
      const { data: messages, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('sent_at', { ascending: true })

      if (error) {
        console.error('Error fetching messages:', error)
        throw error
      }

      return messages || []
    } catch (error) {
      console.error('Failed to fetch messages:', error)
      throw error
    }
  }

  // Create or get a conversation for a WhatsApp number
  static async createOrGetConversation(phoneNumber: string, clientName?: string): Promise<WhatsAppConversation> {
    try {
      // Convert phone number to a numeric ID (remove + and country code handling)
      const numericId = parseInt(phoneNumber.replace(/\D/g, ''))
      
      // First try to find existing conversation
      const { data: existingConversation, error: findError } = await supabase
        .from('conversations')
        .select('*')
        .eq('client_telegram_id', numericId)
        .single()

      if (findError && findError.code !== 'PGRST116') { // PGRST116 is "not found"
        console.error('Error finding conversation:', findError)
        throw findError
      }

      if (existingConversation) {
        return existingConversation
      }

      // Create new conversation if it doesn't exist
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) {
        throw new Error('User not authenticated')
      }

      const newConversation = {
        user_id: user.user.id,
        client_telegram_id: numericId,
        client_name: clientName || `WhatsApp ${phoneNumber}`,
        platform: 'whatsapp' as const,
        last_message: null,
        last_message_at: new Date().toISOString(),
        unread_count: 0
      }

      const { data: createdConversation, error: createError } = await supabase
        .from('conversations')
        .insert([newConversation])
        .select()
        .single()

      if (createError) {
        console.error('Error creating conversation:', createError)
        throw createError
      }

      return createdConversation
    } catch (error) {
      console.error('Failed to create or get conversation:', error)
      throw error
    }
  }

  // Send a message (from agent to client)
  static async sendMessage(conversationId: number, content: string): Promise<WhatsAppMessage> {
    try {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) {
        throw new Error('User not authenticated')
      }

      const newMessage = {
        conversation_id: conversationId,
        sender_id: user.user.id, // Agent message
        content,
        sent_at: new Date().toISOString(),
        is_read: true // Agent messages are automatically read
      }

      const { data: message, error: messageError } = await supabase
        .from('messages')
        .insert([newMessage])
        .select()
        .single()

      if (messageError) {
        console.error('Error sending message:', messageError)
        throw messageError
      }

      // Update conversation's last message
      const { error: updateError } = await supabase
        .from('conversations')
        .update({
          last_message: content,
          last_message_at: new Date().toISOString()
        })
        .eq('id', conversationId)

      if (updateError) {
        console.error('Error updating conversation:', updateError)
      }

      return message
    } catch (error) {
      console.error('Failed to send message:', error)
      throw error
    }
  }

  // Receive a message (from client to agent)
  static async receiveMessage(phoneNumber: string, content: string, clientName?: string): Promise<WhatsAppMessage> {
    try {
      // Get or create conversation
      const conversation = await this.createOrGetConversation(phoneNumber, clientName)

      const newMessage = {
        conversation_id: conversation.id,
        sender_id: null, // Client message
        content,
        sent_at: new Date().toISOString(),
        is_read: false // Client messages start as unread
      }

      const { data: message, error: messageError } = await supabase
        .from('messages')
        .insert([newMessage])
        .select()
        .single()

      if (messageError) {
        console.error('Error receiving message:', messageError)
        throw messageError
      }

      // Update conversation's last message and increment unread count
      const { error: updateError } = await supabase
        .from('conversations')
        .update({
          last_message: content,
          last_message_at: new Date().toISOString(),
          unread_count: conversation.unread_count + 1
        })
        .eq('id', conversation.id)

      if (updateError) {
        console.error('Error updating conversation:', updateError)
      }

      return message
    } catch (error) {
      console.error('Failed to receive message:', error)
      throw error
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
        console.error('Error marking messages as read:', messagesError)
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
      console.error('Failed to mark messages as read:', error)
      throw error
    }
  }

  // Subscribe to real-time updates for all conversations
  static subscribeToConversations(callback: (payload: any) => void) {
    return supabase
      .channel('all_conversations_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'conversations' }, 
        callback
      )
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'messages' }, 
        callback
      )
      .subscribe()
  }

  // Get only WhatsApp conversations
  static async getWhatsAppConversations(): Promise<WhatsAppConversation[]> {
    try {
      const { data: conversations, error } = await supabase
        .from('conversations')
        .select('*')
        .or('platform.eq.whatsapp,platform.is.null') // Include null for backward compatibility
        .order('last_message_at', { ascending: false })

      if (error) {
        console.error('Error fetching WhatsApp conversations:', error)
        throw error
      }

      return conversations || []
    } catch (error) {
      console.error('Failed to fetch WhatsApp conversations:', error)
      throw error
    }
  }

  // Get phone number from client_telegram_id
  static phoneNumberFromId(clientTelegramId: number): string {
    return `+${clientTelegramId}`
  }

  // Convert phone number to client_telegram_id
  static idFromPhoneNumber(phoneNumber: string): number {
    return parseInt(phoneNumber.replace(/\D/g, ''))
  }
}