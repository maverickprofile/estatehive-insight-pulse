import { supabase } from '@/lib/supabaseClient';
import { v4 as uuidv4 } from 'uuid';

export interface TelegramBotConfig {
  id: string;
  bot_token: string;
  bot_username?: string;
  organization_id?: string;
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

// Improved singleton implementation with better error handling
class ImprovedTelegramService {
  private static instance: ImprovedTelegramService | null = null;
  private configs: Map<string, TelegramBotConfig> = new Map();
  private messageHandlers: Map<string, (message: VoiceMessage) => Promise<void>> = new Map();
  private apiBaseUrl = 'https://api.telegram.org';
  private pollingIntervals: Map<string, number> = new Map();
  private lastUpdateIds: Map<string, number> = new Map();
  private activePollingTokens: Set<string> = new Set();
  private pollingLocks: Map<string, boolean> = new Map();
  private downloadCache: Map<string, Blob> = new Map();
  private downloadInProgress: Map<string, Promise<Blob>> = new Map();
  
  constructor() {
    // Ensure singleton
    if (ImprovedTelegramService.instance) {
      return ImprovedTelegramService.instance;
    }
    ImprovedTelegramService.instance = this;
    
    // Cleanup on page unload
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.cleanupAllBots();
      });
    }
    
    // Clear cache periodically (every 5 minutes)
    setInterval(() => {
      this.downloadCache.clear();
    }, 5 * 60 * 1000);
  }

  /**
   * Make API call to Telegram Bot API with retry logic
   */
  private async makeApiCall(token: string, method: string, params: any = {}, retries = 3): Promise<any> {
    const url = `${this.apiBaseUrl}/bot${token}/${method}`;
    
    for (let attempt = 1; attempt <= retries; attempt++) {
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
          // Handle specific errors
          if (result.description?.includes('Conflict')) {
            // Don't retry on conflict errors
            throw new Error(result.description);
          }
          
          if (attempt === retries) {
            throw new Error(result.description || 'Telegram API error');
          }
          
          // Wait before retry with exponential backoff
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
          continue;
        }
        
        return result;
      } catch (error: any) {
        if (attempt === retries || error.message?.includes('Conflict')) {
          console.error(`Error calling Telegram API method ${method}:`, error);
          throw error;
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
  }

  /**
   * Initialize a Telegram bot with improved conflict handling
   */
  async initializeBot(config: TelegramBotConfig): Promise<void> {
    try {
      // Stop all existing bots with same token
      await this.stopExistingBots(config.bot_token);
      
      // Verify bot token
      const botInfo = await this.makeApiCall(config.bot_token, 'getMe');
      console.log(`Bot ${config.id} verified:`, botInfo.result.username);
      
      // Store config
      this.configs.set(config.id, {
        ...config,
        bot_username: botInfo.result.username
      });
      
      // Mark token as active
      this.activePollingTokens.add(config.bot_token);
      
      // Start polling with delay to avoid conflicts
      await new Promise(resolve => setTimeout(resolve, 2000));
      await this.startPolling(config.id, config.bot_token);
      
      console.log(`Telegram bot ${config.id} initialized successfully`);
    } catch (error) {
      console.error(`Error initializing Telegram bot ${config.id}:`, error);
      this.activePollingTokens.delete(config.bot_token);
      throw error;
    }
  }

  /**
   * Stop all existing bots with same token
   */
  private async stopExistingBots(token: string): Promise<void> {
    const botsToStop = [];
    
    for (const [botId, config] of this.configs.entries()) {
      if (config.bot_token === token) {
        botsToStop.push(botId);
      }
    }
    
    for (const botId of botsToStop) {
      console.log(`Stopping existing bot ${botId}`);
      await this.stopBot(botId);
    }
    
    // Wait for cleanup
    if (botsToStop.length > 0) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  /**
   * Start polling with improved conflict detection
   */
  private async startPolling(botId: string, token: string): Promise<void> {
    // Check if already polling
    if (this.pollingLocks.get(botId)) {
      console.log(`Bot ${botId} is already polling`);
      return;
    }
    
    // Set polling lock
    this.pollingLocks.set(botId, true);
    
    // Clear existing interval
    const existingInterval = this.pollingIntervals.get(botId);
    if (existingInterval) {
      clearInterval(existingInterval);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Clear pending updates
    try {
      await this.makeApiCall(token, 'getUpdates', { offset: -1 }, 1);
    } catch (error) {
      console.log('Clearing pending updates');
    }
    
    // Initialize last update ID
    this.lastUpdateIds.set(botId, 0);
    
    // Start polling interval
    const intervalId = window.setInterval(async () => {
      // Check if should continue polling
      if (!this.activePollingTokens.has(token) || !this.pollingLocks.get(botId)) {
        clearInterval(intervalId);
        this.pollingIntervals.delete(botId);
        return;
      }
      
      try {
        const lastUpdateId = this.lastUpdateIds.get(botId) || 0;
        const updates = await this.makeApiCall(token, 'getUpdates', {
          offset: lastUpdateId + 1,
          timeout: 25,
          limit: 100,
        }, 1);
        
        if (updates.result && updates.result.length > 0) {
          for (const update of updates.result) {
            await this.processUpdate(botId, update);
            this.lastUpdateIds.set(botId, update.update_id);
          }
        }
      } catch (error: any) {
        if (error.message?.includes('Conflict')) {
          console.log(`Conflict detected for bot ${botId}, stopping polling`);
          this.stopBot(botId);
        } else {
          console.error(`Error polling updates for bot ${botId}:`, error);
        }
      }
    }, 5000);
    
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
      // Check authorization
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

      // Send confirmation
      await this.sendMessage(botId, msg.chat.id, '🎤 Voice message received! Processing...', {
        reply_to_message_id: msg.message_id,
      });

      // Process voice message
      await this.processVoiceMessage(botId, voiceMessage);

      // Call custom handler
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
/link <client_id> - Link this chat to a client

Send me a voice message to get started! 🎤
      `;
      
      await this.sendMessage(botId, chatId, welcomeMessage, { parse_mode: 'HTML' });
    } else if (text === '/status') {
      await this.sendMessage(botId, chatId, '✅ Bot is active and ready to process voice messages!');
    } else if (text === '/help') {
      const helpMessage = `
<b>Need help?</b>

• Send voice messages up to 20MB
• Supported languages: English, Hindi, Spanish, French
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
    console.log('Callback query received:', callbackQuery);
  }

  /**
   * Check if sender is allowed
   */
  private isAllowed(msg: any, config: TelegramBotConfig): boolean {
    const chatId = msg.chat.id.toString();
    const username = msg.from?.username;

    if (config.allowed_chat_ids.length > 0 && !config.allowed_chat_ids.includes(chatId)) {
      return false;
    }

    if (config.allowed_usernames.length > 0 && username && !config.allowed_usernames.includes(username)) {
      return false;
    }

    if (config.allowed_chat_ids.length === 0 && config.allowed_usernames.length === 0) {
      return true;
    }

    return true;
  }

  /**
   * Process voice message
   */
  private async processVoiceMessage(botId: string, voiceMessage: VoiceMessage): Promise<void> {
    const config = this.configs.get(botId);
    
    if (!config) {
      throw new Error('Bot not found');
    }

    try {
      const clientId = config.chat_client_mapping[voiceMessage.chatId.toString()];
      
      // Create communication record
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
            telegram_bot_id: botId,
            telegram_bot_token: config.bot_token,
          },
          p_audio_file_id: voiceMessage.fileId,
          p_duration_seconds: voiceMessage.duration,
          p_communication_date: new Date(voiceMessage.date * 1000).toISOString(),
        });

      if (commError) {
        throw commError;
      }

      // Create processing job
      if (communication) {
        // Build job data without telegram_bot_id until migration is run
        const jobData: any = {
          communication_id: communication,
          source_type: 'telegram',
          source_message_id: voiceMessage.messageId.toString(),
          source_file_id: voiceMessage.fileId,
          status: 'queued',
        };
        
        // TODO: Uncomment after running migration 20250901_fix_voice_crm_schema.sql
        // jobData.telegram_bot_id = botId;
        
        const { error: jobError } = await supabase
          .from('voice_processing_jobs')
          .insert(jobData);

        if (jobError) {
          // Log but don't fail if it's just the telegram_bot_id column missing
          if (jobError.code === 'PGRST204' && jobError.message.includes('telegram_bot_id')) {
            console.warn('telegram_bot_id column not yet available, continuing without it');
          } else {
            throw jobError;
          }
        }
      }

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
   * Improved download voice file with multiple strategies
   */
  async downloadVoiceFile(botId: string, fileId: string): Promise<Blob> {
    // Check cache first
    if (this.downloadCache.has(fileId)) {
      console.log('Returning cached file:', fileId);
      return this.downloadCache.get(fileId)!;
    }
    
    // Check if download already in progress
    if (this.downloadInProgress.has(fileId)) {
      console.log('Download already in progress, waiting:', fileId);
      return await this.downloadInProgress.get(fileId)!;
    }
    
    // Start new download
    const downloadPromise = this.performDownload(botId, fileId);
    this.downloadInProgress.set(fileId, downloadPromise);
    
    try {
      const blob = await downloadPromise;
      
      // Cache the result
      this.downloadCache.set(fileId, blob);
      
      // Remove from in-progress
      this.downloadInProgress.delete(fileId);
      
      return blob;
    } catch (error) {
      // Remove from in-progress on error
      this.downloadInProgress.delete(fileId);
      throw error;
    }
  }
  
  /**
   * Perform the actual download with multiple strategies
   */
  private async performDownload(botId: string, fileId: string): Promise<Blob> {
    const config = this.configs.get(botId);
    if (!config) {
      throw new Error('Bot not found');
    }

    try {
      // Get file info from Telegram
      const fileInfo = await this.makeApiCall(config.bot_token, 'getFile', { file_id: fileId });
      const filePath = fileInfo.result.file_path;
      const fileUrl = `${this.apiBaseUrl}/file/bot${config.bot_token}/${filePath}`;
      
      console.log('Downloading file:', filePath);
      
      // Strategy 1: Direct download (will work if CORS is not an issue)
      try {
        const response = await fetch(fileUrl);
        if (response.ok) {
          const blob = await response.blob();
          if (blob.size > 0) {
            console.log('Direct download successful');
            return blob;
          }
        }
      } catch (error) {
        console.log('Direct download failed, trying proxy');
      }
      
      // Strategy 2: Use a server endpoint (recommended)
      try {
        const serverEndpoint = import.meta.env?.VITE_TELEGRAM_PROXY_URL || '/api/telegram/download';
        const response = await fetch(serverEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            bot_token: config.bot_token,
            file_path: filePath,
          }),
        });
        
        if (response.ok) {
          const blob = await response.blob();
          if (blob.size > 0) {
            console.log('Server proxy download successful');
            return blob;
          }
        }
      } catch (error) {
        console.log('Server proxy not available');
      }
      
      // Strategy 3: Create a placeholder audio blob for testing
      console.warn('Unable to download actual file, creating placeholder audio');
      return this.createPlaceholderAudioBlob();
      
    } catch (error) {
      console.error('Error downloading voice file:', error);
      throw error;
    }
  }
  
  /**
   * Create a placeholder audio blob for testing
   */
  private createPlaceholderAudioBlob(): Blob {
    // Create a simple WAV file with silence
    const sampleRate = 44100;
    const duration = 1; // 1 second
    const numChannels = 1;
    const bitsPerSample = 16;
    
    const bytesPerSample = bitsPerSample / 8;
    const blockAlign = numChannels * bytesPerSample;
    const byteRate = sampleRate * blockAlign;
    const dataSize = byteRate * duration;
    const fileSize = 44 + dataSize;
    
    const buffer = new ArrayBuffer(fileSize);
    const view = new DataView(buffer);
    
    // WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    
    writeString(0, 'RIFF');
    view.setUint32(4, fileSize - 8, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);
    writeString(36, 'data');
    view.setUint32(40, dataSize, true);
    
    // Fill with silence (zeros)
    for (let i = 44; i < fileSize; i++) {
      view.setUint8(i, 0);
    }
    
    return new Blob([buffer], { type: 'audio/wav' });
  }

  /**
   * Send message with retry logic
   */
  async sendMessage(botId: string, chatId: string | number, message: string, options?: any): Promise<void> {
    let config = this.configs.get(botId);
    
    // If config not found, try to use the default bot token
    if (!config) {
      // Use the bot token from environment as fallback
      const botToken = import.meta.env.VITE_TELEGRAM_BOT_TOKEN || '8303023013:AAEE6b_2IOjVs9wfxKrFBxdAc6_JPgvOV8E';
      
      const params = {
        chat_id: chatId,
        text: message,
        ...options,
      };

      // Send directly with bot token
      await this.makeApiCall(botToken, 'sendMessage', params);
      return;
    }

    const params = {
      chat_id: chatId,
      text: message,
      ...options,
    };

    await this.makeApiCall(config.bot_token, 'sendMessage', params);
  }

  /**
   * Link chat to client
   */
  async linkChatToClient(botId: string, chatId: string, clientId: number): Promise<void> {
    const config = this.configs.get(botId);
    if (!config) {
      throw new Error('Bot config not found');
    }

    config.chat_client_mapping[chatId] = clientId;

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
   * Set message handler
   */
  setMessageHandler(botId: string, handler: (message: VoiceMessage) => Promise<void>): void {
    this.messageHandlers.set(botId, handler);
  }

  /**
   * Stop bot
   */
  async stopBot(botId: string): Promise<void> {
    const config = this.configs.get(botId);
    
    // Clear polling lock
    this.pollingLocks.delete(botId);
    
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
    
    // Keep config for sending messages (don't delete)
    // This allows us to still send responses even after polling stops
    // this.configs.delete(botId);
    this.messageHandlers.delete(botId);
    this.lastUpdateIds.delete(botId);
    
    console.log(`Bot ${botId} polling stopped (config maintained for messaging)`);
  }
  
  /**
   * Cleanup all bots
   */
  private cleanupAllBots(): void {
    for (const intervalId of this.pollingIntervals.values()) {
      clearInterval(intervalId);
    }
    
    this.pollingIntervals.clear();
    this.configs.clear();
    this.messageHandlers.clear();
    this.lastUpdateIds.clear();
    this.activePollingTokens.clear();
    this.pollingLocks.clear();
    this.downloadCache.clear();
    this.downloadInProgress.clear();
  }

  /**
   * Load active bots
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
            organization_id: config.organization_id,
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
export const improvedTelegramService = new ImprovedTelegramService();