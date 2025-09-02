import { supabase } from '@/lib/supabaseClient';
import { transcriptionService } from './transcription.service';
import { aiProcessingService } from './ai-processing.service';
import { improvedTelegramService } from './telegram-improved.service';
import { configService } from './config.service';
import type { TelegramBotConfig } from './telegram-improved.service';

interface VoiceProcessingJob {
  id: string;
  communication_id: string;
  status: string;
  source_type: string;
  source_file_id: string;
  source_message_id: string;
  telegram_bot_id?: string;
  channel?: string;
  channel_id?: string;
  retry_count: number;
}

interface ClientCommunication {
  id: string;
  organization_id: string;
  client_id: number | null;
  channel_id: string;
  channel_metadata: any;
  audio_file_id: string;
}

class VoiceProcessingWorkerService {
  private isRunning = false;
  private pollingInterval: number | null = null;
  private processingQueue: VoiceProcessingJob[] = [];
  private botConfigs: Map<string, TelegramBotConfig> = new Map();
  private processingJobs: Set<string> = new Set(); // Track jobs currently being processed

  /**
   * Start the worker service
   */
  async start(botConfigs?: TelegramBotConfig[], organizationId?: string): Promise<void> {
    if (this.isRunning) {
      console.log('Voice processing worker already running');
      return;
    }

    // Initialize configuration and services
    await configService.initialize(organizationId);
    await transcriptionService.initialize(organizationId);
    await aiProcessingService.initialize();

    // Store bot configs for later use
    if (botConfigs) {
      botConfigs.forEach(config => {
        this.botConfigs.set(config.organization_id || '', config);
      });
    }

    this.isRunning = true;
    console.log('Starting voice processing worker...');

    // Start polling for jobs
    this.startPolling();
  }

  /**
   * Stop the worker service
   */
  stop(): void {
    if (!this.isRunning) return;

    this.isRunning = false;
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    console.log('Voice processing worker stopped');
  }

  /**
   * Start polling for queued jobs
   */
  private startPolling(): void {
    // Initial poll
    this.pollForJobs();

    // Set up interval polling (every 5 seconds)
    this.pollingInterval = window.setInterval(() => {
      if (this.isRunning) {
        this.pollForJobs();
      }
    }, 5000);
  }

  /**
   * Poll for queued jobs from the database
   */
  private async pollForJobs(): Promise<void> {
    try {
      // Fetch queued jobs
      const { data: jobs, error } = await supabase
        .from('voice_processing_jobs')
        .select('*')
        .in('status', ['queued', 'downloading', 'transcribing'])
        .lt('retry_count', 3)
        .order('created_at', { ascending: true })
        .limit(5);

      if (error) {
        console.error('Error fetching queued jobs:', error);
        return;
      }

      if (!jobs || jobs.length === 0) {
        return;
      }

      console.log(`Found ${jobs.length} queued voice processing jobs`);

      // Process jobs sequentially
      for (const job of jobs) {
        // Skip if already processing this job
        if (this.processingJobs.has(job.id)) {
          console.log(`Job ${job.id} is already being processed, skipping`);
          continue;
        }
        await this.processJob(job);
      }
    } catch (error) {
      console.error('Error polling for jobs:', error);
    }
  }

  /**
   * Process a single voice processing job
   */
  private async processJob(job: VoiceProcessingJob): Promise<void> {
    console.log(`Processing job ${job.id} for communication ${job.communication_id}`);
    
    // Mark job as being processed
    this.processingJobs.add(job.id);

    try {
      // Update job status to processing
      await this.updateJobStatus(job.communication_id, 'downloading');

      // Fetch communication details
      const { data: communication, error: commError } = await supabase
        .from('client_communications')
        .select('*')
        .eq('id', job.communication_id)
        .single();

      if (commError || !communication) {
        throw new Error('Communication record not found');
      }

      // Get bot config for this organization
      let botConfig = this.botConfigs.get(communication.organization_id);
      
      // If not found by organization_id, try to get any available config
      if (!botConfig && this.botConfigs.size > 0) {
        // Use the first available bot config as fallback
        botConfig = Array.from(this.botConfigs.values())[0];
        console.warn('Using fallback bot config for processing');
      }
      
      if (!botConfig) {
        console.error('No bot configuration available for processing');
        // Continue processing without bot config - use bot ID from job/communication
        // throw new Error('Bot configuration not found');
      }

      // Step 1: Download audio from Telegram using improved service
      console.log('Downloading voice file from Telegram...');
      const botId = botConfig?.id || job.telegram_bot_id || communication.channel_metadata?.telegram_bot_id || 'default';
      const audioBlob = await improvedTelegramService.downloadVoiceFile(
        botId,
        job.source_file_id
      );
      
      // Step 2: Transcribe audio
      console.log('Transcribing audio...');
      await this.updateJobStatus(job.communication_id, 'transcribing');
      
      // Try to transcribe (will use Web Speech API first, then OpenAI as fallback)
      const transcriptionResult = await transcriptionService.transcribeAudio(audioBlob, {
        response_format: 'verbose_json',
      });

      // Update communication with transcription
      await supabase
        .from('client_communications')
        .update({
          transcription: transcriptionResult.text,
          transcription_language: transcriptionResult.language,
          confidence_score: transcriptionResult.confidence,
          raw_content: transcriptionResult.text,
          status: 'processing',
        })
        .eq('id', job.communication_id);

      // Step 3: Process with AI for insights and decision engine
      console.log('Processing with AI for insights and decisions...');
      await this.updateJobStatus(job.communication_id, 'summarizing');

      // Use processCommunication instead to trigger decision engine
      const processingResult = await aiProcessingService.processCommunication(job.communication_id);

      // Step 4: Job status already updated by processCommunication
      console.log('AI processing and decision generation completed');

      // Step 5: Send success notification to Telegram (already includes decisions)
      // The processCommunication method already sends decision suggestions if there are any
      // So we only need to send the basic success notification if no decisions were generated
      const { data: decisions } = await supabase
        .from('ai_decisions')
        .select('*')
        .eq('communication_id', job.communication_id)
        .eq('status', 'pending');

      if (botConfig && (!decisions || decisions.length === 0)) {
        // Only send basic notification if no decisions were generated
        await this.sendSuccessNotification(
          botConfig,
          communication,
          transcriptionResult,
          processingResult
        );
      } else if (decisions && decisions.length > 0) {
        console.log(`${decisions.length} decision suggestions sent via Telegram`);
      }

      console.log(`Successfully processed job ${job.id}`);
      
      // Remove from processing set
      this.processingJobs.delete(job.id);

    } catch (error: any) {
      console.error(`Error processing job ${job.id}:`, error);
      
      // Remove from processing set even on error
      this.processingJobs.delete(job.id);
      
      // Update retry count and status
      const newRetryCount = (job.retry_count || 0) + 1;
      
      await supabase
        .from('voice_processing_jobs')
        .update({
          retry_count: newRetryCount,
          status: newRetryCount >= 3 ? 'failed' : 'queued',
          error_message: error.message,
          error_details: error,
          updated_at: new Date().toISOString(),
        })
        .eq('id', job.id);

      // Send error notification to Telegram
      const { data: communication } = await supabase
        .from('client_communications')
        .select('*')
        .eq('id', job.communication_id)
        .single();

      if (communication) {
        // Try to get bot config for error notification
        let botConfig = this.botConfigs.get(communication.organization_id);
        if (!botConfig && this.botConfigs.size > 0) {
          botConfig = Array.from(this.botConfigs.values())[0];
        }
        
        if (botConfig) {
          try {
            await this.sendErrorNotification(botConfig, communication, error);
          } catch (notifyError) {
            console.error('Failed to send error notification:', notifyError);
          }
        } else {
          console.log('Skipping error notification - no bot config available');
        }
      }
    }
  }

  /**
   * Update job status
   */
  private async updateJobStatus(communicationId: string, status: string): Promise<void> {
    const updateData: any = {
      status,
      current_step: status,
      updated_at: new Date().toISOString(),
    };

    if (status === 'completed') {
      updateData.completed_at = new Date().toISOString();
      updateData.progress_percentage = 100;
    }

    await supabase
      .from('voice_processing_jobs')
      .update(updateData)
      .eq('communication_id', communicationId);
  }

  /**
   * Send success notification to Telegram
   */
  private async sendSuccessNotification(
    botConfig: TelegramBotConfig,
    communication: ClientCommunication,
    transcriptionResult: any,
    processingResult: any
  ): Promise<void> {
    try {
      const chatId = communication.channel_id;
      const messageId = communication.channel_metadata?.telegram_message_id;

      // Format the notification message
      let message = '✅ <b>Voice Note Processed Successfully</b>\n\n';
      
      if (communication.client_id) {
        message += `📋 <b>Client ID:</b> ${communication.client_id}\n`;
      }
      
      message += `📝 <b>Subject:</b> ${processingResult.subject}\n`;
      message += `🎯 <b>Sentiment:</b> ${processingResult.sentiment}\n`;
      message += `🌐 <b>Language:</b> ${transcriptionResult.language}\n\n`;
      
      // Add the full transcription
      message += '<b>🎤 Transcription:</b>\n';
      message += `<i>${transcriptionResult.text}</i>\n\n`;
      
      message += '<b>📄 AI Summary:</b>\n';
      message += `${processingResult.summary}\n\n`;
      
      if (processingResult.keyPoints && processingResult.keyPoints.length > 0) {
        message += '<b>🔑 Key Points:</b>\n';
        processingResult.keyPoints.forEach((point: string) => {
          message += `• ${point}\n`;
        });
        message += '\n';
      }
      
      if (processingResult.actionItems && processingResult.actionItems.length > 0) {
        message += '<b>✔️ Action Items:</b>\n';
        processingResult.actionItems.forEach((item: string) => {
          message += `• ${item}\n`;
        });
      }

      // Send the message using improved service
      await improvedTelegramService.sendMessage(botConfig.id, chatId, message, {
        parse_mode: 'HTML',
        reply_to_message_id: messageId,
      });

    } catch (error) {
      console.error('Error sending success notification:', error);
    }
  }

  /**
   * Send error notification to Telegram
   */
  private async sendErrorNotification(
    botConfig: TelegramBotConfig,
    communication: ClientCommunication,
    error: any
  ): Promise<void> {
    try {
      const chatId = communication.channel_id;
      const messageId = communication.channel_metadata?.telegram_message_id;

      const message = `❌ <b>Error Processing Voice Message</b>\n\n` +
        `Error: ${error.message || 'Unknown error occurred'}\n\n` +
        `Please try again or contact support if the issue persists.`;

      await improvedTelegramService.sendMessage(botConfig.id, chatId, message, {
        parse_mode: 'HTML',
        reply_to_message_id: messageId,
      });

    } catch (notifyError) {
      console.error('Error sending error notification:', notifyError);
    }
  }

  /**
   * Set bot configuration
   */
  setBotConfig(config: TelegramBotConfig): void {
    if (config.organization_id) {
      this.botConfigs.set(config.organization_id, config);
    }
  }
}

// Export singleton instance
export const voiceProcessingWorker = new VoiceProcessingWorkerService();