import { supabase } from '@/lib/supabaseClient';
import { improvedTelegramService } from './telegram-improved.service';
import { approvalService } from './approval-simple.service';
import { crmActionsService } from './crm-actions.service';
import { aiDecisionService } from './ai-decision.service';
import type { ApprovalRequest, AIDecision } from '@/types/approval.types';

/**
 * Service to handle bi-directional integration between Telegram and Approval System
 */
class TelegramApprovalIntegrationService {
  private isInitialized = false;
  private approvalCallbacks: Map<string, string> = new Map(); // Maps callback_data to approval_id
  private static instance: TelegramApprovalIntegrationService | null = null;
  
  constructor() {
    // Ensure singleton
    if (TelegramApprovalIntegrationService.instance) {
      return TelegramApprovalIntegrationService.instance;
    }
    TelegramApprovalIntegrationService.instance = this;
  }

  /**
   * Initialize the integration service
   */
  async initialize(organizationId?: string): Promise<void> {
    if (this.isInitialized) {
      console.log('Telegram-Approval Integration Service already initialized');
      return;
    }

    console.log('Initializing Telegram-Approval Integration Service...');
    
    // Initialize dependent services
    await approvalService.initialize(organizationId);
    await crmActionsService.initialize(organizationId);
    await aiDecisionService.initialize(organizationId);

    // Set up real-time listeners for approval requests
    this.setupApprovalListeners();
    
    // Set up Telegram callback handlers
    this.setupTelegramCallbacks();

    this.isInitialized = true;
    console.log('Telegram-Approval Integration Service initialized');
  }
  
  /**
   * Check if service is initialized
   */
  isServiceInitialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Setup listeners for new approval requests to send to Telegram
   */
  private setupApprovalListeners(): void {
    // Listen for new approval requests in the database
    const channel = supabase
      .channel('telegram-approval-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'approval_requests',
        },
        async (payload) => {
          console.log('New approval request detected:', payload.new);
          await this.sendApprovalToTelegram(payload.new as ApprovalRequest);
        }
      )
      .subscribe();
  }

  /**
   * Setup Telegram callback handlers for approval actions
   */
  private setupTelegramCallbacks(): void {
    // This will be called by the Telegram service when buttons are pressed
    improvedTelegramService.onCallbackQuery = async (callbackQuery: any) => {
      await this.handleTelegramCallback(callbackQuery);
    };
  }

  /**
   * Send approval request notification to Telegram with action buttons
   */
  async sendApprovalToTelegram(approval: ApprovalRequest): Promise<void> {
    try {
      // Get the related decision and communication
      const { data: decision } = await supabase
        .from('ai_decisions')
        .select('*, client_communications(*)')
        .eq('id', approval.decision_id)
        .single();

      if (!decision) {
        console.error('Decision not found for approval:', approval.id);
        return;
      }

      // Get bot configuration
      const { data: botConfig } = await supabase
        .from('telegram_bot_configs')
        .select('*')
        .eq('organization_id', approval.organization_id)
        .eq('is_active', true)
        .single();

      if (!botConfig) {
        console.error('No active bot config found');
        return;
      }

      // Get the chat ID from the communication
      const chatId = decision.client_communications?.channel_id;
      if (!chatId) {
        console.error('No chat ID found for communication');
        return;
      }

      // Format the approval message
      const message = this.formatApprovalMessage(approval, decision);

      // Create inline keyboard with approve/reject buttons
      const keyboard = {
        inline_keyboard: [
          [
            {
              text: '✅ Approve',
              callback_data: `approve_${approval.id}`
            },
            {
              text: '❌ Reject',
              callback_data: `reject_${approval.id}`
            }
          ],
          [
            {
              text: '📝 View Details',
              callback_data: `details_${approval.id}`
            }
          ]
        ]
      };

      // Store the callback mapping
      this.approvalCallbacks.set(`approve_${approval.id}`, approval.id);
      this.approvalCallbacks.set(`reject_${approval.id}`, approval.id);
      this.approvalCallbacks.set(`details_${approval.id}`, approval.id);

      // Send message with buttons
      await improvedTelegramService.sendMessage(
        botConfig.id,
        chatId,
        message,
        {
          parse_mode: 'HTML',
          reply_markup: keyboard
        }
      );

      console.log('Approval request sent to Telegram with buttons');
    } catch (error) {
      console.error('Error sending approval to Telegram:', error);
    }
  }

  /**
   * Format approval message for Telegram
   */
  private formatApprovalMessage(approval: ApprovalRequest, decision: any): string {
    let message = '🔔 <b>Approval Required</b>\n\n';
    
    message += `📋 <b>Action:</b> ${this.getActionTitle(approval.action_type)}\n`;
    message += `🎯 <b>Type:</b> ${approval.entity_type}\n`;
    
    if (decision) {
      message += `💬 <b>From:</b> "${decision.client_communications?.transcription?.substring(0, 100)}..."\n`;
      message += `📊 <b>Confidence:</b> ${Math.round((decision.confidence_score || 0) * 100)}%\n`;
    }
    
    message += `⏰ <b>Priority:</b> ${approval.priority || 'medium'}\n`;
    message += `🕐 <b>Expires:</b> ${new Date(approval.expires_at).toLocaleString()}\n\n`;
    
    if (approval.change_summary) {
      message += `📝 <b>Summary:</b>\n${approval.change_summary}\n\n`;
    }
    
    if (approval.proposed_changes) {
      message += '<b>📌 Proposed Changes:</b>\n';
      const changes = approval.proposed_changes as any;
      
      if (changes.name) message += `• Name: ${changes.name}\n`;
      if (changes.phone) message += `• Phone: ${changes.phone}\n`;
      if (changes.email) message += `• Email: ${changes.email}\n`;
      if (changes.budget_min || changes.budget_max) {
        message += `• Budget: ${changes.budget_min || '?'} - ${changes.budget_max || '?'}\n`;
      }
    }
    
    message += '\n<i>Use the buttons below to approve or reject this action.</i>';
    
    return message;
  }

  /**
   * Get action title for display
   */
  private getActionTitle(actionType: string): string {
    const titles: Record<string, string> = {
      'create_lead': '👤 Create New Lead',
      'update_client': '👥 Update Client',
      'schedule_appointment': '📅 Schedule Appointment',
      'create_task': '📋 Create Task',
      'update_property': '🏠 Update Property',
      'send_message': '💬 Send Message',
      'add_note': '📝 Add Note',
      'change_status': '🆙 Change Status',
      'assign_agent': '👨‍💼 Assign Agent',
      'update_budget': '💰 Update Budget',
    };
    return titles[actionType] || actionType;
  }

  /**
   * Handle callback from Telegram button press
   */
  async handleTelegramCallback(callbackQuery: any): Promise<void> {
    try {
      const { data: callbackData, from, message } = callbackQuery;
      
      console.log('Handling Telegram callback:', callbackData);

      // Parse the action and approval ID
      const [action, approvalId] = callbackData.split('_');
      
      if (!approvalId || !this.approvalCallbacks.has(callbackData)) {
        await improvedTelegramService.answerCallbackQuery(
          callbackQuery.id,
          'Invalid approval request'
        );
        return;
      }

      // Get the approval request
      const { data: approval } = await supabase
        .from('approval_requests')
        .select('*')
        .eq('id', approvalId)
        .single();

      if (!approval) {
        await improvedTelegramService.answerCallbackQuery(
          callbackQuery.id,
          'Approval request not found'
        );
        return;
      }

      // Handle the action
      switch (action) {
        case 'approve':
          await this.handleApprove(approval, from, callbackQuery);
          break;
        case 'reject':
          await this.handleReject(approval, from, callbackQuery);
          break;
        case 'details':
          await this.showDetails(approval, callbackQuery);
          break;
        default:
          await improvedTelegramService.answerCallbackQuery(
            callbackQuery.id,
            'Unknown action'
          );
      }

      // Update the message to show the action was taken
      if (action === 'approve' || action === 'reject') {
        const statusEmoji = action === 'approve' ? '✅' : '❌';
        const statusText = action === 'approve' ? 'APPROVED' : 'REJECTED';
        
        const updatedMessage = message.text + 
          `\n\n${statusEmoji} <b>${statusText}</b> by @${from.username || from.first_name}`;
        
        await improvedTelegramService.editMessageText(
          message.chat.id,
          message.message_id,
          updatedMessage,
          { parse_mode: 'HTML' }
        );
      }
    } catch (error) {
      console.error('Error handling Telegram callback:', error);
      await improvedTelegramService.answerCallbackQuery(
        callbackQuery.id,
        'Error processing request'
      );
    }
  }

  /**
   * Handle approval action
   */
  private async handleApprove(
    approval: ApprovalRequest,
    user: any,
    callbackQuery: any
  ): Promise<void> {
    try {
      // Approve the request
      const result = await approvalService.approveRequest(
        approval.id,
        user.id.toString(),
        `Approved via Telegram by @${user.username || user.first_name}`
      );

      if (result.success) {
        // Execute the approved action
        if (approval.decision_id) {
          const { data: decision } = await supabase
            .from('ai_decisions')
            .select('*')
            .eq('id', approval.decision_id)
            .single();

          if (decision) {
            await crmActionsService.executeDecision(decision);
          }
        }

        await improvedTelegramService.answerCallbackQuery(
          callbackQuery.id,
          '✅ Approved successfully!'
        );

        // Send confirmation message
        await improvedTelegramService.sendMessage(
          null,
          callbackQuery.message.chat.id,
          `✅ Action approved and executed successfully!\n\n${approval.change_summary || 'Action completed.'}`,
          { parse_mode: 'HTML' }
        );
      } else {
        await improvedTelegramService.answerCallbackQuery(
          callbackQuery.id,
          '❌ Failed to approve'
        );
      }
    } catch (error) {
      console.error('Error approving request:', error);
      await improvedTelegramService.answerCallbackQuery(
        callbackQuery.id,
        '❌ Error approving request'
      );
    }
  }

  /**
   * Handle rejection action
   */
  private async handleReject(
    approval: ApprovalRequest,
    user: any,
    callbackQuery: any
  ): Promise<void> {
    try {
      // Reject the request
      const result = await approvalService.rejectRequest(
        approval.id,
        user.id.toString(),
        `Rejected via Telegram by @${user.username || user.first_name}`
      );

      if (result.success) {
        await improvedTelegramService.answerCallbackQuery(
          callbackQuery.id,
          '❌ Rejected successfully!'
        );

        // Send confirmation message
        await improvedTelegramService.sendMessage(
          null,
          callbackQuery.message.chat.id,
          `❌ Action rejected.\n\nThe requested action will not be executed.`,
          { parse_mode: 'HTML' }
        );
      } else {
        await improvedTelegramService.answerCallbackQuery(
          callbackQuery.id,
          '❌ Failed to reject'
        );
      }
    } catch (error) {
      console.error('Error rejecting request:', error);
      await improvedTelegramService.answerCallbackQuery(
        callbackQuery.id,
        '❌ Error rejecting request'
      );
    }
  }

  /**
   * Show detailed information about the approval
   */
  private async showDetails(
    approval: ApprovalRequest,
    callbackQuery: any
  ): Promise<void> {
    try {
      let detailsMessage = '📋 <b>Approval Details</b>\n\n';
      
      detailsMessage += `<b>ID:</b> <code>${approval.id}</code>\n`;
      detailsMessage += `<b>Type:</b> ${approval.entity_type} - ${approval.action_type}\n`;
      detailsMessage += `<b>Status:</b> ${approval.status}\n`;
      detailsMessage += `<b>Requested:</b> ${new Date(approval.requested_at).toLocaleString()}\n`;
      detailsMessage += `<b>Expires:</b> ${new Date(approval.expires_at).toLocaleString()}\n\n`;
      
      if (approval.proposed_changes) {
        detailsMessage += '<b>Full Details:</b>\n';
        detailsMessage += '<pre>' + JSON.stringify(approval.proposed_changes, null, 2) + '</pre>\n';
      }
      
      await improvedTelegramService.sendMessage(
        null,
        callbackQuery.message.chat.id,
        detailsMessage,
        { 
          parse_mode: 'HTML',
          reply_to_message_id: callbackQuery.message.message_id 
        }
      );
      
      await improvedTelegramService.answerCallbackQuery(
        callbackQuery.id,
        'Details sent below'
      );
    } catch (error) {
      console.error('Error showing details:', error);
      await improvedTelegramService.answerCallbackQuery(
        callbackQuery.id,
        '❌ Error showing details'
      );
    }
  }

  /**
   * Send approval status update to Telegram
   */
  async sendApprovalStatusUpdate(
    approvalId: string,
    status: 'approved' | 'rejected',
    approvedBy: string,
    notes?: string
  ): Promise<void> {
    try {
      // Get the approval and related data
      const { data: approval } = await supabase
        .from('approval_requests')
        .select('*, ai_decisions(*, client_communications(*))')
        .eq('id', approvalId)
        .single();

      if (!approval || !approval.ai_decisions?.client_communications) {
        console.error('Could not find communication for approval update');
        return;
      }

      const chatId = approval.ai_decisions.client_communications.channel_id;
      const statusEmoji = status === 'approved' ? '✅' : '❌';
      const statusText = status === 'approved' ? 'APPROVED' : 'REJECTED';

      let message = `${statusEmoji} <b>Approval ${statusText}</b>\n\n`;
      message += `📋 <b>Action:</b> ${this.getActionTitle(approval.action_type)}\n`;
      message += `👤 <b>By:</b> ${approvedBy}\n`;
      
      if (notes) {
        message += `📝 <b>Notes:</b> ${notes}\n`;
      }
      
      message += `🕐 <b>Time:</b> ${new Date().toLocaleString()}\n`;
      
      if (status === 'approved') {
        message += '\n✨ The action has been executed successfully.';
      }

      // Send the update
      await improvedTelegramService.sendMessage(
        null,
        chatId,
        message,
        { parse_mode: 'HTML' }
      );
    } catch (error) {
      console.error('Error sending approval status update:', error);
    }
  }
}

// Export singleton instance
export const telegramApprovalIntegration = new TelegramApprovalIntegrationService();