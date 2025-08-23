import { supabase } from '@/lib/supabaseClient';
import { Conversation, Message } from '@/types/database.types';

export const messagesService = {
  // Get all conversations
  async getConversations() {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .order('last_message_at', { ascending: false });
    
    if (error) throw error;
    return data as Conversation[];
  },

  // Get single conversation
  async getConversation(id: number) {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data as Conversation;
  },

  // Create conversation
  async createConversation(conversation: Partial<Conversation>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('conversations')
      .insert([{ ...conversation, user_id: user.id }])
      .select()
      .single();
    
    if (error) throw error;
    return data as Conversation;
  },

  // Update conversation
  async updateConversation(id: number, updates: Partial<Conversation>) {
    const { data, error } = await supabase
      .from('conversations')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as Conversation;
  },

  // Delete conversation
  async deleteConversation(id: number) {
    const { error } = await supabase
      .from('conversations')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // Get messages for a conversation
  async getMessages(conversationId: number) {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('sent_at', { ascending: true });
    
    if (error) throw error;
    return data as Message[];
  },

  // Send/Create message
  async createMessage(message: Partial<Message>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('messages')
      .insert([{ ...message, sender_id: user.id }])
      .select()
      .single();
    
    if (error) throw error;

    // Update conversation's last message
    if (message.conversation_id) {
      await this.updateConversation(message.conversation_id, {
        last_message: message.content,
        last_message_at: new Date().toISOString()
      });
    }

    return data as Message;
  },

  // Mark messages as read
  async markMessagesAsRead(conversationId: number) {
    const { error } = await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('conversation_id', conversationId)
      .is('sender_id', null); // Only mark client messages as read
    
    if (error) throw error;

    // Update conversation unread count
    await this.updateConversation(conversationId, {
      unread_count: 0
    });
  },

  // Search conversations
  async searchConversations(searchTerm: string) {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .or(`client_name.ilike.%${searchTerm}%,telegram_username.ilike.%${searchTerm}%`)
      .order('last_message_at', { ascending: false });
    
    if (error) throw error;
    return data as Conversation[];
  },

  // Search messages
  async searchMessages(searchTerm: string, conversationId?: number) {
    let query = supabase
      .from('messages')
      .select('*')
      .ilike('content', `%${searchTerm}%`);
    
    if (conversationId) {
      query = query.eq('conversation_id', conversationId);
    }

    const { data, error } = await query.order('sent_at', { ascending: false });
    
    if (error) throw error;
    return data as Message[];
  },

  // Get conversation stats
  async getConversationStats() {
    const { data: conversations } = await supabase
      .from('conversations')
      .select('id, platform, unread_count');

    const { data: messages } = await supabase
      .from('messages')
      .select('id, sent_at')
      .gte('sent_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    const totalConversations = conversations?.length || 0;
    const whatsappConversations = conversations?.filter(c => c.platform === 'whatsapp').length || 0;
    const telegramConversations = conversations?.filter(c => c.platform === 'telegram').length || 0;
    const totalUnread = conversations?.reduce((sum, c) => sum + (c.unread_count || 0), 0) || 0;
    const messagesLast24h = messages?.length || 0;

    return {
      totalConversations,
      whatsappConversations,
      telegramConversations,
      totalUnread,
      messagesLast24h
    };
  },

  // Subscribe to real-time conversations
  subscribeToConversations(callback: () => void) {
    const subscription = supabase
      .channel('conversations-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'conversations' }, 
        callback
      )
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'messages' }, 
        callback
      )
      .subscribe();

    return subscription;
  }
};