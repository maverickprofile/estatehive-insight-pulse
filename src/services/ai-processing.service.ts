import OpenAI from 'openai';
import { supabase } from '@/lib/supabaseClient';
import { improvedTelegramService as telegramService } from './telegram-improved.service';
import { configService } from './config.service';
import { aiDecisionService } from './ai-decision.service';
import { crmActionsService } from './crm-actions.service';
import { VoiceProcessingContext } from '@/types/voice-crm.types';

export interface ProcessingResult {
  summary: string;
  keyPoints: string[];
  actionItems: string[];
  sentiment: 'positive' | 'neutral' | 'negative' | 'mixed';
  entities: {
    people?: string[];
    locations?: string[];
    dates?: string[];
    amounts?: string[];
    propertyTypes?: string[];
    requirements?: string[];
  };
  subject: string;
  category?: string;
  urgency?: 'low' | 'medium' | 'high';
}

export interface ProcessingOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  extractEntities?: boolean;
  generateTitle?: boolean;
}

class AIProcessingService {
  private openai: OpenAI | null = null;
  private isInitialized = false;

  /**
   * Initialize the OpenAI client
   */
  async initialize(organizationId?: string): Promise<void> {
    try {
      // Initialize configuration if not already done
      if (!configService.isConfigInitialized()) {
        await configService.initialize(organizationId);
      }
      
      // Get API key from config service
      const key = configService.getOpenAIApiKey();
      
      if (!key) {
        console.warn('OpenAI API key not configured. AI features will be limited.');
        // Allow service to run without OpenAI for systems that only use Web Speech API
        this.isInitialized = false;
        return;
      }

      this.openai = new OpenAI({
        apiKey: key,
        dangerouslyAllowBrowser: true, // Note: In production, use a backend API
      });

      this.isInitialized = true;
      console.log('AI processing service initialized');
    } catch (error) {
      console.error('Error initializing AI processing service:', error);
      throw error;
    }
  }

  /**
   * Process transcribed text to extract insights
   */
  async processTranscription(
    text: string,
    clientInfo?: { name?: string; id?: number },
    options: ProcessingOptions = {}
  ): Promise<ProcessingResult> {
    if (!this.isInitialized || !this.openai) {
      throw new Error('AI processing service not initialized');
    }

    try {
      const systemPrompt = options.systemPrompt || this.getDefaultSystemPrompt();
      const userPrompt = this.buildUserPrompt(text, clientInfo);

      const response = await this.openai.chat.completions.create({
        model: options.model || 'gpt-3.5-turbo',  // Use gpt-3.5-turbo which supports JSON mode
        messages: [
          { role: 'system', content: systemPrompt + '\n\nIMPORTANT: You must respond with valid JSON only.' },
          { role: 'user', content: userPrompt }
        ],
        temperature: options.temperature || 0.3,
        max_tokens: options.maxTokens || 500,
        // Remove response_format as it's not supported with all models
        // response_format: { type: 'json_object' }
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      
      return {
        summary: result.summary || '',
        keyPoints: result.keyPoints || [],
        actionItems: result.actionItems || [],
        sentiment: result.sentiment || 'neutral',
        entities: result.entities || {},
        subject: result.subject || 'Voice Note',
        category: result.category,
        urgency: result.urgency || 'medium',
      };
    } catch (error) {
      console.error('Error processing transcription:', error);
      throw error;
    }
  }

  /**
   * Get default system prompt for processing
   */
  private getDefaultSystemPrompt(): string {
    return `You are an AI assistant for a real estate CRM system. Your task is to analyze voice note transcriptions from real estate agents and extract relevant information.

You must return a JSON object with the following structure:
{
  "summary": "A concise 1-2 sentence summary of the voice note",
  "keyPoints": ["Array of key points mentioned"],
  "actionItems": ["Array of action items or tasks to be done"],
  "sentiment": "positive, neutral, negative, or mixed",
  "entities": {
    "people": ["Names of people mentioned"],
    "locations": ["Locations or addresses mentioned"],
    "dates": ["Dates or time references mentioned"],
    "amounts": ["Monetary amounts or prices mentioned"],
    "propertyTypes": ["Types of properties mentioned (apartment, villa, etc.)"],
    "requirements": ["Client requirements or preferences mentioned"]
  },
  "subject": "A short title for this communication (max 50 chars)",
  "category": "inquiry, follow-up, viewing, negotiation, documentation, or general",
  "urgency": "low, medium, or high based on content"
}

Focus on extracting information relevant to real estate transactions, client interactions, and property details.
Be concise and professional in your summaries.`;
  }

  /**
   * Build user prompt with transcription and context
   */
  private buildUserPrompt(text: string, clientInfo?: { name?: string; id?: number }): string {
    let prompt = `Please analyze the following voice note transcription`;
    
    if (clientInfo?.name) {
      prompt += ` related to client ${clientInfo.name}`;
    }
    
    prompt += `:\n\n"${text}"\n\n`;
    prompt += `Extract all relevant information and return it in the specified JSON format.`;
    
    return prompt;
  }

  /**
   * Process a communication record with decision engine integration
   */
  async processCommunication(communicationId: string): Promise<ProcessingResult> {
    try {
      // Fetch communication record
      const { data: communication, error } = await supabase
        .from('client_communications')
        .select(`
          *,
          clients (
            id,
            name,
            client_type
          )
        `)
        .eq('id', communicationId)
        .single();

      if (error || !communication) {
        throw new Error('Communication not found');
      }

      // Update job status
      await this.updateJobStatus(communicationId, 'summarizing');

      // Process the transcription
      const result = await this.processTranscription(
        communication.transcription || communication.raw_content || '',
        {
          name: communication.clients?.name,
          id: communication.clients?.id,
        }
      );

      // Update communication record with processed data
      const { error: updateError } = await supabase
        .from('client_communications')
        .update({
          processed_content: result.summary,
          subject: result.subject,
          sentiment: result.sentiment,
          key_points: result.keyPoints,
          action_items: result.actionItems,
          entities: result.entities,
          metadata: {
            ...communication.metadata,
            category: result.category,
            urgency: result.urgency,
          },
          status: 'completed',
        })
        .eq('id', communicationId);

      if (updateError) {
        throw updateError;
      }

      // Create voice processing context for decision engine
      const context: VoiceProcessingContext = {
        communication_id: communicationId,
        transcription: communication.transcription || communication.raw_content || '',
        ai_summary: result.summary,
        key_points: result.keyPoints,
        action_items: result.actionItems,
        entities: result.entities,
        sentiment: result.sentiment,
        urgency: result.urgency || 'medium',
        client_info: communication.clients ? {
          id: communication.clients.id,
          name: communication.clients.name,
          type: communication.clients.client_type,
        } : undefined,
      };

      // Analyze conversation for decisions
      console.log('Analyzing conversation for AI decisions...');
      await aiDecisionService.initialize(communication.organization_id);
      const suggestions = await aiDecisionService.analyzeConversation(context);
      console.log(`Generated ${suggestions.length} decision suggestions`);
      
      // Create decisions in database
      const decisions = await aiDecisionService.createDecisions(
        suggestions,
        communicationId,
        communication.organization_id
      );

      // Send decision suggestions via Telegram if bot is configured
      if (communication.channel_id && decisions.length > 0) {
        // Get bot config from metadata or use default
        let botId = communication.channel_metadata?.bot_id;
        
        // If no bot ID in metadata, try to get from telegram configs
        if (!botId) {
          const { data: botConfigs } = await supabase
            .from('telegram_bot_configs')
            .select('id')
            .eq('organization_id', communication.organization_id)
            .eq('is_active', true)
            .limit(1)
            .single();
          
          botId = botConfigs?.id;
        }
        
        if (botId) {
          console.log(`Sending ${decisions.length} decision suggestions to Telegram chat ${communication.channel_id}`);
          await telegramService.sendDecisionSuggestions(
            botId,
            communication.channel_id,
            decisions,
            result.summary
          );
        } else {
          console.log('No bot ID found, skipping Telegram decision suggestions');
        }
      }

      // Initialize CRM actions service for auto-approved decisions
      await crmActionsService.initialize();
      
      // Execute auto-approved decisions
      for (const decision of decisions) {
        if (decision.status === 'approved') {
          await crmActionsService.executeDecision(decision);
        }
      }

      // Update job status to completed
      await this.updateJobStatus(communicationId, 'completed');

      return result;
    } catch (error) {
      console.error('Error processing communication:', error);
      
      // Update job status to failed
      await this.updateJobStatus(communicationId, 'failed', error);
      
      throw error;
    }
  }

  /**
   * Generate a response suggestion based on communication
   */
  async generateResponse(
    communicationId: string,
    responseType: 'acknowledgment' | 'answer' | 'follow-up' = 'acknowledgment'
  ): Promise<string> {
    if (!this.isInitialized || !this.openai) {
      throw new Error('AI processing service not initialized');
    }

    try {
      // Fetch communication record
      const { data: communication, error } = await supabase
        .from('client_communications')
        .select('*')
        .eq('id', communicationId)
        .single();

      if (error || !communication) {
        throw new Error('Communication not found');
      }

      const prompt = this.buildResponsePrompt(communication, responseType);

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a professional real estate agent assistant. Generate appropriate responses for client communications.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 200,
      });

      return response.choices[0].message.content || '';
    } catch (error) {
      console.error('Error generating response:', error);
      throw error;
    }
  }

  /**
   * Build response generation prompt
   */
  private buildResponsePrompt(communication: any, responseType: string): string {
    let prompt = `Based on the following client communication:\n\n`;
    prompt += `Summary: ${communication.processed_content || communication.raw_content}\n`;
    prompt += `Key Points: ${JSON.stringify(communication.key_points)}\n`;
    prompt += `Action Items: ${JSON.stringify(communication.action_items)}\n\n`;

    switch (responseType) {
      case 'acknowledgment':
        prompt += 'Generate a brief acknowledgment message confirming receipt and next steps.';
        break;
      case 'answer':
        prompt += 'Generate a helpful response addressing the key points and questions.';
        break;
      case 'follow-up':
        prompt += 'Generate a follow-up message to check on progress or schedule next steps.';
        break;
    }

    return prompt;
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
        updateData.progress_percentage = 100;
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
   * Send completion notification with decision suggestions via Telegram
   */
  async sendCompletionNotification(
    botId: string,
    chatId: string,
    result: ProcessingResult,
    clientName?: string,
    communicationId?: string
  ): Promise<void> {
    try {
      // Send initial summary message
      const message = this.formatNotificationMessage(result, clientName);
      
      await telegramService.sendMessage(botId, chatId, message, {
        parse_mode: 'Markdown',
      });

      // If communication ID is provided, check for decisions
      if (communicationId) {
        const { data: decisions } = await supabase
          .from('ai_decisions')
          .select('*')
          .eq('communication_id', communicationId)
          .eq('status', 'pending');

        if (decisions && decisions.length > 0) {
          // Send decision suggestions with buttons
          await telegramService.sendDecisionSuggestions(
            botId,
            chatId,
            decisions,
            result.summary
          );
        }
      }
    } catch (error) {
      console.error('Error sending completion notification:', error);
    }
  }

  /**
   * Format notification message
   */
  private formatNotificationMessage(result: ProcessingResult, clientName?: string): string {
    let message = '✅ *Voice Note Processed Successfully*\n\n';
    
    if (clientName) {
      message += `📋 *Client:* ${clientName}\n`;
    }
    
    message += `📝 *Summary:* ${result.summary}\n\n`;
    
    if (result.keyPoints.length > 0) {
      message += '*Key Points:*\n';
      result.keyPoints.forEach(point => {
        message += `• ${point}\n`;
      });
      message += '\n';
    }
    
    if (result.actionItems.length > 0) {
      message += '*Action Items:*\n';
      result.actionItems.forEach(item => {
        message += `☐ ${item}\n`;
      });
      message += '\n';
    }
    
    message += `💭 *Sentiment:* ${result.sentiment}\n`;
    message += `🏷️ *Category:* ${result.category || 'General'}\n`;
    message += `⚡ *Urgency:* ${result.urgency || 'Medium'}\n`;
    
    message += '\n✅ Logged to CRM';
    
    return message;
  }

  /**
   * Batch process multiple communications
   */
  async batchProcess(communicationIds: string[]): Promise<Map<string, ProcessingResult>> {
    const results = new Map<string, ProcessingResult>();
    
    // Process with concurrency limit
    const concurrencyLimit = 3;
    const chunks = [];
    
    for (let i = 0; i < communicationIds.length; i += concurrencyLimit) {
      chunks.push(communicationIds.slice(i, i + concurrencyLimit));
    }

    for (const chunk of chunks) {
      const promises = chunk.map(async (id) => {
        try {
          const result = await this.processCommunication(id);
          results.set(id, result);
        } catch (error) {
          console.error(`Error processing communication ${id}:`, error);
        }
      });
      
      await Promise.all(promises);
    }

    return results;
  }
}

// Export singleton instance
export const aiProcessingService = new AIProcessingService();