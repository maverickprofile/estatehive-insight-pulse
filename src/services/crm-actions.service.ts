import { supabase } from '@/lib/supabaseClient';
import { v4 as uuidv4 } from 'uuid';
import {
  CRMAction,
  AIDecision,
  ExecutionResult,
  CreateLeadPayload,
  UpdateClientPayload,
  ScheduleAppointmentPayload,
  CreateTaskPayload,
} from '@/types/voice-crm.types';
import { approvalService } from './approval.service';
import {
  PermissionCheck,
  CreateApprovalRequestPayload,
  ApprovalRequest,
  EntityType,
  ActionType,
} from '@/types/approval.types';

class CRMActionsService {
  private executionQueue: CRMAction[] = [];
  private isProcessing = false;
  private processingInterval: number | null = null;
  private currentUserId: string | null = null;
  private isInitialized = false;
  private processedDecisionIds = new Set<string>();

  /**
   * Initialize the CRM Actions Service
   */
  async initialize(userId?: string): Promise<void> {
    // Prevent multiple initializations
    if (this.isInitialized) {
      console.log('CRM Actions Service already initialized, skipping');
      return;
    }
    
    // Set current user
    if (userId) {
      this.currentUserId = userId;
    }
    
    // Stop any existing processor before starting new one
    this.stop();
    
    // Start processing queue
    this.startQueueProcessor();
    this.isInitialized = true;
    console.log('CRM Actions Service initialized');
  }

  /**
   * Set the current user for permission checks
   */
  setCurrentUser(userId: string): void {
    this.currentUserId = userId;
  }

  /**
   * Check if a decision requires approval and process accordingly
   */
  async processDecisionWithApproval(decision: AIDecision): Promise<{
    requiresApproval: boolean;
    approvalRequestId?: string;
    executionResult?: ExecutionResult;
  }> {
    if (!this.currentUserId) {
      throw new Error('User ID not set. Call setCurrentUser() first.');
    }

    try {
      // Check if this action requires approval
      const permissionCheck: PermissionCheck = {
        user_id: this.currentUserId,
        entity_type: this.getEntityType(decision.decision_type) as EntityType,
        action_type: this.getActionType(decision.decision_type) as ActionType,
        context: {
          confidence_score: decision.confidence_score,
          priority: decision.priority,
          ...decision.parameters,
        },
      };

      const permissionResult = await approvalService.checkPermission(permissionCheck);

      // If there's an error in permission check, default to requiring approval
      if (permissionResult.reason && !permissionResult.allowed && !permissionResult.requires_approval) {
        console.log('Permission check failed, defaulting to approval required:', permissionResult.reason);
        permissionResult.requires_approval = true;
      }

      if (permissionResult.requires_approval && !permissionResult.auto_approve_eligible) {
        // Create approval request
        const approvalPayload: CreateApprovalRequestPayload = {
          entity_type: this.getEntityType(decision.decision_type) as EntityType,
          entity_id: decision.parameters.entity_id,
          action_type: this.getActionType(decision.decision_type) as ActionType,
          current_data: await this.getCurrentData(decision),
          proposed_changes: decision.parameters,
          change_summary: this.generateChangeSummary(decision),
          request_reason: `AI suggested action with ${Math.round(decision.confidence_score * 100)}% confidence`,
          priority: decision.priority as any,
          is_urgent: decision.priority === 'urgent',
          metadata: {
            decision_id: decision.id,
            communication_id: decision.communication_id,
            confidence_score: decision.confidence_score,
          },
        };

        const approvalRequest = await approvalService.createApprovalRequest(
          approvalPayload,
          this.currentUserId
        );

        // Update decision status to pending approval
        await supabase
          .from('ai_decisions')
          .update({
            status: 'pending',
            parameters: {
              ...decision.parameters,
              approval_request_id: approvalRequest.id,
            },
          })
          .eq('id', decision.id);

        return {
          requiresApproval: true,
          approvalRequestId: approvalRequest.id,
        };
      } else if (permissionResult.allowed || permissionResult.auto_approve_eligible) {
        // Execute immediately
        const result = await this.executeDecision(decision);
        return {
          requiresApproval: false,
          executionResult: result,
        };
      } else {
        throw new Error(permissionResult.reason || 'Permission denied');
      }
    } catch (error: any) {
      console.error('Error processing decision with approval:', error);
      throw error;
    }
  }

  /**
   * Execute an approved decision
   */
  async executeDecision(decision: AIDecision): Promise<ExecutionResult> {
    try {
      // Check if we've already processed this decision
      if (this.processedDecisionIds.has(decision.id)) {
        console.log(`Decision ${decision.id} already processed, skipping`);
        return {
          success: true,
          message: 'Decision already processed',
          timestamp: new Date(),
        };
      }
      
      // Check if an action already exists for this decision
      const { data: existingAction } = await supabase
        .from('crm_action_queue')
        .select('id, status')
        .eq('decision_id', decision.id)
        .single();
      
      if (existingAction) {
        console.log(`Action already exists for decision ${decision.id} with status: ${existingAction.status}`);
        if (existingAction.status === 'completed') {
          this.processedDecisionIds.add(decision.id);
          return {
            success: true,
            message: 'Action already completed',
            timestamp: new Date(),
          };
        }
      }
      
      // Create CRM action from decision
      const action: CRMAction = {
        id: uuidv4(),
        decision_id: decision.id,
        action_type: decision.action_type,
        entity_type: this.getEntityType(decision.decision_type),
        operation: this.getOperation(decision.decision_type),
        payload: decision.parameters,
        status: 'queued',
        retry_count: 0,
        max_retries: 3,
      };

      // Add to queue
      await this.queueAction(action);

      // Execute immediately if not processing
      if (!this.isProcessing) {
        return await this.processAction(action);
      }

      return {
        success: true,
        message: 'Action queued for execution',
        timestamp: new Date(),
      };
    } catch (error: any) {
      console.error('Error executing decision:', error);
      return {
        success: false,
        message: error.message || 'Failed to execute decision',
        timestamp: new Date(),
      };
    }
  }

  /**
   * Queue an action for execution
   */
  private async queueAction(action: CRMAction): Promise<void> {
    // Check if action already exists for this decision
    const { data: existing } = await supabase
      .from('crm_action_queue')
      .select('id')
      .eq('decision_id', action.decision_id)
      .single();
    
    if (existing) {
      console.log(`Action already queued for decision ${action.decision_id}`);
      return;
    }
    
    // Save to database queue
    const { error } = await supabase
      .from('crm_action_queue')
      .insert({
        ...action,
        scheduled_for: action.scheduled_for?.toISOString(),
        executed_at: action.executed_at?.toISOString(),
      });

    if (error) {
      // Check if it's a duplicate key error
      if (error.message?.includes('duplicate')) {
        console.log('Action already exists in queue');
        return;
      }
      console.error('Error queuing action:', error);
    }

    // Add to memory queue only if not already there
    const inQueue = this.executionQueue.some(a => a.decision_id === action.decision_id);
    if (!inQueue) {
      this.executionQueue.push(action);
    }
  }

  /**
   * Process a single action
   */
  private async processAction(action: CRMAction): Promise<ExecutionResult> {
    try {
      // Check if action is already completed or processing
      const { data: existingAction } = await supabase
        .from('crm_action_queue')
        .select('status')
        .eq('id', action.id)
        .single();
      
      if (existingAction?.status === 'completed') {
        console.log(`Action ${action.id} already completed, skipping`);
        return {
          success: true,
          message: 'Action already completed',
          timestamp: new Date(),
        };
      }
      
      if (existingAction?.status === 'processing') {
        console.log(`Action ${action.id} already processing, skipping`);
        return {
          success: false,
          message: 'Action already being processed',
          timestamp: new Date(),
        };
      }

      // Update status to processing
      await this.updateActionStatus(action.id, 'processing');

      let result: ExecutionResult;

      // Execute based on decision type
      switch (action.entity_type) {
        case 'lead':
          result = await this.executeLeadAction(action);
          break;
        case 'client':
          result = await this.executeClientAction(action);
          break;
        case 'appointment':
          result = await this.executeAppointmentAction(action);
          break;
        case 'task':
          result = await this.executeTaskAction(action);
          break;
        case 'communication':
          result = await this.executeCommunicationAction(action);
          break;
        default:
          throw new Error(`Unknown entity type: ${action.entity_type}`);
      }

      // Update action as completed
      await this.updateActionStatus(action.id, 'completed', result);

      // Update decision status
      await this.updateDecisionStatus(action.decision_id, 'completed');
      
      // Mark decision as processed
      this.processedDecisionIds.add(action.decision_id);

      return result;
    } catch (error: any) {
      console.error('Error processing action:', error);

      // Handle retry logic
      if (action.retry_count < action.max_retries) {
        action.retry_count++;
        await this.updateActionStatus(action.id, 'queued', null, error.message);
        this.executionQueue.push(action);
        
        return {
          success: false,
          message: `Action failed, will retry (${action.retry_count}/${action.max_retries})`,
          timestamp: new Date(),
        };
      }

      // Mark as failed after max retries
      await this.updateActionStatus(action.id, 'failed', null, error.message);
      await this.updateDecisionStatus(action.decision_id, 'failed', error.message);

      return {
        success: false,
        message: error.message || 'Action execution failed',
        timestamp: new Date(),
      };
    }
  }

  /**
   * Execute lead-related actions
   */
  private async executeLeadAction(action: CRMAction): Promise<ExecutionResult> {
    const payload = action.payload as CreateLeadPayload;
    
    // Log the received payload for debugging
    console.log('🔍 CRM Lead Action Payload:', {
      operation: action.operation,
      payloadKeys: Object.keys(payload || {}),
      payload: payload
    });

    switch (action.operation) {
      case 'create':
        // Check for duplicate lead by phone number if provided
        if (payload?.phone) {
          const { data: existingLead } = await supabase
            .from('leads')
            .select('id, name, phone')
            .eq('phone', payload.phone)
            .single();
          
          if (existingLead) {
            console.log(`Lead with phone ${payload.phone} already exists: ${existingLead.name}`);
            return {
              success: true,
              entity_id: existingLead.id,
              entity_type: 'lead',
              message: `Lead already exists: ${existingLead.name}`,
              data: existingLead,
              timestamp: new Date(),
            };
          }
        }
        
        // Validate and provide defaults for required fields
        const leadData = {
          name: payload?.name || 'Unknown Lead',
          phone: payload?.phone || '',
          email: payload?.email || '',
          source: payload?.source || 'voice_crm',
          interested_in: payload?.interested_in || null,
          budget_min: payload?.budget_min || 0,
          budget_max: payload?.budget_max || 0,
          notes: payload?.notes || '',
          priority: payload?.priority || 'normal',
          stage: 'new',
          created_at: new Date().toISOString(),
        };
        
        // Log what we're about to insert
        console.log('📥 Inserting lead with data:', leadData);
        
        const { data: lead, error } = await supabase
          .from('leads')
          .insert(leadData)
          .select()
          .single();

        if (error) throw error;

        return {
          success: true,
          entity_id: lead.id,
          entity_type: 'lead',
          message: `Lead created: ${lead.name}`,
          data: lead,
          timestamp: new Date(),
        };

      case 'update':
        // Handle lead updates
        const { error: updateError } = await supabase
          .from('leads')
          .update(payload)
          .eq('id', action.entity_id);

        if (updateError) throw updateError;

        return {
          success: true,
          entity_id: action.entity_id,
          entity_type: 'lead',
          message: 'Lead updated successfully',
          timestamp: new Date(),
        };

      default:
        throw new Error(`Unsupported lead operation: ${action.operation}`);
    }
  }

  /**
   * Execute client-related actions
   */
  private async executeClientAction(action: CRMAction): Promise<ExecutionResult> {
    const payload = action.payload as UpdateClientPayload;

    switch (action.operation) {
      case 'update':
        const { error } = await supabase
          .from('clients')
          .update(payload.updates)
          .eq('id', payload.client_id);

        if (error) throw error;

        // Log the update as a note
        await supabase
          .from('client_communications')
          .insert({
            client_id: payload.client_id,
            communication_type: 'note',
            subject: 'Client information updated via Voice CRM',
            raw_content: JSON.stringify(payload.updates),
            direction: 'internal',
            status: 'completed',
          });

        return {
          success: true,
          entity_id: payload.client_id,
          entity_type: 'client',
          message: 'Client information updated',
          data: payload.updates,
          timestamp: new Date(),
        };

      case 'create':
        // Convert from lead or create new client
        const newClient = action.payload;
        const { data: client, error: createError } = await supabase
          .from('clients')
          .insert(newClient)
          .select()
          .single();

        if (createError) throw createError;

        return {
          success: true,
          entity_id: client.id,
          entity_type: 'client',
          message: `Client created: ${client.name}`,
          data: client,
          timestamp: new Date(),
        };

      default:
        throw new Error(`Unsupported client operation: ${action.operation}`);
    }
  }

  /**
   * Execute appointment-related actions
   */
  private async executeAppointmentAction(action: CRMAction): Promise<ExecutionResult> {
    const payload = action.payload as ScheduleAppointmentPayload;

    switch (action.operation) {
      case 'create':
        const { data: appointment, error } = await supabase
          .from('appointments')
          .insert({
            title: payload.title,
            description: payload.description,
            appointment_type: payload.appointment_type,
            client_id: payload.client_id,
            lead_id: payload.lead_id,
            property_id: payload.property_id,
            agent_id: payload.agent_id,
            start_time: payload.start_time,
            end_time: payload.end_time,
            location: payload.location,
            notes: payload.notes,
            status: 'scheduled',
            created_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (error) throw error;

        // Create notification for the appointment
        await this.createNotification(
          'appointment_scheduled',
          `New appointment: ${appointment.title}`,
          appointment.id
        );

        return {
          success: true,
          entity_id: appointment.id,
          entity_type: 'appointment',
          message: `Appointment scheduled: ${appointment.title}`,
          data: appointment,
          timestamp: new Date(),
        };

      case 'update':
        const { error: updateError } = await supabase
          .from('appointments')
          .update(payload)
          .eq('id', action.entity_id);

        if (updateError) throw updateError;

        return {
          success: true,
          entity_id: action.entity_id,
          entity_type: 'appointment',
          message: 'Appointment updated',
          timestamp: new Date(),
        };

      default:
        throw new Error(`Unsupported appointment operation: ${action.operation}`);
    }
  }

  /**
   * Execute task-related actions
   */
  private async executeTaskAction(action: CRMAction): Promise<ExecutionResult> {
    const payload = action.payload as CreateTaskPayload;

    // Create task in appropriate table (using notifications for now)
    const { data: task, error } = await supabase
      .from('notifications')
      .insert({
        id: uuidv4(),
        type: 'task',
        title: payload.title,
        message: payload.description || '',
        priority: payload.priority,
        status: 'pending',
        data: {
          task_type: payload.task_type,
          due_date: payload.due_date,
          assigned_to: payload.assigned_to,
          related_to: payload.related_to,
          tags: payload.tags,
        },
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    return {
      success: true,
      entity_id: task.id,
      entity_type: 'task',
      message: `Task created: ${task.title}`,
      data: task,
      timestamp: new Date(),
    };
  }

  /**
   * Execute communication-related actions
   */
  private async executeCommunicationAction(action: CRMAction): Promise<ExecutionResult> {
    const payload = action.payload;

    switch (action.operation) {
      case 'create':
        // Add note to communications
        const { data: note, error } = await supabase
          .from('client_communications')
          .insert({
            client_id: payload.entity_id,
            communication_type: 'note',
            subject: 'Voice CRM Note',
            raw_content: payload.note_content,
            direction: 'internal',
            status: 'completed',
            metadata: {
              source: 'voice_crm_decision',
              decision_id: action.decision_id,
            },
          })
          .select()
          .single();

        if (error) throw error;

        return {
          success: true,
          entity_id: note.id,
          entity_type: 'communication',
          message: 'Note added to CRM',
          data: note,
          timestamp: new Date(),
        };

      default:
        throw new Error(`Unsupported communication operation: ${action.operation}`);
    }
  }

  /**
   * Create a notification
   */
  private async createNotification(type: string, message: string, relatedId?: any): Promise<void> {
    try {
      await supabase
        .from('notifications')
        .insert({
          id: uuidv4(),
          type,
          title: type.replace(/_/g, ' ').toUpperCase(),
          message,
          status: 'unread',
          priority: 'normal',
          data: { related_id: relatedId },
          created_at: new Date().toISOString(),
        });
    } catch (error) {
      console.error('Error creating notification:', error);
    }
  }

  /**
   * Update action status in database
   */
  private async updateActionStatus(
    actionId: string,
    status: string,
    result?: any,
    error?: string
  ): Promise<void> {
    try {
      const updates: any = {
        status,
        updated_at: new Date().toISOString(),
      };

      if (status === 'completed') {
        updates.executed_at = new Date().toISOString();
        updates.result = result;
      }

      if (error) {
        updates.error = error;
      }

      await supabase
        .from('crm_action_queue')
        .update(updates)
        .eq('id', actionId);
    } catch (err) {
      console.error('Error updating action status:', err);
    }
  }

  /**
   * Update decision status
   */
  private async updateDecisionStatus(
    decisionId: string,
    status: string,
    error?: string
  ): Promise<void> {
    try {
      const updates: any = {
        status,
        updated_at: new Date().toISOString(),
      };

      if (status === 'completed') {
        updates.executed_at = new Date().toISOString();
      }

      if (error) {
        updates.error_message = error;
      }

      await supabase
        .from('ai_decisions')
        .update(updates)
        .eq('id', decisionId);
    } catch (err) {
      console.error('Error updating decision status:', err);
    }
  }

  /**
   * Start processing queued actions
   */
  private startQueueProcessor(): void {
    // Process queue every 5 seconds
    this.processingInterval = window.setInterval(async () => {
      if (this.isProcessing) return;

      this.isProcessing = true;

      try {
        // Check database for queued actions (not processing or completed)
        const { data: queuedActions } = await supabase
          .from('crm_action_queue')
          .select('*')
          .in('status', ['queued', 'failed'])
          .lt('retry_count', 3)
          .order('created_at', { ascending: true })
          .limit(5);

        if (queuedActions && queuedActions.length > 0) {
          for (const action of queuedActions) {
            // Skip if action is already in memory queue
            const inMemoryQueue = this.executionQueue.some(a => a.id === action.id);
            if (!inMemoryQueue) {
              await this.processAction(action);
            }
          }
        }

        // Process memory queue
        const processedIds = new Set<string>();
        while (this.executionQueue.length > 0) {
          const action = this.executionQueue.shift();
          if (action && !processedIds.has(action.id)) {
            processedIds.add(action.id);
            await this.processAction(action);
          }
        }
      } catch (error) {
        console.error('Error processing action queue:', error);
      } finally {
        this.isProcessing = false;
      }
    }, 5000);
  }

  /**
   * Stop the queue processor
   */
  stop(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
    this.isInitialized = false;
    this.isProcessing = false;
  }

  /**
   * Helper methods
   */
  private getEntityType(decisionType: string): CRMAction['entity_type'] {
    const mapping: Record<string, CRMAction['entity_type']> = {
      'create_lead': 'lead',
      'update_client': 'client',
      'schedule_appointment': 'appointment',
      'create_task': 'task',
      'update_property': 'property',
      'add_note': 'communication',
    };
    return mapping[decisionType] || 'client';
  }

  private getOperation(decisionType: string): CRMAction['operation'] {
    if (decisionType.startsWith('create')) return 'create';
    if (decisionType.startsWith('update')) return 'update';
    if (decisionType.startsWith('delete')) return 'delete';
    return 'create';
  }

  private getActionType(decisionType: string): ActionType {
    if (decisionType.startsWith('create')) return 'create';
    if (decisionType.startsWith('update')) return 'update';
    if (decisionType.startsWith('delete')) return 'delete';
    if (decisionType.startsWith('schedule')) return 'create';
    if (decisionType.includes('status')) return 'status_change';
    if (decisionType.includes('assign')) return 'assignment';
    return 'update';
  }

  private async getCurrentData(decision: AIDecision): Promise<Record<string, any>> {
    // Fetch current data based on entity type
    const entityType = this.getEntityType(decision.decision_type);
    const entityId = decision.parameters.entity_id || decision.parameters.client_id || decision.parameters.lead_id;
    
    if (!entityId) return {};

    try {
      let tableName = '';
      switch (entityType) {
        case 'client':
          tableName = 'clients';
          break;
        case 'lead':
          tableName = 'leads';
          break;
        case 'appointment':
          tableName = 'appointments';
          break;
        case 'property':
          tableName = 'properties';
          break;
        default:
          return {};
      }

      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('id', entityId)
        .single();

      if (error) {
        console.error('Error fetching current data:', error);
        return {};
      }

      return data || {};
    } catch (error) {
      console.error('Error getting current data:', error);
      return {};
    }
  }

  private generateChangeSummary(decision: AIDecision): string {
    const actionTitles: Record<string, string> = {
      'create_lead': 'Create new lead',
      'update_client': 'Update client information',
      'schedule_appointment': 'Schedule appointment',
      'create_task': 'Create task',
      'update_property': 'Update property details',
      'send_message': 'Send message',
      'add_note': 'Add note to CRM',
      'change_status': 'Change status',
      'assign_agent': 'Assign agent',
      'update_budget': 'Update budget range',
    };

    const title = actionTitles[decision.decision_type] || decision.decision_type;
    const params = decision.parameters;
    
    // Add specific details based on decision type
    let details = '';
    switch (decision.decision_type) {
      case 'create_lead':
        details = params.name ? ` for ${params.name}` : '';
        break;
      case 'schedule_appointment':
        details = params.title ? `: ${params.title}` : '';
        break;
      case 'create_task':
        details = params.title ? `: ${params.title}` : '';
        break;
      case 'update_client':
        const updateCount = Object.keys(params.updates || {}).length;
        details = ` (${updateCount} field${updateCount !== 1 ? 's' : ''})`;
        break;
    }

    return `${title}${details}`;
  }

  /**
   * Execute action after approval
   */
  async executeApprovedAction(approvalRequestId: string): Promise<ExecutionResult> {
    try {
      // Get the approval request details
      const { data: approvalRequest, error: fetchError } = await supabase
        .from('approval_requests')
        .select('*, ai_decisions!decision_id(*)')
        .eq('id', approvalRequestId)
        .single();

      if (fetchError || !approvalRequest) {
        throw new Error('Approval request not found');
      }

      // Check if the request is approved
      if (approvalRequest.status !== 'approved') {
        throw new Error('Approval request is not approved');
      }

      // Get the associated decision
      const decision = approvalRequest.ai_decisions;
      if (!decision) {
        throw new Error('Associated decision not found');
      }

      // Use the modified data if provided, otherwise use original parameters
      const finalParameters = approvalRequest.proposed_changes || decision.parameters;
      
      // Execute the decision with final parameters
      const modifiedDecision: AIDecision = {
        ...decision,
        parameters: finalParameters,
      };

      return await this.executeDecision(modifiedDecision);
    } catch (error: any) {
      console.error('Error executing approved action:', error);
      return {
        success: false,
        message: error.message || 'Failed to execute approved action',
        timestamp: new Date(),
      };
    }
  }

  /**
   * Reverse an executed action
   */
  async reverseAction(actionId: string): Promise<ExecutionResult> {
    try {
      // Get the action details
      const { data: action, error } = await supabase
        .from('crm_action_queue')
        .select('*')
        .eq('id', actionId)
        .single();

      if (error || !action) {
        throw new Error('Action not found');
      }

      if (action.status !== 'completed') {
        throw new Error('Can only reverse completed actions');
      }

      // Implement reverse logic based on action type
      // This is a simplified version - in production, implement proper reversal
      let reverseResult: ExecutionResult = {
        success: false,
        message: 'Reversal not implemented for this action type',
        timestamp: new Date(),
      };

      // Mark original action as reversed
      await supabase
        .from('crm_action_queue')
        .update({
          status: 'reversed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', actionId);

      return reverseResult;
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to reverse action',
        timestamp: new Date(),
      };
    }
  }
}

// Export singleton instance
export const crmActionsService = new CRMActionsService();