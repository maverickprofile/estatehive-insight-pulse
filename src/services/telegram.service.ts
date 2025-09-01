import { supabase } from '@/lib/supabaseClient';
import { v4 as uuidv4 } from 'uuid';

export interface TelegramBotConfig {
  id: string;
  bot_token: string;
  bot_username?: string;
  organization_id?: string;  // Add organization_id for database operations
  allowed_chat_ids: string[];
  allowed_usernames: string[];
  chat_client_mapping: Record<string, number>;
  settings: Record<string, any>;
}

export interface VoiceMessage {
  messageId: number;
  chatId: number;
  fileId: string;
  fileUniqueId: string;
  duration: number;
  mimeType?: string;
  fileSize?: number;
  from: {
    id: number;
    username?: string;
    first_name?: string;
    last_name?: string;
  };
  date: number;
}

// Browser-compatible Telegram Bot API service using HTTP requests
class TelegramService {
  private static instance: TelegramService | null = null;
  private configs: Map<string, TelegramBotConfig> = new Map();
  private messageHandlers: Map<string, (message: VoiceMessage) => Promise<void>> = new Map();
  private apiBaseUrl = 'https://api.telegram.org';
  private pollingIntervals: Map<string, number> = new Map();
  private lastUpdateIds: Map<string, number> = new Map();
  private activePollingTokens: Set<string> = new Set();
  
  constructor() {
    // Ensure singleton
    if (TelegramService.instance) {
      return TelegramService.instance;
    }
    TelegramService.instance = this;
    
    // Cleanup on page unload
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.cleanupAllBots();
      });
    }
  }

  /**
   * Make API call to Telegram Bot API
   */
  private async makeApiCall(token: string, method: string, params: any = {}): Promise<any> {
    const url = `${this.apiBaseUrl}/bot${token}/${method}`;
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });
      
      const result = await response.json();
      
      if (!result.ok) {
        throw new Error(result.description || 'Telegram API error');
      }
      
      return result;
    } catch (error) {
      console.error(`Error calling Telegram API method ${method}:`, error);
      throw error;
    }
  }

  /**
   * Initialize a Telegram bot with the given configuration
   */
  async initializeBot(config: TelegramBotConfig): Promise<void> {
    try {
      // Stop any existing bot with the same token first
      for (const [botId, existingConfig] of this.configs.entries()) {
        if (existingConfig.bot_token === config.bot_token) {
          console.log(`Stopping existing bot ${botId} with same token`);
          await this.stopBot(botId);
        }
      }

      // Check if bot already exists with same ID
      if (this.configs.has(config.id)) {
        console.log(`Stopping existing bot ${config.id}`);
        await this.stopBot(config.id);
      }
      
      // Mark token as active
      this.activePollingTokens.add(config.bot_token);

      // Test bot token by getting bot info
      const botInfo = await this.makeApiCall(config.bot_token, 'getMe');
      console.log(`Bot ${config.id} verified:`, botInfo.result.username);
      
      // Store config
      this.configs.set(config.id, config);

      // Set up webhook if needed (for production)
      if (config.settings?.useWebhook) {
        await this.setupWebhook(config.id, config.bot_token, config.settings.webhookUrl);
      } else {
        // Start polling for updates
        await this.startPolling(config.id, config.bot_token);
      }

      console.log(`Telegram bot ${config.id} initialized successfully`);
    } catch (error) {
      console.error(`Error initializing Telegram bot ${config.id}:`, error);
      throw error;
    }
  }

  /**
   * Start polling for updates
   */
  private async startPolling(botId: string, token: string): Promise<void> {
    // Clear existing interval if any
    const existingInterval = this.pollingIntervals.get(botId);
    if (existingInterval) {
      clearInterval(existingInterval);
      // Wait a bit to ensure the previous polling has stopped
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Initialize last update ID
    this.lastUpdateIds.set(botId, 0);

    // Clear any pending updates first
    try {
      await this.makeApiCall(token, 'getUpdates', {
        offset: -1,
      });
    } catch (error) {
      console.log('Clearing pending updates');
    }

    // Start polling with a delay to avoid conflicts
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const intervalId = window.setInterval(async () => {
      try {
        // Check if this token is still active
        if (!this.activePollingTokens.has(token)) {
          clearInterval(intervalId);
          return;
        }
        
        const lastUpdateId = this.lastUpdateIds.get(botId) || 0;
        const updates = await this.makeApiCall(token, 'getUpdates', {
          offset: lastUpdateId + 1,
          timeout: 25,
          limit: 100,
        });

        if (updates.result && updates.result.length > 0) {
          for (const update of updates.result) {
            await this.processUpdate(botId, update);
            this.lastUpdateIds.set(botId, update.update_id);
          }
        }
      } catch (error: any) {
        // Handle conflict errors by stopping this bot
        if (error.message?.includes('Conflict')) {
          console.log(`Conflict detected for bot ${botId}, stopping polling`);
          clearInterval(intervalId);
          this.pollingIntervals.delete(botId);
          this.activePollingTokens.delete(token);
        } else {
          console.error(`Error polling updates for bot ${botId}:`, error);
        }
      }
    }, 5000); // Poll every 5 seconds to reduce conflicts

    this.pollingIntervals.set(botId, intervalId);
  }

  /**
   * Process an update from Telegram
   */
  private async processUpdate(botId: string, update: any): Promise<void> {
    const config = this.configs.get(botId);
    if (!config) return;

    try {
      if (update.message) {
        const msg = update.message;
        
        // Handle different message types
        if (msg.voice) {
          await this.handleVoiceMessage(botId, msg);
        } else if (msg.text) {
          await this.handleTextMessage(botId, msg);
        }
      } else if (update.callback_query) {
        await this.handleCallbackQuery(botId, update.callback_query);
      }
    } catch (error) {
      console.error('Error processing update:', error);
    }
  }

  /**
   * Handle voice message
   */
  private async handleVoiceMessage(botId: string, msg: any): Promise<void> {
    const config = this.configs.get(botId);
    if (!config) return;

    try {
      // Check if chat/user is allowed
      if (!this.isAllowed(msg, config)) {
        await this.sendMessage(botId, msg.chat.id, '❌ You are not authorized to use this bot.');
        return;
      }

      // Extract voice message data
      const voiceMessage: VoiceMessage = {
        messageId: msg.message_id,
        chatId: msg.chat.id,
        fileId: msg.voice.file_id,
        fileUniqueId: msg.voice.file_unique_id,
        duration: msg.voice.duration,
        mimeType: msg.voice.mime_type,
        fileSize: msg.voice.file_size,
        from: {
          id: msg.from.id,
          username: msg.from.username,
          first_name: msg.from.first_name,
          last_name: msg.from.last_name,
        },
        date: msg.date,
      };

      // Send initial confirmation
      await this.sendMessage(botId, msg.chat.id, '🎤 Voice message received! Processing...', {
        reply_to_message_id: msg.message_id,
      });

      // Process voice message
      await this.processVoiceMessage(botId, voiceMessage);

      // Call custom handler if set
      const handler = this.messageHandlers.get(botId);
      if (handler) {
        await handler(voiceMessage);
      }
    } catch (error) {
      console.error('Error handling voice message:', error);
      await this.sendMessage(botId, msg.chat.id, '❌ Error processing voice message. Please try again.');
    }
  }

  /**
   * Handle text message
   */
  private async handleTextMessage(botId: string, msg: any): Promise<void> {
    const text = msg.text;
    const chatId = msg.chat.id;

    if (text === '/start') {
      const welcomeMessage = `
🤖 <b>Estate Hive Voice-to-CRM Bot</b>

Welcome! I can help you log voice notes directly to your CRM.

<b>How to use:</b>
1. Send me a voice message
2. I'll transcribe it automatically
3. The transcription will be logged to your CRM

<b>Commands:</b>
/start - Show this message
/status - Check bot status
/help - Get help
/link &lt;client_id&gt; - Link this chat to a client

Send me a voice message to get started! 🎤
      `;
      
      await this.sendMessage(botId, chatId, welcomeMessage, { parse_mode: 'HTML' });
    } else if (text === '/status') {
      await this.sendMessage(botId, chatId, '✅ Bot is active and ready to process voice messages!');
    } else if (text === '/help') {
      const helpMessage = `
<b>Need help?</b>

• Send voice messages up to 20MB
• Supported languages: English, Hindi
• Messages are automatically transcribed
• Transcriptions are saved to your CRM

<b>Troubleshooting:</b>
• Make sure you're authorized
• Check your internet connection
• Contact support if issues persist
      `;
      
      await this.sendMessage(botId, chatId, helpMessage, { parse_mode: 'HTML' });
    } else if (text.startsWith('/link ')) {
      const clientId = text.split(' ')[1];
      if (clientId) {
        await this.linkChatToClient(botId, chatId.toString(), parseInt(clientId));
        await this.sendMessage(botId, chatId, `✅ This chat is now linked to client #${clientId}`);
      }
    }
  }

  /**
   * Handle callback query
   */
  private async handleCallbackQuery(botId: string, callbackQuery: any): Promise<void> {
    // Handle inline keyboard callbacks here
    console.log('Callback query received:', callbackQuery);
  }

  /**
   * Check if a message sender is allowed to use the bot
   */
  private isAllowed(msg: any, config: TelegramBotConfig): boolean {
    const chatId = msg.chat.id.toString();
    const username = msg.from?.username;

    // Check if chat ID is in allowed list
    if (config.allowed_chat_ids.length > 0 && !config.allowed_chat_ids.includes(chatId)) {
      return false;
    }

    // Check if username is in allowed list
    if (config.allowed_usernames.length > 0 && username && !config.allowed_usernames.includes(username)) {
      return false;
    }

    // If no restrictions are set, allow all
    if (config.allowed_chat_ids.length === 0 && config.allowed_usernames.length === 0) {
      return true;
    }

    return true;
  }

  /**
   * Process a voice message
   */
  private async processVoiceMessage(botId: string, voiceMessage: VoiceMessage): Promise<void> {
    const config = this.configs.get(botId);
    
    if (!config) {
      throw new Error('Bot not found');
    }

    try {
      // Get client ID from chat mapping
      const clientId = config.chat_client_mapping[voiceMessage.chatId.toString()];
      
      // Create communication record using RPC function to bypass RLS
      const { data: communication, error: commError } = await supabase
        .rpc('insert_voice_communication', {
          p_organization_id: config.organization_id || null,
          p_client_id: clientId || null,
          p_channel: 'telegram',
          p_channel_id: voiceMessage.chatId.toString(),
          p_channel_metadata: {
            telegram_message_id: voiceMessage.messageId,
            telegram_user: voiceMessage.from,
            telegram_file_id: voiceMessage.fileId,
          },
          p_audio_file_id: voiceMessage.fileId,
          p_duration_seconds: voiceMessage.duration,
          p_communication_date: new Date(voiceMessage.date * 1000).toISOString(),
        });

      if (commError) {
        throw commError;
      }

      // Create processing job if communication was created successfully
      if (communication) {
        const { error: jobError } = await supabase
          .from('voice_processing_jobs')
          .insert({
            communication_id: communication,  // RPC returns just the ID
            source_type: 'telegram',
            source_message_id: voiceMessage.messageId.toString(),
            source_file_id: voiceMessage.fileId,
            status: 'queued',
          });

        if (jobError) {
          throw jobError;
        }
      }

      // Notify user that processing has started
      await this.sendMessage(
        botId,
        voiceMessage.chatId,
        `📝 Voice message queued for processing...\nDuration: ${voiceMessage.duration}s\n${clientId ? `Client: #${clientId}` : 'No client linked'}`,
        { reply_to_message_id: voiceMessage.messageId }
      );

    } catch (error) {
      console.error('Error processing voice message:', error);
      throw error;
    }
  }

  /**
   * Download voice file from Telegram
   */
  async downloadVoiceFile(botId: string, fileId: string): Promise<Blob> {
    const config = this.configs.get(botId);
    if (!config) {
      throw new Error('Bot not found');
    }

    try {
      // Get file path from Telegram
      const fileInfo = await this.makeApiCall(config.bot_token, 'getFile', { file_id: fileId });
      
      // Download file using a CORS proxy for browser environment
      const fileUrl = `${this.apiBaseUrl}/file/bot${config.bot_token}/${fileInfo.result.file_path}`;
      
      // Try multiple approaches to download the file
      let response: Response;
      
      // Method 1: Try using a public CORS proxy
      try {
        const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(fileUrl)}`;
        response = await fetch(proxyUrl);
        
        // Even if status is 403, check if we got data
        const blob = await response.blob();
        if (blob.size > 0) {
          return blob;
        }
        throw new Error('CORS proxy returned empty data');
      } catch (corsError) {
        // Method 2: Try alternative CORS proxy
        try {
          const altProxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(fileUrl)}`;
          response = await fetch(altProxyUrl);
          
          const blob = await response.blob();
          if (blob.size > 0) {
            return blob;
          }
          throw new Error('Alternative proxy returned empty data');
        } catch (altError) {
          // Method 3: Use base64 encoding through Telegram API
          console.log('Falling back to base64 download method');
          
          // Get file as base64 through a different approach
          const fileData = await this.downloadFileAsBase64(config.bot_token, fileInfo.result.file_path);
          
          // Convert base64 to blob
          const binaryString = atob(fileData);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          return new Blob([bytes], { type: 'audio/ogg' });
        }
      }
    } catch (error) {
      console.error('Error downloading voice file:', error);
      throw error;
    }
  }

  /**
   * Download file as base64 (fallback method)
   */
  private async downloadFileAsBase64(token: string, filePath: string): Promise<string> {
    // This would need a server-side endpoint to handle the download
    // For now, throw an error indicating server-side support is needed
    throw new Error('Server-side download endpoint required. Please set up a backend service to download Telegram files.');
  }

  /**
   * Send a message to a specific chat
   */
  async sendMessage(botId: string, chatId: string | number, message: string, options?: any): Promise<void> {
    const config = this.configs.get(botId);
    if (!config) {
      throw new Error('Bot not found');
    }

    const params = {
      chat_id: chatId,
      text: message,
      ...options,
    };

    await this.makeApiCall(config.bot_token, 'sendMessage', params);
  }

  /**
   * Link a chat to a specific client
   */
  async linkChatToClient(botId: string, chatId: string, clientId: number): Promise<void> {
    const config = this.configs.get(botId);
    if (!config) {
      throw new Error('Bot config not found');
    }

    // Update local config
    config.chat_client_mapping[chatId] = clientId;

    // Update database
    const { error } = await supabase
      .from('telegram_bot_configs')
      .update({
        chat_client_mapping: config.chat_client_mapping,
      })
      .eq('id', botId);

    if (error) {
      throw error;
    }
  }

  /**
   * Set up webhook for production
   */
  private async setupWebhook(botId: string, token: string, webhookUrl: string): Promise<void> {
    try {
      const result = await this.makeApiCall(token, 'setWebhook', { url: webhookUrl });
      console.log(`Webhook set for bot ${botId}: ${webhookUrl}`);
    } catch (error) {
      console.error(`Error setting webhook for bot ${botId}:`, error);
      throw error;
    }
  }

  /**
   * Set a custom message handler for a bot
   */
  setMessageHandler(botId: string, handler: (message: VoiceMessage) => Promise<void>): void {
    this.messageHandlers.set(botId, handler);
  }

  /**
   * Stop a bot
   */
  async stopBot(botId: string): Promise<void> {
    // Get the config before deleting
    const config = this.configs.get(botId);
    
    // Stop polling
    const intervalId = this.pollingIntervals.get(botId);
    if (intervalId) {
      clearInterval(intervalId);
      this.pollingIntervals.delete(botId);
    }

    // Remove token from active set
    if (config) {
      this.activePollingTokens.delete(config.bot_token);
    }
    
    // Clear data
    this.configs.delete(botId);
    this.messageHandlers.delete(botId);
    this.lastUpdateIds.delete(botId);
    
    console.log(`Bot ${botId} stopped`);
  }
  
  /**
   * Cleanup all bots (for page unload)
   */
  private cleanupAllBots(): void {
    // Clear all intervals
    for (const intervalId of this.pollingIntervals.values()) {
      clearInterval(intervalId);
    }
    
    // Clear all data
    this.pollingIntervals.clear();
    this.configs.clear();
    this.messageHandlers.clear();
    this.lastUpdateIds.clear();
    this.activePollingTokens.clear();
  }

  /**
   * Load and initialize all active bots from database
   */
  async loadActiveBots(organizationId?: string): Promise<void> {
    try {
      let query = supabase
        .from('telegram_bot_configs')
        .select('*')
        .eq('is_active', true);

      if (organizationId) {
        query = query.eq('organization_id', organizationId);
      }

      const { data: configs, error } = await query;

      if (error) {
        throw error;
      }

      if (configs) {
        for (const config of configs) {
          await this.initializeBot({
            id: config.id,
            bot_token: config.bot_token,
            bot_username: config.bot_username,
            allowed_chat_ids: config.allowed_chat_ids || [],
            allowed_usernames: config.allowed_usernames || [],
            chat_client_mapping: config.chat_client_mapping || {},
            settings: config.settings || {},
          });
        }
      }

      console.log(`Loaded ${configs?.length || 0} active Telegram bots`);
    } catch (error) {
      console.error('Error loading active bots:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const telegramService = new TelegramService();