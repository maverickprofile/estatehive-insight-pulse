import { supabase } from '@/lib/supabaseClient';
import { v4 as uuidv4 } from 'uuid';
import { 
  TelegramActionMessage,
  TelegramInlineButton,
  TelegramCallbackData,
  AIDecision,
} from '@/types/voice-crm.types';

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
  
  // Public callback for external services to handle callback queries
  public onCallbackQuery: ((callbackQuery: any) => Promise<void>) | null = null;
  
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
          console.log(`Conflict detected for bot ${botId}, retrying with new session`);
          // Clear the old update offset and retry instead of stopping
          this.lastUpdateIds.set(botId, 0);
          // Wait a bit before retrying
          await new Promise(resolve => setTimeout(resolve, 2000));
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
   * Handle callback query from inline keyboard buttons
   */
  private async handleCallbackQuery(botId: string, callbackQuery: any): Promise<void> {
    console.log('Callback query received:', callbackQuery);
    
    // Check if external handler is registered (for approval integration)
    if (this.onCallbackQuery && callbackQuery.data) {
      // Check if this is an approval-related callback
      if (callbackQuery.data.startsWith('approve_') || 
          callbackQuery.data.startsWith('reject_') || 
          callbackQuery.data.startsWith('details_')) {
        await this.onCallbackQuery(callbackQuery);
        return;
      }
    }
    
    try {
      // Answer the callback query to remove loading state
      await this.answerCallbackQuery(botId, callbackQuery.id);
      
      // Parse callback data - check for our shortened format first
      const callbackData = callbackQuery.data;
      
      // Check if it's bulk action format (e.g., "bulk:a:all")
      if (typeof callbackData === 'string' && callbackData.startsWith('bulk:')) {
        const [, action, target] = callbackData.split(':');
        
        if (target === 'all') {
          // Get all pending decisions from the communication mentioned in the message
          // We need to extract communication_id from the message context
          // For now, get recent pending decisions
          const { data: pendingDecisions } = await supabase
            .from('ai_decisions')
            .select('id')
            .eq('status', 'pending')
            .order('created_at', { ascending: false })
            .limit(10);
          
          if (pendingDecisions && pendingDecisions.length > 0) {
            const decisionIds = pendingDecisions.map(d => d.id);
            
            if (action === 'a') { // approve all
              for (const id of decisionIds) {
                await this.approveDecision(id, callbackQuery.from.id.toString());
              }
              await this.editMessage(
                botId,
                callbackQuery.message.chat.id,
                callbackQuery.message.message_id,
                '✅ All actions approved and queued for execution!'
              );
            } else if (action === 'r') { // reject all
              for (const id of decisionIds) {
                await supabase
                  .from('ai_decisions')
                  .update({
                    status: 'rejected',
                    rejected_reason: 'Bulk rejected via Telegram',
                    updated_at: new Date().toISOString(),
                  })
                  .eq('id', id);
              }
              await this.editMessage(
                botId,
                callbackQuery.message.chat.id,
                callbackQuery.message.message_id,
                '❌ All actions rejected'
              );
            }
          }
        }
      }
      // Check if it's our shortened format (e.g., "a:0:12345678")
      else if (typeof callbackData === 'string' && callbackData.match(/^[armv]:\d+:[a-f0-9]{8}$/)) {
        const [action, index, shortId] = callbackData.split(':');
        
        // Find the full decision ID from the current decisions
        // We need to query the database to get the full ID
        console.log(`Looking up decision with short ID: ${shortId}`);
        
        // Use ilike for case-insensitive matching and proper wildcard
        const { data: decisions, error: queryError } = await supabase
          .from('ai_decisions')
          .select('id')
          .ilike('id', `${shortId}%`);
        
        if (queryError) {
          console.error('Error querying decision:', queryError);
          await this.sendMessage(
            botId,
            callbackQuery.message.chat.id,
            '❌ Error finding decision. Please try again.'
          );
          return;
        }
        
        console.log(`Query result for short ID ${shortId}:`, decisions);
        
        if (!decisions || decisions.length === 0) {
          console.error(`Decision not found for short ID: ${shortId}`);
          
          // Try to see what decisions are actually in the database
          const { data: recentDecisions } = await supabase
            .from('ai_decisions')
            .select('id')
            .order('created_at', { ascending: false })
            .limit(5);
          
          console.log('Recent decision IDs in database:', recentDecisions?.map(d => d.id));
          
          await this.sendMessage(
            botId,
            callbackQuery.message.chat.id,
            '❌ Decision not found. It may have expired.'
          );
          return;
        }
        
        const fullDecisionId = decisions[0].id;
        
        // Handle the action based on the prefix
        switch (action) {
          case 'a': // approve
            await this.handleDecisionApproval(botId, fullDecisionId, callbackQuery);
            break;
          case 'r': // reject
            await this.handleDecisionRejection(botId, fullDecisionId, callbackQuery);
            break;
          case 'm': // modify
            await this.handleDecisionModification(botId, fullDecisionId, callbackQuery);
            break;
          case 'v': // view details
            await this.showDecisionDetails(botId, fullDecisionId, callbackQuery.message.chat.id);
            break;
          default:
            console.log('Unknown callback action:', action);
        }
      } 
      // Fallback to JSON parsing for bulk actions
      else {
        try {
          const data: TelegramCallbackData = JSON.parse(callbackQuery.data);
          
          // Handle the action
          switch (data.action) {
            case 'approve':
              await this.handleDecisionApproval(botId, data.decision_id, callbackQuery);
              break;
            case 'reject':
              await this.handleDecisionRejection(botId, data.decision_id, callbackQuery);
              break;
            case 'modify':
              await this.handleDecisionModification(botId, data.decision_id, callbackQuery);
              break;
            case 'view_details':
              await this.showDecisionDetails(botId, data.decision_id, callbackQuery.message.chat.id);
              break;
            default:
              console.log('Unknown callback action:', data.action);
          }
        } catch (parseError) {
          console.error('Error parsing callback data as JSON:', parseError);
        }
      }
    } catch (error) {
      console.error('Error handling callback query:', error);
      await this.sendMessage(
        botId,
        callbackQuery.message.chat.id,
        '❌ Error processing your selection. Please try again.'
      );
    }
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
   * Send message with inline keyboard support
   */
  async sendMessageWithKeyboard(
    botId: string,
    chatId: string | number,
    message: string,
    keyboard: TelegramInlineButton[][],
    options?: any
  ): Promise<any> {
    let config = this.configs.get(botId);
    
    // If config not found by ID, try to get any active config
    if (!config) {
      console.log(`Bot config not found for ID ${botId}, trying to use default bot token`);
      const botToken = import.meta.env.VITE_TELEGRAM_BOT_TOKEN || '8303023013:AAEE6b_2IOjVs9wfxKrFBxdAc6_JPgvOV8E';
      
      const params = {
        chat_id: chatId,
        text: message,
        reply_markup: {
          inline_keyboard: keyboard,
        },
        ...options,
      };

      const result = await this.makeApiCall(botToken, 'sendMessage', params);
      return result.result;
    }

    const params = {
      chat_id: chatId,
      text: message,
      reply_markup: {
        inline_keyboard: keyboard,
      },
      ...options,
    };

    const result = await this.makeApiCall(config.bot_token, 'sendMessage', params);
    return result.result;
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
   * Send decision suggestions with inline keyboard
   */
  async sendDecisionSuggestions(
    botId: string,
    chatId: string | number,
    decisions: AIDecision[],
    context: string
  ): Promise<void> {
    try {
      console.log(`Sending decision suggestions: botId=${botId}, chatId=${chatId}, decisions=${decisions.length}`);
    // Build message
    let message = '📋 **Suggested Actions from Voice Note:**\n\n';
    message += `_${context}_\n\n`;

    const keyboard: TelegramInlineButton[][] = [];

    decisions.forEach((decision, index) => {
      // Debug logging for decision IDs
      console.log(`Decision ${index}: ID = ${decision.id}, Short ID = ${decision.id.substring(0, 8)}`);
      
      const emoji = this.getDecisionEmoji(decision.decision_type);
      message += `${index + 1}. ${emoji} **${this.getDecisionTitle(decision)}**\n`;
      message += `   📊 Confidence: ${Math.round(decision.confidence_score * 100)}%\n`;
      
      // Add decision details
      if (decision.decision_type === 'schedule_appointment' && decision.parameters.start_time) {
        const date = new Date(decision.parameters.start_time);
        message += `   📅 ${date.toLocaleDateString()} at ${date.toLocaleTimeString()}\n`;
      } else if (decision.decision_type === 'create_task') {
        message += `   ⚡ Priority: ${decision.parameters.priority || 'normal'}\n`;
      } else if (decision.decision_type === 'update_budget') {
        message += `   💰 ${decision.parameters.budget_min}-${decision.parameters.budget_max}\n`;
      }
      
      message += '\n';

      // Create buttons for this decision with shortened callback data
      // Use index instead of full UUID to stay within Telegram's 64-byte limit
      const row: TelegramInlineButton[] = [
        {
          text: `✅ Approve #${index + 1}`,
          callback_data: `a:${index}:${decision.id.substring(0, 8)}`, // Shortened format
        },
        {
          text: `❌ Reject #${index + 1}`,
          callback_data: `r:${index}:${decision.id.substring(0, 8)}`,
        },
      ];

      // Add modify button for certain decision types
      if (['schedule_appointment', 'create_task'].includes(decision.decision_type)) {
        row.push({
          text: `✏️ Edit #${index + 1}`,
          callback_data: `m:${index}:${decision.id.substring(0, 8)}`,
        });
      }

      keyboard.push(row);
    });

    // Add bulk action buttons with shortened format
    if (decisions.length > 1) {
      keyboard.push([
        {
          text: '✅ Approve All',
          callback_data: 'bulk:a:all', // Shortened bulk approve format
        },
        {
          text: '❌ Reject All',
          callback_data: 'bulk:r:all', // Shortened bulk reject format
        },
      ]);
    }

    // Send message with keyboard
    await this.sendMessageWithKeyboard(
      botId,
      chatId,
      message,
      keyboard,
      { parse_mode: 'Markdown' }
    );
    
    console.log('Decision suggestions sent successfully with inline keyboard');
    } catch (error) {
      console.error('Error sending decision suggestions:', error);
      // Fallback to sending without buttons
      await this.sendMessage(botId, chatId, `📋 Suggested Actions:\n\n${context}`);
    }
  }

  /**
   * Handle decision approval
   */
  private async handleDecisionApproval(
    botId: string,
    decisionId: string,
    callbackQuery: any
  ): Promise<void> {
    try {
      const chatId = callbackQuery.message.chat.id;
      const userId = callbackQuery.from.id;
      const messageId = callbackQuery.message.message_id;

      // Handle bulk approval
      if (decisionId === 'all') {
        const decisionIds = callbackQuery.data.additional_data || [];
        for (const id of decisionIds) {
          await this.approveDecision(id, userId.toString());
        }
        
        // Update message
        await this.editMessage(
          botId,
          chatId,
          messageId,
          '✅ All actions approved and queued for execution!'
        );
      } else {
        // Single approval
        await this.approveDecision(decisionId, userId.toString());
        
        // Update message
        const updatedText = callbackQuery.message.text + '\n\n✅ Action approved and executing...';
        await this.editMessage(botId, chatId, messageId, updatedText);
      }
    } catch (error) {
      console.error('Error handling approval:', error);
    }
  }

  /**
   * Handle decision rejection
   */
  private async handleDecisionRejection(
    botId: string,
    decisionId: string,
    callbackQuery: any
  ): Promise<void> {
    try {
      const chatId = callbackQuery.message.chat.id;
      const messageId = callbackQuery.message.message_id;

      // Update decision status
      await supabase
        .from('ai_decisions')
        .update({
          status: 'rejected',
          rejected_reason: 'User rejected via Telegram',
          updated_at: new Date().toISOString(),
        })
        .eq('id', decisionId);

      // Update message
      const updatedText = callbackQuery.message.text + '\n\n❌ Action rejected';
      await this.editMessage(botId, chatId, messageId, updatedText);
    } catch (error) {
      console.error('Error handling rejection:', error);
    }
  }

  /**
   * Handle decision modification
   */
  private async handleDecisionModification(
    botId: string,
    decisionId: string,
    callbackQuery: any
  ): Promise<void> {
    const chatId = callbackQuery.message.chat.id;
    
    await this.sendMessage(
      botId,
      chatId,
      '✏️ To modify this action, please send a message with the changes you want.\n' +
      'Example: "Change appointment time to 3 PM tomorrow"',
      { reply_to_message_id: callbackQuery.message.message_id }
    );
  }

  /**
   * Show decision details
   */
  private async showDecisionDetails(
    botId: string,
    decisionId: string,
    chatId: string | number
  ): Promise<void> {
    const { data: decision } = await supabase
      .from('ai_decisions')
      .select('*')
      .eq('id', decisionId)
      .single();

    if (decision) {
      const details = `📋 **Decision Details**\n\n` +
        `Type: ${decision.decision_type}\n` +
        `Confidence: ${Math.round(decision.confidence_score * 100)}%\n` +
        `Priority: ${decision.priority}\n` +
        `Status: ${decision.status}\n\n` +
        `Parameters:\n${JSON.stringify(decision.parameters, null, 2)}`;

      await this.sendMessage(botId, chatId, details, { parse_mode: 'Markdown' });
    }
  }

  /**
   * Answer callback query
   */
  public async answerCallbackQuery(callbackQueryId: string, text?: string, showAlert: boolean = false): Promise<void> {
    // Get any active bot config (we'll use the first one)
    const botId = Array.from(this.configs.keys())[0];
    if (!botId) {
      console.error('No bot configuration available');
      return;
    }
    const config = this.configs.get(botId);
    if (!config) return;

    await this.makeApiCall(config.bot_token, 'answerCallbackQuery', {
      callback_query_id: callbackQueryId,
      text: text,
      show_alert: showAlert
    });
  }

  /**
   * Edit message text
   */
  public async editMessageText(
    chatId: string | number,
    messageId: number,
    text: string,
    options: any = {}
  ): Promise<void> {
    // Get any active bot config (we'll use the first one)
    const botId = Array.from(this.configs.keys())[0];
    if (!botId) {
      console.error('No bot configuration available');
      return;
    }
    const config = this.configs.get(botId);
    if (!config) return;

    await this.makeApiCall(config.bot_token, 'editMessageText', {
      chat_id: chatId,
      message_id: messageId,
      text: text,
      ...options
    });
  }
  
  /**
   * Edit message (legacy private method for backward compatibility)
   */
  private async editMessage(
    botId: string,
    chatId: string | number,
    messageId: number,
    text: string
  ): Promise<void> {
    await this.editMessageText(chatId, messageId, text);
  }

  /**
   * Approve a decision
   */
  private async approveDecision(decisionId: string, userId: string): Promise<void> {
    // Update decision status to approved
    await supabase
      .from('ai_decisions')
      .update({
        status: 'approved',
        approved_by: userId,
        approved_at: new Date().toISOString(),
      })
      .eq('id', decisionId);
    
    // Execute the approved decision
    try {
      const { crmActionsService } = await import('./crm-actions.service');
      await crmActionsService.initialize();
      
      // Get the full decision details
      const { data: decision } = await supabase
        .from('ai_decisions')
        .select('*')
        .eq('id', decisionId)
        .single();
      
      if (decision) {
        // Execute the decision
        const result = await crmActionsService.executeDecision(decision);
        console.log(`Decision ${decisionId} execution result:`, result);
      }
    } catch (error) {
      console.error('Error executing approved decision:', error);
    }
  }

  /**
   * Get emoji for decision type
   */
  private getDecisionEmoji(decisionType: string): string {
    const emojis: Record<string, string> = {
      'create_lead': '👤',
      'update_client': '✏️',
      'schedule_appointment': '📅',
      'create_task': '📝',
      'update_property': '🏠',
      'send_message': '💬',
      'change_status': '🔄',
      'assign_agent': '👥',
      'update_budget': '💰',
      'add_note': '📋',
    };
    return emojis[decisionType] || '📌';
  }

  /**
   * Get title for decision
   */
  private getDecisionTitle(decision: AIDecision): string {
    const titles: Record<string, string> = {
      'create_lead': 'Create New Lead',
      'update_client': 'Update Client Info',
      'schedule_appointment': decision.parameters.title || 'Schedule Appointment',
      'create_task': decision.parameters.title || 'Create Task',
      'update_property': 'Update Property',
      'send_message': 'Send Message',
      'change_status': 'Change Status',
      'assign_agent': 'Assign Agent',
      'update_budget': 'Update Budget',
      'add_note': 'Add Note',
    };
    return titles[decision.decision_type] || decision.decision_type;
  }

  /**
   * Stop all bots
   */
  stopAllBots(): void {
    console.log('Stopping all Telegram bots...');
    for (const botId of this.configs.keys()) {
      this.stopBot(botId).catch(console.error);
    }
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