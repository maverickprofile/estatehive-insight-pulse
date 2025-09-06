import { supabase } from '@/lib/supabaseClient';
import { v4 as uuidv4 } from 'uuid';
import {
  ApprovalRequest,
  ApprovalWorkflow,
  ApprovalStatus,
  EntityType,
  ActionType,
  Priority,
  PermissionCheck,
  PermissionResult,
  CreateApprovalRequestPayload,
  ApprovalAction
} from '@/types/approval.types';

/**
 * Simplified Approval Service - No role system
 * All actions require approval through workflows
 */
class ApprovalService {
  private static instance: ApprovalService;
  private workflowCache: Map<string, ApprovalWorkflow[]> = new Map();
  private organizationId?: string;

  private constructor() {}

  static getInstance(): ApprovalService {
    if (!ApprovalService.instance) {
      ApprovalService.instance = new ApprovalService();
    }
    return ApprovalService.instance;
  }

  /**
   * Initialize the approval service
   */
  async initialize(organizationId?: string): Promise<void> {
    this.organizationId = organizationId;
    console.log('Approval Service initialized (simplified - no roles)');
    await this.loadWorkflows();
  }

  /**
   * Check if a user has permission to perform an action
   */
  async checkPermission(check: PermissionCheck): Promise<PermissionResult> {
    try {
      // Simplified: Always check workflow, no direct permissions
      const workflow = await this.findApplicableWorkflow(
        check.entity_type,
        check.action_type,
        check.context
      );

      // Check auto-approval eligibility based on confidence
      const autoApproveEligible = await this.checkAutoApprovalEligibility(
        check,
        workflow
      );

      // Always require approval unless auto-approved
      const requiresApproval = !autoApproveEligible;
      
      return {
        allowed: false, // Never allow direct action without workflow
        requires_approval: requiresApproval,
        workflow,
        bypass_reason: undefined,
        auto_approve_eligible: autoApproveEligible
      };
    } catch (error) {
      console.error('Error checking permission:', error);
      return {
        allowed: false,
        requires_approval: false,
        reason: error.message || 'Permission check failed'
      };
    }
  }

  /**
   * Create an approval request
   */
  async createApprovalRequest(
    payload: CreateApprovalRequestPayload,
    userId: string
  ): Promise<ApprovalRequest> {
    try {
      // Find applicable workflow
      const workflow = await this.findApplicableWorkflow(
        payload.entity_type,
        payload.action_type,
        payload.proposed_changes
      );

      // Get organization ID from localStorage or generate a new one
      const organizationId = localStorage.getItem('organizationId') || (() => {
        const newId = uuidv4();
        localStorage.setItem('organizationId', newId);
        return newId;
      })();

      // Create approval request
      const request: Partial<ApprovalRequest> = {
        id: uuidv4(),
        organization_id: organizationId,
        entity_type: payload.entity_type,
        entity_id: payload.entity_id,
        action_type: payload.action_type,
        decision_id: payload.decision_id,
        requested_by: userId,
        requested_at: new Date().toISOString(),
        workflow_id: workflow?.id,
        current_level: 1,
        max_level: workflow?.approval_levels || 1,
        status: 'pending' as ApprovalStatus,
        priority: payload.priority || 'medium' as Priority,
        change_summary: payload.change_summary,
        proposed_changes: payload.proposed_changes,
        metadata: payload.metadata || {},
        expires_at: payload.expires_at || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      };

      const { data, error } = await supabase
        .from('approval_requests')
        .insert(request)
        .select()
        .single();

      if (error) throw error;

      // Send notification to Telegram if integrated
      try {
        const { telegramApprovalIntegration } = await import('./telegram-approval-integration.service');
        
        // Initialize if needed (with organization ID from request)
        if (!telegramApprovalIntegration.isServiceInitialized()) {
          await telegramApprovalIntegration.initialize(organizationId);
        }
        
        // Send approval to Telegram with buttons
        await telegramApprovalIntegration.sendApprovalToTelegram(data);
      } catch (telegramError) {
        console.error('Error sending approval to Telegram:', telegramError);
        // Don't fail the approval creation if Telegram fails
      }

      return data;
    } catch (error) {
      console.error('Error creating approval request:', error);
      throw error;
    }
  }

  /**
   * Approve a request
   */
  async approveRequest(
    requestId: string,
    approverId: string,
    notes?: string
  ): Promise<ApprovalAction> {
    try {
      const { data: request, error: fetchError } = await supabase
        .from('approval_requests')
        .select('*')
        .eq('id', requestId)
        .single();

      if (fetchError) throw fetchError;
      if (!request) throw new Error('Approval request not found');

      // Update the request
      const { data, error } = await supabase
        .from('approval_requests')
        .update({
          status: 'approved' as ApprovalStatus,
          approved_by: approverId,
          approved_at: new Date().toISOString(),
          approval_notes: notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId)
        .select()
        .single();

      if (error) throw error;

      // Log the approval
      await this.logApprovalAction(data, 'approve', approverId, notes);

      return {
        success: true,
        request: data,
        message: 'Request approved successfully'
      };
    } catch (error) {
      console.error('Error approving request:', error);
      return {
        success: false,
        error: error.message || 'Failed to approve request'
      };
    }
  }

  /**
   * Reject a request
   */
  async rejectRequest(
    requestId: string,
    rejectorId: string,
    reason: string
  ): Promise<ApprovalAction> {
    try {
      const { data: request, error: fetchError } = await supabase
        .from('approval_requests')
        .select('*')
        .eq('id', requestId)
        .single();

      if (fetchError) throw fetchError;
      if (!request) throw new Error('Approval request not found');

      // Update the request
      const { data, error } = await supabase
        .from('approval_requests')
        .update({
          status: 'rejected' as ApprovalStatus,
          rejected_by: rejectorId,
          rejected_at: new Date().toISOString(),
          rejection_reason: reason,
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId)
        .select()
        .single();

      if (error) throw error;

      // Log the rejection
      await this.logApprovalAction(data, 'reject', rejectorId, reason);

      return {
        success: true,
        request: data,
        message: 'Request rejected successfully'
      };
    } catch (error) {
      console.error('Error rejecting request:', error);
      return {
        success: false,
        error: error.message || 'Failed to reject request'
      };
    }
  }

  /**
   * Get pending approval requests
   */
  async getPendingRequests(
    organizationId?: string,
    userId?: string
  ): Promise<ApprovalRequest[]> {
    try {
      let query = supabase
        .from('approval_requests')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (organizationId) {
        query = query.eq('organization_id', organizationId);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching pending requests:', error);
      return [];
    }
  }

  // =====================================================
  // PRIVATE HELPER METHODS
  // =====================================================

  private async loadWorkflows(): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('approval_workflows')
        .select('*')
        .eq('is_active', true);

      if (error) {
        console.error('Error loading workflows:', error);
        return;
      }

      // Cache workflows by organization
      const workflowsByOrg = new Map<string, ApprovalWorkflow[]>();
      for (const workflow of data || []) {
        const orgWorkflows = workflowsByOrg.get(workflow.organization_id) || [];
        orgWorkflows.push(workflow);
        workflowsByOrg.set(workflow.organization_id, orgWorkflows);
      }

      this.workflowCache = workflowsByOrg;
    } catch (error) {
      console.error('Error loading workflows:', error);
    }
  }

  private async findApplicableWorkflow(
    entityType: EntityType,
    actionType: ActionType,
    context?: any
  ): Promise<ApprovalWorkflow | null> {
    // Get organization workflows
    const organizationId = this.organizationId || 
      localStorage.getItem('organizationId') || 
      'default';
      
    const workflows = this.workflowCache.get(organizationId) || [];

    // Find matching workflow
    for (const workflow of workflows) {
      if (
        (workflow.entity_type === entityType || workflow.entity_type === 'all') &&
        (workflow.action_type === actionType || workflow.action_type === 'all')
      ) {
        // Check additional conditions if any
        if (workflow.conditions && Object.keys(workflow.conditions).length > 0) {
          if (this.evaluateConditions(workflow.conditions, context)) {
            return workflow;
          }
        } else {
          return workflow;
        }
      }
    }

    // Return default workflow if exists
    return workflows.find(w => w.is_default) || null;
  }

  private evaluateConditions(conditions: any, context: any): boolean {
    // Simple condition evaluation
    for (const [key, value] of Object.entries(conditions)) {
      if (context?.[key] !== value) {
        return false;
      }
    }
    return true;
  }

  private async checkAutoApprovalEligibility(
    check: PermissionCheck,
    workflow: ApprovalWorkflow | null
  ): Promise<boolean> {
    if (!workflow?.auto_approve_enabled) {
      return false;
    }

    const conditions = workflow.auto_approve_conditions as any;
    
    // Check confidence threshold if AI decision
    if (conditions?.confidence_threshold && check.context?.confidence_score) {
      return check.context.confidence_score >= conditions.confidence_threshold;
    }

    // Check amount threshold
    if (conditions?.max_amount && check.context?.amount) {
      return check.context.amount <= conditions.max_amount;
    }

    // Default to not auto-approving
    return false;
  }

  private async logApprovalAction(
    request: ApprovalRequest,
    action: 'approve' | 'reject',
    userId: string,
    notes?: string
  ): Promise<void> {
    try {
      await supabase
        .from('audit_logs')
        .insert({
          id: uuidv4(),
          organization_id: request.organization_id,
          event_type: 'approval_action',
          entity_type: request.entity_type,
          entity_id: request.entity_id,
          user_id: userId,
          action,
          description: `${action === 'approve' ? 'Approved' : 'Rejected'} ${request.action_type} for ${request.entity_type}`,
          metadata: {
            request_id: request.id,
            notes,
            decision_id: request.decision_id,
            confidence_score: request.metadata?.confidence_score,
            amount: request.metadata?.amount
          }
        });
    } catch (error) {
      console.error('Error logging approval action:', error);
    }
  }
}

export const approvalService = ApprovalService.getInstance();