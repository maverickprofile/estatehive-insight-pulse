import OpenAI from 'openai';
import { supabase } from '@/lib/supabaseClient';
import { improvedTelegramService } from './telegram-improved.service';
import { improvedWebSpeech } from './web-speech-improved.service';
import { configService } from './config.service';

export interface TranscriptionResult {
  text: string;
  language: string;
  duration: number;
  confidence?: number;
  segments?: Array<{
    text: string;
    start: number;
    end: number;
  }>;
}

export interface TranscriptionOptions {
  language?: string; // ISO 639-1 code (e.g., 'en', 'hi')
  prompt?: string; // Optional prompt to guide the model
  temperature?: number; // Sampling temperature (0-1)
  response_format?: 'json' | 'text' | 'srt' | 'verbose_json' | 'vtt';
}

class TranscriptionService {
  private openai: OpenAI | null = null;
  private isInitialized = false;

  /**
   * Initialize the OpenAI client
   */
  async initialize(organizationId?: string): Promise<void> {
    try {
      // Initialize configuration service
      await configService.initialize(organizationId);
      
      // Get API key from config service
      const apiKey = configService.getOpenAIApiKey();
      
      if (apiKey) {
        this.openai = new OpenAI({
          apiKey: apiKey,
          dangerouslyAllowBrowser: true, // Note: In production, use a backend API
        });
        this.isInitialized = true;
        console.log('OpenAI transcription service initialized');
      } else {
        console.log('No OpenAI API key configured, will use Web Speech API only');
      }
    } catch (error) {
      console.error('Error initializing transcription service:', error);
      // Don't throw, allow service to work with Web Speech API only
    }
  }

  /**
   * Transcribe audio using OpenAI Whisper
   */
  async transcribeAudio(
    audioBuffer: ArrayBuffer | File | Blob,
    options: TranscriptionOptions = {}
  ): Promise<TranscriptionResult> {
    // Determine transcription provider based on configuration
    const provider = configService.getTranscriptionProvider();
    const useWebSpeech = configService.shouldUseWebSpeechApi();
    
    // Try transcription based on provider preference
    if (provider === 'web-speech' || (provider === 'auto' && useWebSpeech)) {
      if (improvedWebSpeech.isAvailable()) {
        try {
          console.log('Using FREE Web Speech API for transcription...');
          return await this.transcribeWithWebSpeech(audioBuffer, options);
        } catch (webSpeechError) {
          console.error('Web Speech API failed:', webSpeechError);
          
          // Fall back to OpenAI if available and auto mode
          if (provider === 'auto' && this.isInitialized && this.openai) {
            console.log('Falling back to OpenAI...');
          } else {
            throw webSpeechError;
          }
        }
      }
    }
    
    // Use OpenAI if configured
    if (!this.isInitialized || !this.openai) {
      // Try Web Speech as last resort
      if (improvedWebSpeech.isAvailable()) {
        console.log('OpenAI not available, using Web Speech API...');
        return await this.transcribeWithWebSpeech(audioBuffer, options);
      }
      throw new Error('No transcription service available');
    }

    try {
      // Prepare the audio file
      let audioFile: File;
      
      if (audioBuffer instanceof ArrayBuffer) {
        // Convert ArrayBuffer to File
        const blob = new Blob([audioBuffer], { type: 'audio/ogg' });
        audioFile = new File([blob], 'audio.ogg', { type: 'audio/ogg' });
      } else if (audioBuffer instanceof Blob) {
        // Convert Blob to File
        audioFile = new File([audioBuffer], 'audio.ogg', { type: audioBuffer.type || 'audio/ogg' });
      } else {
        audioFile = audioBuffer;
      }

      // Transcribe using Whisper API
      const transcription = await this.openai.audio.transcriptions.create({
        file: audioFile,
        model: 'whisper-1',
        language: options.language,
        prompt: options.prompt,
        temperature: options.temperature || 0,
        response_format: options.response_format || 'verbose_json',
      });

      // Parse result based on response format
      let result: TranscriptionResult;
      
      if (typeof transcription === 'string') {
        result = {
          text: transcription,
          language: options.language || 'en',
          duration: 0,
        };
      } else {
        result = {
          text: (transcription as any).text || '',
          language: (transcription as any).language || options.language || 'en',
          duration: (transcription as any).duration || 0,
          segments: (transcription as any).segments,
        };
      }

      return result;
    } catch (error) {
      console.error('Error transcribing audio:', error);
      throw error;
    }
  }

  /**
   * Process a voice message from Telegram
   */
  async processVoiceMessage(
    botId: string,
    fileId: string,
    communicationId: string
  ): Promise<TranscriptionResult> {
    try {
      // Update job status
      await this.updateJobStatus(communicationId, 'downloading');

      // Download voice file from Telegram using improved service
      const audioBuffer = await improvedTelegramService.downloadVoiceFile(botId, fileId);

      // Update job status
      await this.updateJobStatus(communicationId, 'transcribing');

      // Transcribe the audio
      const transcription = await this.transcribeAudio(audioBuffer, {
        response_format: 'verbose_json',
      });

      // Update communication record with transcription
      const { error } = await supabase
        .from('client_communications')
        .update({
          transcription: transcription.text,
          transcription_language: transcription.language,
          confidence_score: transcription.confidence,
          status: 'processing', // Will be marked complete after AI processing
        })
        .eq('id', communicationId);

      if (error) {
        throw error;
      }

      return transcription;
    } catch (error) {
      console.error('Error processing voice message:', error);
      
      // Update job status to failed
      await this.updateJobStatus(communicationId, 'failed', error);
      
      throw error;
    }
  }

  /**
   * Transcribe audio from a URL
   */
  async transcribeFromUrl(audioUrl: string, options: TranscriptionOptions = {}): Promise<TranscriptionResult> {
    try {
      // Fetch audio file
      const response = await fetch(audioUrl);
      const blob = await response.blob();
      
      // Transcribe
      return await this.transcribeAudio(blob, options);
    } catch (error) {
      console.error('Error transcribing from URL:', error);
      throw error;
    }
  }

  /**
   * Detect language of audio
   */
  async detectLanguage(audioBuffer: ArrayBuffer | File | Blob): Promise<string> {
    if (!this.isInitialized || !this.openai) {
      throw new Error('Transcription service not initialized');
    }

    try {
      // Prepare the audio file
      let audioFile: File;
      
      if (audioBuffer instanceof ArrayBuffer) {
        const blob = new Blob([audioBuffer], { type: 'audio/ogg' });
        audioFile = new File([blob], 'audio.ogg', { type: 'audio/ogg' });
      } else if (audioBuffer instanceof Blob) {
        audioFile = new File([audioBuffer], 'audio.ogg', { type: audioBuffer.type || 'audio/ogg' });
      } else {
        audioFile = audioBuffer;
      }

      // Use Whisper to detect language
      const result = await this.openai.audio.transcriptions.create({
        file: audioFile,
        model: 'whisper-1',
        response_format: 'verbose_json',
      });

      return (result as any).language || 'en';
    } catch (error) {
      console.error('Error detecting language:', error);
      return 'en'; // Default to English
    }
  }

  /**
   * Update voice processing job status
   */
  private async updateJobStatus(
    communicationId: string,
    status: string,
    error?: any
  ): Promise<void> {
    try {
      const updateData: any = {
        status,
        current_step: status,
        updated_at: new Date().toISOString(),
      };

      if (status === 'failed' && error) {
        updateData.error_message = error.message || 'Unknown error';
        updateData.error_details = error;
      }

      if (status === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }

      const { error: updateError } = await supabase
        .from('voice_processing_jobs')
        .update(updateData)
        .eq('communication_id', communicationId);

      if (updateError) {
        console.error('Error updating job status:', updateError);
      }
    } catch (error) {
      console.error('Error updating job status:', error);
    }
  }

  /**
   * Batch transcribe multiple audio files
   */
  async batchTranscribe(
    audioFiles: Array<{ id: string; buffer: Buffer | File | Blob }>,
    options: TranscriptionOptions = {}
  ): Promise<Map<string, TranscriptionResult>> {
    const results = new Map<string, TranscriptionResult>();
    
    // Process in parallel with concurrency limit
    const concurrencyLimit = 3;
    const chunks = [];
    
    for (let i = 0; i < audioFiles.length; i += concurrencyLimit) {
      chunks.push(audioFiles.slice(i, i + concurrencyLimit));
    }

    for (const chunk of chunks) {
      const promises = chunk.map(async (file) => {
        try {
          const result = await this.transcribeAudio(file.buffer, options);
          results.set(file.id, result);
        } catch (error) {
          console.error(`Error transcribing file ${file.id}:`, error);
          results.set(file.id, {
            text: '',
            language: 'en',
            duration: 0,
          });
        }
      });
      
      await Promise.all(promises);
    }

    return results;
  }

  /**
   * Transcribe audio using Web Speech API (FREE)
   */
  private async transcribeWithWebSpeech(
    audioBuffer: ArrayBuffer | File | Blob,
    options: TranscriptionOptions = {}
  ): Promise<TranscriptionResult> {
    try {
      // Convert to Blob if needed
      let audioBlob: Blob;
      
      if (audioBuffer instanceof ArrayBuffer) {
        audioBlob = new Blob([audioBuffer], { type: 'audio/ogg' });
      } else if (audioBuffer instanceof File) {
        audioBlob = audioBuffer as Blob;
      } else {
        audioBlob = audioBuffer;
      }

      // Use improved Web Speech service with automatic format handling
      const webResult = await improvedWebSpeech.transcribeAudioBlob(audioBlob, {
        language: options.language,
        onProgress: (text) => {
          console.log('Transcription progress:', text);
        },
        retries: configService.getRetryConfig().maxRetries
      });

      // Convert to our standard format
      const result: TranscriptionResult = {
        text: webResult.text,
        language: webResult.language,
        duration: 0, // Web Speech API doesn't provide duration
        confidence: webResult.confidence,
      };

      console.log('Web Speech API transcription successful:', result.text);
      return result;
      
    } catch (error) {
      console.error('Web Speech API transcription failed:', error);
      throw error;
    }
  }

  /**
   * Get transcription statistics
   */
  async getTranscriptionStats(organizationId: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('client_communications')
        .select('transcription_language, confidence_score, duration_seconds')
        .eq('organization_id', organizationId)
        .eq('communication_type', 'voice')
        .not('transcription', 'is', null);

      if (error) {
        throw error;
      }

      // Calculate statistics
      const stats = {
        total_transcriptions: data?.length || 0,
        total_duration_seconds: data?.reduce((sum, item) => sum + (item.duration_seconds || 0), 0) || 0,
        average_confidence: data?.reduce((sum, item) => sum + (item.confidence_score || 0), 0) / (data?.length || 1) || 0,
        languages: {} as Record<string, number>,
      };

      // Count languages
      data?.forEach((item) => {
        const lang = item.transcription_language || 'unknown';
        stats.languages[lang] = (stats.languages[lang] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.error('Error getting transcription stats:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const transcriptionService = new TranscriptionService();