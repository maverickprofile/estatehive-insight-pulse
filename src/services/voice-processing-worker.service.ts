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
      const botConfig = this.botConfigs.get(communication.organization_id);
      if (!botConfig) {
        console.error('Bot config not found for organization:', communication.organization_id);
        throw new Error('Bot configuration not found');
      }

      // Step 1: Download audio from Telegram using improved service
      console.log('Downloading voice file from Telegram...');
      const audioBlob = await improvedTelegramService.downloadVoiceFile(
        botConfig.id || job.telegram_bot_id || communication.channel_metadata?.telegram_bot_id,
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

      // Step 3: Process with AI for insights
      console.log('Processing with AI for insights...');
      await this.updateJobStatus(job.communication_id, 'summarizing');

      const clientInfo = communication.client_id ? 
        { id: communication.client_id } : undefined;

      const processingResult = await aiProcessingService.processTranscription(
        transcriptionResult.text,
        clientInfo,
        {
          extractEntities: true,
          generateTitle: true,
        }
      );

      // Step 4: Update communication with AI insights
      await supabase
        .from('client_communications')
        .update({
          processed_content: processingResult.summary,
          subject: processingResult.subject,
          sentiment: processingResult.sentiment,
          key_points: processingResult.keyPoints,
          action_items: processingResult.actionItems,
          entities: processingResult.entities,
          tags: processingResult.category ? [processingResult.category] : [],
          status: 'completed',
        })
        .eq('id', job.communication_id);

      // Step 5: Mark job as completed
      await this.updateJobStatus(job.communication_id, 'completed');

      // Step 6: Send success notification to Telegram
      await this.sendSuccessNotification(
        botConfig,
        communication,
        transcriptionResult,
        processingResult
      );

      console.log(`Successfully processed job ${job.id}`);

    } catch (error: any) {
      console.error(`Error processing job ${job.id}:`, error);
      
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
        const botConfig = this.botConfigs.get(communication.organization_id);
        if (botConfig) {
          await this.sendErrorNotification(botConfig, communication, error);
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
      
      message += '<b>📄 Summary:</b>\n';
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