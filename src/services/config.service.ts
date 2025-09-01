/**
 * Configuration Service for secure API key management
 * Handles API keys from environment variables and database
 */

import { supabase } from '@/lib/supabaseClient';

interface ApiConfiguration {
  openaiApiKey?: string;
  telegramBotToken?: string;
  useWebSpeechApi: boolean;
  transcriptionProvider: 'web-speech' | 'openai' | 'auto';
  maxRetries: number;
  retryDelay: number;
  audioProcessingTimeout: number;
}

class ConfigService {
  private static instance: ConfigService | null = null;
  private config: ApiConfiguration = {
    useWebSpeechApi: true,
    transcriptionProvider: 'auto',
    maxRetries: 3,
    retryDelay: 1000,
    audioProcessingTimeout: 30000,
  };
  private isInitialized = false;

  constructor() {
    if (ConfigService.instance) {
      return ConfigService.instance;
    }
    ConfigService.instance = this;
  }

  /**
   * Initialize configuration from environment and database
   */
  async initialize(organizationId?: string): Promise<void> {
    try {
      // Load from environment variables (Vite)
      this.loadFromEnvironment();
      
      // Load from database if organization ID provided
      if (organizationId) {
        await this.loadFromDatabase(organizationId);
      }
      
      // Validate configuration
      this.validateConfiguration();
      
      this.isInitialized = true;
      console.log('Configuration service initialized');
    } catch (error) {
      console.error('Error initializing configuration:', error);
      throw error;
    }
  }

  /**
   * Load configuration from environment variables
   */
  private loadFromEnvironment(): void {
    // Check for Vite environment variables
    if (import.meta.env) {
      // OpenAI API Key
      if (import.meta.env.VITE_OPENAI_API_KEY) {
        this.config.openaiApiKey = import.meta.env.VITE_OPENAI_API_KEY;
      }
      
      // Telegram Bot Token (if default is set)
      if (import.meta.env.VITE_TELEGRAM_BOT_TOKEN) {
        this.config.telegramBotToken = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
      }
      
      // Transcription provider preference
      if (import.meta.env.VITE_TRANSCRIPTION_PROVIDER) {
        this.config.transcriptionProvider = import.meta.env.VITE_TRANSCRIPTION_PROVIDER;
      }
      
      // Use Web Speech API preference
      if (import.meta.env.VITE_USE_WEB_SPEECH_API !== undefined) {
        this.config.useWebSpeechApi = import.meta.env.VITE_USE_WEB_SPEECH_API === 'true';
      }
    }
  }

  /**
   * Load configuration from database
   */
  private async loadFromDatabase(organizationId: string): Promise<void> {
    try {
      // Fetch organization settings
      const { data: orgSettings, error } = await supabase
        .from('organization_settings')
        .select('api_keys, voice_settings')
        .eq('organization_id', organizationId)
        .single();
      
      // Handle missing table (PGRST205) or no data (PGRST116) gracefully
      if (error) {
        if (error.code === 'PGRST116' || error.code === 'PGRST205') {
          console.log('Organization settings table not found or empty, using environment configuration');
        } else {
          console.error('Error loading organization settings:', error);
        }
        return;
      }
      
      if (orgSettings) {
        // Load API keys (encrypted in database)
        if (orgSettings.api_keys) {
          const decryptedKeys = await this.decryptApiKeys(orgSettings.api_keys);
          
          if (decryptedKeys.openai_api_key) {
            this.config.openaiApiKey = decryptedKeys.openai_api_key;
          }
          
          if (decryptedKeys.telegram_bot_token) {
            this.config.telegramBotToken = decryptedKeys.telegram_bot_token;
          }
        }
        
        // Load voice settings
        if (orgSettings.voice_settings) {
          if (orgSettings.voice_settings.transcription_provider) {
            this.config.transcriptionProvider = orgSettings.voice_settings.transcription_provider;
          }
          
          if (orgSettings.voice_settings.use_web_speech_api !== undefined) {
            this.config.useWebSpeechApi = orgSettings.voice_settings.use_web_speech_api;
          }
          
          if (orgSettings.voice_settings.max_retries) {
            this.config.maxRetries = orgSettings.voice_settings.max_retries;
          }
          
          if (orgSettings.voice_settings.audio_processing_timeout) {
            this.config.audioProcessingTimeout = orgSettings.voice_settings.audio_processing_timeout;
          }
        }
      }
    } catch (error) {
      console.error('Error loading database configuration:', error);
    }
  }

  /**
   * Decrypt API keys from database
   * In production, use proper encryption/decryption
   */
  private async decryptApiKeys(encryptedKeys: any): Promise<any> {
    // TODO: Implement proper decryption
    // For now, return as-is (assuming they're stored in plain text during development)
    return encryptedKeys;
  }

  /**
   * Validate configuration
   */
  private validateConfiguration(): void {
    // Check if we have at least one transcription method available
    if (!this.config.useWebSpeechApi && !this.config.openaiApiKey) {
      console.warn('No transcription method available. Web Speech API is disabled and OpenAI key is not configured.');
      
      // Force Web Speech API as fallback
      this.config.useWebSpeechApi = true;
      this.config.transcriptionProvider = 'web-speech';
    }
    
    // Validate transcription provider setting
    if (this.config.transcriptionProvider === 'openai' && !this.config.openaiApiKey) {
      console.warn('OpenAI selected but no API key configured. Switching to auto mode.');
      this.config.transcriptionProvider = 'auto';
    }
    
    // Ensure reasonable timeout values
    if (this.config.audioProcessingTimeout < 5000) {
      this.config.audioProcessingTimeout = 5000;
    }
    
    if (this.config.maxRetries < 1) {
      this.config.maxRetries = 1;
    }
    
    if (this.config.retryDelay < 100) {
      this.config.retryDelay = 100;
    }
  }

  /**
   * Get OpenAI API key
   */
  getOpenAIApiKey(): string | undefined {
    // Return undefined if the key is empty or just whitespace
    if (!this.config.openaiApiKey || this.config.openaiApiKey.trim() === '') {
      return undefined;
    }
    return this.config.openaiApiKey;
  }

  /**
   * Get Telegram bot token
   */
  getTelegramBotToken(): string | undefined {
    return this.config.telegramBotToken;
  }

  /**
   * Check if Web Speech API should be used
   */
  shouldUseWebSpeechApi(): boolean {
    return this.config.useWebSpeechApi;
  }

  /**
   * Get transcription provider preference
   */
  getTranscriptionProvider(): 'web-speech' | 'openai' | 'auto' {
    return this.config.transcriptionProvider;
  }

  /**
   * Get retry configuration
   */
  getRetryConfig(): { maxRetries: number; retryDelay: number } {
    return {
      maxRetries: this.config.maxRetries,
      retryDelay: this.config.retryDelay,
    };
  }

  /**
   * Get audio processing timeout
   */
  getAudioProcessingTimeout(): number {
    return this.config.audioProcessingTimeout;
  }

  /**
   * Update configuration dynamically
   */
  async updateConfiguration(updates: Partial<ApiConfiguration>): Promise<void> {
    this.config = {
      ...this.config,
      ...updates,
    };
    
    this.validateConfiguration();
  }

  /**
   * Save API keys to database (encrypted)
   */
  async saveApiKeys(
    organizationId: string,
    keys: {
      openaiApiKey?: string;
      telegramBotToken?: string;
    }
  ): Promise<void> {
    try {
      // TODO: Implement proper encryption before saving
      const encryptedKeys = {
        openai_api_key: keys.openaiApiKey,
        telegram_bot_token: keys.telegramBotToken,
      };
      
      // Upsert organization settings
      const { error } = await supabase
        .from('organization_settings')
        .upsert({
          organization_id: organizationId,
          api_keys: encryptedKeys,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'organization_id',
        });
      
      if (error) {
        throw error;
      }
      
      // Update local configuration
      if (keys.openaiApiKey) {
        this.config.openaiApiKey = keys.openaiApiKey;
      }
      
      if (keys.telegramBotToken) {
        this.config.telegramBotToken = keys.telegramBotToken;
      }
      
      console.log('API keys saved successfully');
    } catch (error) {
      console.error('Error saving API keys:', error);
      throw error;
    }
  }

  /**
   * Clear all API keys
   */
  clearApiKeys(): void {
    this.config.openaiApiKey = undefined;
    this.config.telegramBotToken = undefined;
  }

  /**
   * Check if configuration is initialized
   */
  isConfigInitialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Get full configuration (for debugging)
   */
  getConfiguration(): ApiConfiguration {
    // Return a copy to prevent external modification
    return { ...this.config };
  }

  /**
   * Reset configuration to defaults
   */
  reset(): void {
    this.config = {
      useWebSpeechApi: true,
      transcriptionProvider: 'auto',
      maxRetries: 3,
      retryDelay: 1000,
      audioProcessingTimeout: 30000,
    };
    this.isInitialized = false;
  }
}

// Export singleton instance
export const configService = new ConfigService();