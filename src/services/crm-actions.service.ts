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

class CRMActionsService {
  private executionQueue: CRMAction[] = [];
  private isProcessing = false;
  private processingInterval: number | null = null;

  /**
   * Initialize the CRM Actions Service
   */
  async initialize(): Promise<void> {
    // Start processing queue
    this.startQueueProcessor();
    console.log('CRM Actions Service initialized');
  }

  /**
   * Execute an approved decision
   */
  async executeDecision(decision: AIDecision): Promise<ExecutionResult> {
    try {
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
    // Save to database queue
    const { error } = await supabase
      .from('crm_action_queue')
      .insert({
        ...action,
        scheduled_for: action.scheduled_for?.toISOString(),
        executed_at: action.executed_at?.toISOString(),
      });

    if (error) {
      console.error('Error queuing action:', error);
    }

    // Add to memory queue
    this.executionQueue.push(action);
  }

  /**
   * Process a single action
   */
  private async processAction(action: CRMAction): Promise<ExecutionResult> {
    try {
      // Update status to processing
      await this.updateActionStatus(action.id, 'processing');

      let result: ExecutionResult;

      // Execute based on decision type
      switch (action.entity_type) {
        case 'lead':
          result = await this.executeLead

Action(action);
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

    switch (action.operation) {
      case 'create':
        const { data: lead, error } = await supabase
          .from('leads')
          .insert({
            name: payload.name,
            phone: payload.phone,
            email: payload.email,
            source: payload.source || 'voice_crm',
            interested_in: payload.interested_in,
            budget_min: payload.budget_min,
            budget_max: payload.budget_max,
            notes: payload.notes,
            priority: payload.priority || 'normal',
            stage: 'new',
            created_at: new Date().toISOString(),
          })
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
      if (this.isProcessing || this.executionQueue.length === 0) return;

      this.isProcessing = true;

      try {
        // Also check database for queued actions
        const { data: queuedActions } = await supabase
          .from('crm_action_queue')
          .select('*')
          .eq('status', 'queued')
          .order('created_at', { ascending: true })
          .limit(5);

        if (queuedActions && queuedActions.length > 0) {
          for (const action of queuedActions) {
            await this.processAction(action);
          }
        }

        // Process memory queue
        while (this.executionQueue.length > 0) {
          const action = this.executionQueue.shift();
          if (action) {
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