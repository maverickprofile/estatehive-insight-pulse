import { supabase } from '@/lib/supabaseClient';
import { v4 as uuidv4 } from 'uuid';
import {
  UserRole,
  ApprovalWorkflow,
  ApprovalRequest,
  ApprovalAction,
  CreateApprovalRequestPayload,
  ApprovalActionPayload,
  ApprovalPreview,
  PermissionCheck,
  PermissionResult,
  EntityType,
  ActionType,
  ApprovalStatus,
  ChangedField,
  ApproverInfo,
  Priority
} from '@/types/approval.types';

class ApprovalService {
  private static instance: ApprovalService;
  private userRoleCache: Map<string, UserRole[]> = new Map();
  private workflowCache: Map<string, ApprovalWorkflow[]> = new Map();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  private constructor() {}

  public static getInstance(): ApprovalService {
    if (!ApprovalService.instance) {
      ApprovalService.instance = new ApprovalService();
    }
    return ApprovalService.instance;
  }

  /**
   * Initialize the approval service
   */
  async initialize(): Promise<void> {
    console.log('Approval Service initialized');
    // Simplified: Only load workflows, no role system
    await this.loadWorkflows();
  }

  /**
   * Check if a user has permission to perform an action
   */
  async checkPermission(check: PermissionCheck): Promise<PermissionResult> {
    try {
      // Simplified: No role checking
      const userRoles: any[] = [];
      const hasDirectPermission = false; // Always require workflow
      
      // Find applicable workflow
      const workflow = await this.findApplicableWorkflow(
        check.entity_type,
        check.action_type,
        check.context
      );

      // Simplified: No role-based bypass
      const canBypass = false;

      // Check auto-approval eligibility
      const autoApproveEligible = await this.checkAutoApprovalEligibility(
        check,
        workflow
      );

      // Default to requiring approval if no direct permission and no auto-approval
      const requiresApproval = !hasDirectPermission && !canBypass && !autoApproveEligible;
      
      return {
        allowed: hasDirectPermission || canBypass,
        requires_approval: requiresApproval,
        workflow,
        bypass_reason: canBypass ? 'User role can bypass this workflow' : undefined,
        auto_approve_eligible: autoApproveEligible,
        reason: !workflow && requiresApproval ? 'No workflow defined, defaulting to approval required' : undefined
      };
    } catch (error: any) {
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

      // Create approval request with only essential fields that exist in the database
      const request: any = {
        id: uuidv4(),
        organization_id: organizationId,
        entity_type: payload.entity_type,
        entity_id: payload.entity_id,
        action_type: payload.action_type,
        requested_by: userId,
        requested_at: new Date(),
        status: 'pending',
        priority: payload.priority || 'medium',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
        created_at: new Date(),
        updated_at: new Date()
      };

      // Store all additional data in metadata to avoid column errors
      request.metadata = {
        ...(payload.metadata || {}),
        proposed_changes: payload.proposed_changes,
        current_data: payload.current_data,
        change_summary: payload.change_summary || this.generateChangeSummary(
          payload.current_data,
          payload.proposed_changes
        ),
        request_reason: payload.request_reason,
        tags: payload.tags,
        is_urgent: payload.is_urgent
      };
      
      // Add workflow_id if exists
      if (workflow?.id) request.workflow_id = workflow.id;

      // Save to database
      const { data, error } = await supabase
        .from('approval_requests')
        .insert(request)
        .select()
        .single();

      if (error) throw error;

      // Notify approvers
      await this.notifyApprovers(data, workflow);
      
      // Send notification to Telegram with approval buttons
      // Import the integration service at the top of the file if needed
      try {
        const { telegramApprovalIntegration } = await import('./telegram-approval-integration.service');
        
        // Initialize if needed (with organization ID from request)
        if (!telegramApprovalIntegration.isServiceInitialized()) {
          await telegramApprovalIntegration.initialize(request.organization_id as string);
        }
        
        await telegramApprovalIntegration.sendApprovalToTelegram(data);
        console.log('Approval notification sent to Telegram with buttons');
      } catch (telegramError) {
        console.error('Error sending approval to Telegram:', telegramError);
        // Don't throw - Telegram notification is not critical
      }

      return data;
    } catch (error: any) {
      console.error('Error creating approval request:', error);
      throw error;
    }
  }

  /**
   * Process an approval action
   */
  async processApprovalAction(
    payload: ApprovalActionPayload,
    userId?: string
  ): Promise<ApprovalAction> {
    try {
      // Get the request
      const { data: request, error: requestError } = await supabase
        .from('approval_requests')
        .select('*')
        .eq('id', payload.request_id)
        .single();

      if (requestError) throw requestError;

      // Get current user if not provided
      if (!userId) {
        const { data: userData } = await supabase.auth.getUser();
        userId = userData?.user?.id || 'system';
      }
      
      // Verify user can approve (skip for system user)
      if (userId !== 'system') {
        const canApprove = await this.canUserApprove(userId, request);
        if (!canApprove) {
          throw new Error('User does not have permission to approve this request');
        }
      }

      // Create approval action object
      const action: ApprovalAction = {
        id: uuidv4(),
        request_id: payload.request_id,
        user_id: userId,
        action: payload.action,
        modified_data: payload.modified_data,
        reason: payload.reason,
        notes: payload.notes,
        action_taken_at: new Date(),
        created_at: new Date()
      };

      // Try to save action to approval_actions table if it exists
      try {
        const { data: actionData } = await supabase
          .from('approval_actions')
          .insert(action)
          .select()
          .single();
        
        if (actionData) {
          console.log('Approval action saved to approval_actions table');
        }
      } catch (actionError: any) {
        // If table doesn't exist, just log and continue
        if (actionError.message?.includes('relation') || actionError.code === 'PGRST205') {
          console.log('approval_actions table not found, skipping action logging');
        } else {
          console.error('Error saving approval action:', actionError);
        }
      }

      // Update request status directly in approval_requests table
      await this.updateRequestStatus(request, payload.action, userId, payload.reason);

      // If approved, execute the action
      if (payload.action === 'approve') {
        await this.executeApprovedAction(request, payload.modified_data);
      }

      return action;
    } catch (error: any) {
      console.error('Error processing approval action:', error);
      throw error;
    }
  }

  /**
   * Get approval preview for a request
   */
  async getApprovalPreview(requestId: string, userId: string): Promise<ApprovalPreview> {
    try {
      // Get request first
      const { data: request, error } = await supabase
        .from('approval_requests')
        .select('*')
        .eq('id', requestId)
        .single();

      if (error) throw error;

      // Get workflow separately if workflow_id exists
      let workflow = null;
      if (request.workflow_id) {
        const { data: workflowData, error: workflowError } = await supabase
          .from('approval_workflows')
          .select('*')
          .eq('id', request.workflow_id)
          .single();
        
        if (!workflowError) {
          workflow = workflowData;
        } else {
          console.log('Could not fetch workflow:', workflowError.message);
        }
      }

      // Get changed fields from metadata if columns don't exist
      const currentData = request.current_data || request.metadata?.current_data || {};
      const proposedChanges = request.proposed_changes || request.metadata?.proposed_changes || {};
      
      const changedFields = this.compareData(currentData, proposedChanges);

      // Get required approvers
      const approvers = await this.getRequiredApprovers(request);

      // Check if user can approve
      const userCanApprove = await this.canUserApprove(userId, request);

      // Check auto-approval eligibility
      const canAutoApprove = await this.checkAutoApprovalEligibility(
        {
          user_id: userId,
          entity_type: request.entity_type,
          action_type: request.action_type,
          context: request.proposed_changes || request.metadata?.proposed_changes
        },
        workflow
      );

      return {
        request,
        workflow: workflow,
        current_data: request.current_data || request.metadata?.current_data || {},
        proposed_changes: request.proposed_changes || request.metadata?.proposed_changes || {},
        changed_fields: changedFields,
        required_approvers: approvers,
        can_auto_approve: canAutoApprove,
        user_can_approve: userCanApprove
      };
    } catch (error: any) {
      console.error('Error getting approval preview:', error);
      throw error;
    }
  }

  /**
   * Get pending approvals for a user
   */
  async getPendingApprovals(userId: string): Promise<ApprovalRequest[]> {
    try {
      // Get user's roles
      const userRoles = await this.getUserRoles(userId);
      const roleCodes = userRoles.map(r => r.role_code);

      // Get pending approvals
      const { data, error } = await supabase
        .from('approval_requests')
        .select(`
          *,
          workflow:approval_workflows!left(*)
        `)
        .eq('status', 'pending')
        .contains('workflow.required_approvers', roleCodes)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error: any) {
      console.error('Error getting pending approvals:', error);
      return [];
    }
  }

  /**
   * Auto-approve if eligible
   */
  async autoApproveIfEligible(request: ApprovalRequest): Promise<boolean> {
    try {
      // Check auto-approval rules
      const { data: rules, error } = await supabase
        .from('auto_approval_rules')
        .select('*')
        .eq('entity_type', request.entity_type)
        .eq('action_type', request.action_type)
        .eq('is_active', true)
        ;

      if (error) throw error;

      for (const rule of rules || []) {
        if (this.matchesAutoApprovalRule(request, rule)) {
          // Auto-approve the request
          await this.updateRequestStatus(request, 'auto_approved', 'system', `Auto-approved by rule: ${rule.rule_name}`);
          
          // Try to log auto-approval if approval_actions table exists
          try {
            await supabase.from('approval_actions').insert({
              request_id: request.id,
              user_id: 'system',
              action: 'approve',
              reason: `Auto-approved by rule: ${rule.rule_name}`,
              action_taken_at: new Date()
            });
          } catch (error: any) {
            if (error.code !== 'PGRST205') {
              console.error('Error logging auto-approval action:', error);
            }
          }

          // Execute the action
          await this.executeApprovedAction(request);

          // Update rule usage if table exists
          try {
            await supabase
              .from('auto_approval_rules')
              .update({
                usage_count: rule.usage_count + 1,
                last_used_at: new Date()
              })
              .eq('id', rule.id);
          } catch (error: any) {
            if (error.code !== 'PGRST205') {
              console.error('Error updating rule usage:', error);
            }
          }

          return true;
        }

        if (rule.stop_on_match) break;
      }

      return false;
    } catch (error: any) {
      console.error('Error checking auto-approval:', error);
      return false;
    }
  }

  // =====================================================
  // PRIVATE HELPER METHODS
  // =====================================================

  private async loadUserRoles(): Promise<void> {
    // Role system removed - no longer loading user roles
    return;
    /*
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;

      // Cache roles by organization
      const rolesByOrg = new Map<string, UserRole[]>();
      for (const role of data || []) {
        const orgRoles = rolesByOrg.get(role.organization_id) || [];
        orgRoles.push(role);
        rolesByOrg.set(role.organization_id, orgRoles);
      }

      this.userRoleCache = rolesByOrg;
    } catch (error) {
      console.error('Error loading user roles:', error);
    }
    */
  }

  private async loadWorkflows(): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('approval_workflows')
        .select('*')
        .eq('is_active', true);

      if (error) {
        // If table doesn't exist, just log and continue
        if (error.message?.includes('relation') || error.message?.includes('does not exist')) {
          console.log('Approval workflows table not found, workflows will be disabled');
          this.workflowCache = new Map();
          return;
        }
        throw error;
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
      this.workflowCache = new Map();
    }
  }

  private async getUserRoles(userId: string): Promise<UserRole[]> {
    // Try to get user roles, but if the table doesn't exist, return empty array
    try {
      const { data, error } = await supabase
        .from('user_role_assignments')
        .select(`
          role:user_roles(*)
        `)
        .eq('user_id', userId)
        .eq('is_active', true);

      if (error) {
        // If table doesn't exist, just return empty roles (everyone gets default permissions)
        if (error.message?.includes('404') || error.message?.includes('not found')) {
          console.log('User roles table not found, using default permissions');
          return [];
        }
        console.error('Error getting user roles:', error);
        return [];
      }

      return data?.map(d => d.role).filter(Boolean) as UserRole[] || [];
    } catch (error) {
      console.error('Unexpected error getting user roles:', error);
      return [];
    }
  }

  private hasDirectPermission(
    userRoles: UserRole[],
    entityType: EntityType,
    actionType: ActionType
  ): boolean {
    for (const role of userRoles) {
      // Admin has all permissions
      if (role.role_code === 'admin') return true;

      // Check specific permissions
      const permissions = role.permissions;
      const actionPermissions = permissions[actionType as keyof typeof permissions] || [];
      
      if (actionPermissions.includes('*') || actionPermissions.includes(entityType)) {
        return true;
      }
    }

    return false;
  }

  private async findApplicableWorkflow(
    entityType: EntityType,
    actionType: ActionType,
    context?: Record<string, any>
  ): Promise<ApprovalWorkflow | undefined> {
    const { data: userData } = await supabase.auth.getUser();
    const organizationId = userData?.user?.id;

    const workflows = this.workflowCache.get(organizationId || '') || [];

    for (const workflow of workflows) {
      if (
        workflow.entity_type === entityType &&
        workflow.action_type === actionType &&
        workflow.is_active
      ) {
        // Check trigger conditions
        if (this.matchesTriggerConditions(workflow.trigger_conditions, context)) {
          return workflow;
        }
      }
    }

    return undefined;
  }

  private matchesTriggerConditions(
    conditions?: Record<string, any>,
    context?: Record<string, any>
  ): boolean {
    if (!conditions || Object.keys(conditions).length === 0) return true;
    if (!context) return false;

    for (const [key, condition] of Object.entries(conditions)) {
      const value = context[key];

      if (!this.evaluateCondition(value, condition)) {
        return false;
      }
    }

    return true;
  }

  private evaluateCondition(value: any, condition: any): boolean {
    if (typeof condition === 'object' && condition !== null) {
      if (condition.gte !== undefined && value < condition.gte) return false;
      if (condition.gt !== undefined && value <= condition.gt) return false;
      if (condition.lte !== undefined && value > condition.lte) return false;
      if (condition.lt !== undefined && value >= condition.lt) return false;
      if (condition.eq !== undefined && value !== condition.eq) return false;
      if (condition.neq !== undefined && value === condition.neq) return false;
      if (condition.in !== undefined && !condition.in.includes(value)) return false;
      if (condition.nin !== undefined && condition.nin.includes(value)) return false;
    } else {
      if (value !== condition) return false;
    }

    return true;
  }

  private canBypassWorkflow(userRoles: UserRole[], workflow: ApprovalWorkflow): boolean {
    const roleCodes = userRoles.map(r => r.role_code);
    const bypassRoles = workflow.bypass_roles || [];

    return bypassRoles.some(role => roleCodes.includes(role));
  }

  private async checkAutoApprovalEligibility(
    check: PermissionCheck,
    workflow?: ApprovalWorkflow
  ): Promise<boolean> {
    if (!workflow?.auto_approve_conditions) return false;

    const conditions = workflow.auto_approve_conditions;
    const context = check.context || {};

    return this.matchesTriggerConditions(conditions, context);
  }

  private generateChangeSummary(
    currentData?: Record<string, any>,
    proposedChanges?: Record<string, any>
  ): string {
    if (!currentData || !proposedChanges) return '';

    const changes: string[] = [];
    for (const [key, value] of Object.entries(proposedChanges)) {
      if (currentData[key] !== value) {
        changes.push(`${key}: ${currentData[key]} → ${value}`);
      }
    }

    return changes.join(', ');
  }

  private compareData(
    currentData: Record<string, any>,
    proposedChanges: Record<string, any>
  ): ChangedField[] {
    const changedFields: ChangedField[] = [];

    // Check for modified and added fields
    for (const [key, newValue] of Object.entries(proposedChanges)) {
      const oldValue = currentData[key];
      
      if (oldValue === undefined) {
        changedFields.push({
          field_name: key,
          field_label: this.formatFieldLabel(key),
          old_value: null,
          new_value: newValue,
          change_type: 'added'
        });
      } else if (oldValue !== newValue) {
        changedFields.push({
          field_name: key,
          field_label: this.formatFieldLabel(key),
          old_value: oldValue,
          new_value: newValue,
          change_type: 'modified'
        });
      }
    }

    // Check for deleted fields
    for (const [key, oldValue] of Object.entries(currentData)) {
      if (!(key in proposedChanges)) {
        changedFields.push({
          field_name: key,
          field_label: this.formatFieldLabel(key),
          old_value: oldValue,
          new_value: null,
          change_type: 'deleted'
        });
      }
    }

    return changedFields;
  }

  private formatFieldLabel(fieldName: string): string {
    return fieldName
      .replace(/_/g, ' ')
      .replace(/([A-Z])/g, ' $1')
      .trim()
      .replace(/\b\w/g, l => l.toUpperCase());
  }

  private async notifyApprovers(
    request: ApprovalRequest,
    workflow?: ApprovalWorkflow
  ): Promise<void> {
    if (!workflow) return;

    try {
      // Get users with required roles
      const { data: assignments } = await supabase
        .from('user_role_assignments')
        .select(`
          user_id,
          role:user_roles(role_code)
        `)
        .in('role.role_code', workflow.required_approvers)
        .eq('is_active', true);

      const approverIds = assignments?.map(a => a.user_id) || [];

      // Create notifications
      for (const approverId of approverIds) {
        await supabase.from('notifications').insert({
          user_id: approverId,
          type: 'approval_request',
          title: `New Approval Request: ${request.change_summary}`,
          message: `Please review and approve the ${request.entity_type} ${request.action_type} request`,
          data: {
            request_id: request.id,
            entity_type: request.entity_type,
            action_type: request.action_type,
            priority: request.priority
          },
          is_read: false
        });
      }
    } catch (error) {
      console.error('Error notifying approvers:', error);
    }
  }

  private async canUserApprove(userId: string, request: ApprovalRequest): Promise<boolean> {
    // If no workflow_id, allow any user to approve
    if (!request.workflow_id) return true;
    
    // Get user roles
    const userRoles = await this.getUserRoles(userId);
    const roleCodes = userRoles.map(r => r.role_code);

    // Get workflow
    const { data: workflow, error } = await supabase
      .from('approval_workflows')
      .select('*')
      .eq('id', request.workflow_id)
      .single();

    // If workflow table doesn't exist or workflow not found, allow approval
    if (error || !workflow) return true;

    // Check if user has required role
    return workflow.required_approvers.some((role: string) => roleCodes.includes(role));
  }

  private async updateRequestStatus(
    request: ApprovalRequest,
    action: string,
    userId?: string,
    reason?: string
  ): Promise<void> {
    // Build update data with only the columns that exist
    let updateData: any = {
      updated_at: new Date()
    };

    if (action === 'approve') {
      updateData.status = 'approved';
      
      // Try to update optional columns if they exist
      if (userId) updateData.approved_by = userId;
      if (reason) updateData.approval_notes = reason;
      
      // Try to set approved_at if column exists
      updateData.approved_at = new Date();

    } else if (action === 'reject') {
      updateData.status = 'rejected';
      
      // Try to update optional columns if they exist  
      if (userId) updateData.rejected_by = userId;
      if (reason) updateData.rejection_reason = reason;
      
      // Try to set rejected_at if column exists
      updateData.rejected_at = new Date();

    } else if (action === 'request_changes') {
      updateData.status = 'changes_requested';
      if (reason) updateData.approval_notes = reason;

    } else if (action === 'auto_approved') {
      updateData.status = 'auto_approved';
      updateData.approved_at = new Date();
      updateData.approval_notes = 'Auto-approved by system';
    }

    // Try to update with all fields first
    const { error: fullError } = await supabase
      .from('approval_requests')
      .update(updateData)
      .eq('id', request.id);

    // If we get a column error, try with just the basic fields
    if (fullError && fullError.code === 'PGRST204') {
      console.log('Some columns missing, updating with basic fields only');
      
      const basicUpdate: any = {
        status: updateData.status,
        updated_at: updateData.updated_at
      };

      const { error: basicError } = await supabase
        .from('approval_requests')
        .update(basicUpdate)
        .eq('id', request.id);

      if (basicError) {
        console.error('Error updating request status (basic):', basicError);
        throw basicError;
      }
    } else if (fullError) {
      console.error('Error updating request status:', fullError);
      throw fullError;
    }
  }

  private async executeApprovedAction(
    request: ApprovalRequest,
    modifiedData?: Record<string, any>
  ): Promise<void> {
    try {
      // Check if action has already been executed for this request
      const { data: existingAction } = await supabase
        .from('approval_actions')
        .select('id, action_type, status')
        .eq('request_id', request.id)
        .eq('status', 'executed')
        .single();
      
      if (existingAction) {
        console.log(`Action already executed for approval request ${request.id}`);
        return;
      }
      
      // Import CRM service dynamically to avoid circular dependency
      const { crmActionsService } = await import('./crm-actions.service');
      
      // Initialize CRM service if needed
      const { data: userData } = await supabase.auth.getUser();
      if (userData?.user?.id) {
        await crmActionsService.initialize(userData.user.id);
      }
      
      // Extract the actual data from various possible locations
      // Since we store data in metadata.proposed_changes, extract it properly
      let actualData = {};
      
      // Check if modifiedData has actual data (not just an empty object)
      if (modifiedData && typeof modifiedData === 'object' && Object.keys(modifiedData).length > 0) {
        // Only use modifiedData if it has actual modifications
        actualData = modifiedData;
        console.log('Using modifiedData:', modifiedData);
      } else if (request.proposed_changes && typeof request.proposed_changes === 'object' && Object.keys(request.proposed_changes).length > 0) {
        // Only use if it has actual data
        actualData = request.proposed_changes;
        console.log('Using request.proposed_changes:', request.proposed_changes);
      } else if (request.metadata?.proposed_changes && typeof request.metadata.proposed_changes === 'object' && Object.keys(request.metadata.proposed_changes).length > 0) {
        // This is where the actual data is stored
        actualData = request.metadata.proposed_changes;
        console.log('Using metadata.proposed_changes:', request.metadata.proposed_changes);
      } else {
        console.log('WARNING: No data found in any location!');
        console.log('Request structure:', {
          request_id: request.id,
          has_proposed_changes: !!request.proposed_changes,
          has_metadata: !!request.metadata,
          metadata_keys: request.metadata ? Object.keys(request.metadata) : [],
          full_request: request
        });
      }
      
      // Log the data structure for debugging
      console.log('📊 Approval Request Data Structure:', {
        hasModifiedData: !!modifiedData,
        hasProposedChanges: !!request.proposed_changes,
        hasMetadataProposedChanges: !!request.metadata?.proposed_changes,
        actualDataKeys: Object.keys(actualData),
        actualData: actualData
      });
      
      // Prepare the AI decision from approval request
      const decision: any = {
        id: request.metadata?.decision_id || uuidv4(),
        communication_id: request.metadata?.communication_id || null,
        decision_type: this.getDecisionType(request.entity_type, request.action_type),
        action_type: request.action_type,
        confidence_score: request.metadata?.confidence_score || 1.0,
        priority: request.priority || 'normal',
        parameters: actualData,
        status: 'pending',
        created_at: new Date()
      };
      
      console.log('Executing CRM action for approved request:', {
        requestId: request.id,
        entityType: request.entity_type,
        actionType: request.action_type,
        decisionType: decision.decision_type,
        parametersProvided: decision.parameters
      });
      
      // Execute the CRM action
      const result = await crmActionsService.executeDecision(decision);
      
      if (result.success) {
        console.log('✅ CRM action executed successfully:', result.message);
        
        // Update approval request with execution result
        await supabase
          .from('approval_requests')
          .update({
            metadata: {
              ...request.metadata,
              execution_result: result,
              executed_at: new Date().toISOString()
            },
            updated_at: new Date()
          })
          .eq('id', request.id);
      } else {
        console.error('❌ CRM action execution failed:', result.message);
        
        // Log the failure but don't throw - approval was successful
        await supabase
          .from('approval_requests')
          .update({
            metadata: {
              ...request.metadata,
              execution_error: result.message,
              execution_attempted_at: new Date().toISOString()
            },
            updated_at: new Date()
          })
          .eq('id', request.id);
      }
    } catch (error: any) {
      console.error('Error executing approved CRM action:', error);
      
      // Log error but don't throw - approval was successful even if execution failed
      try {
        await supabase
          .from('approval_requests')
          .update({
            metadata: {
              ...request.metadata,
              execution_error: error.message || 'Unknown error during CRM execution',
              execution_attempted_at: new Date().toISOString()
            },
            updated_at: new Date()
          })
          .eq('id', request.id);
      } catch (updateError) {
        console.error('Failed to update approval request with execution error:', updateError);
      }
    }
  }

  private async getRequiredApprovers(request: ApprovalRequest): Promise<ApproverInfo[]> {
    if (!request.workflow_id) return [];

    const { data: workflow, error } = await supabase
      .from('approval_workflows')
      .select('*')
      .eq('id', request.workflow_id)
      .single();

    // If workflow table doesn't exist or workflow not found, return empty array
    if (error || !workflow) return [];

    const approvers: ApproverInfo[] = [];

    // Get users with required roles
    for (const roleCode of workflow.required_approvers || []) {
      const { data: assignments } = await supabase
        .from('user_role_assignments')
        .select(`
          user:auth.users(id, email, raw_user_meta_data),
          role:user_roles(role_name, role_code)
        `)
        .eq('role.role_code', roleCode)
        .eq('is_active', true);

      for (const assignment of assignments || []) {
        if (assignment.user) {
          // Try to check if user has already approved
          let hasApproved = false;
          let approvalTime = null;
          
          try {
            const { data: action } = await supabase
              .from('approval_actions')
              .select('*')
              .eq('request_id', request.id)
              .eq('user_id', assignment.user.id)
              .single();
            
            if (action) {
              hasApproved = true;
              approvalTime = action.action_taken_at;
            }
          } catch (error: any) {
            // If approval_actions table doesn't exist, check the approval_requests table
            if (error.code === 'PGRST205' || error.message?.includes('relation')) {
              // Check if this user approved based on approved_by field
              hasApproved = request.approved_by === assignment.user.id;
              approvalTime = hasApproved ? request.approved_at : null;
            }
          }

          approvers.push({
            user_id: assignment.user.id,
            user_name: assignment.user.raw_user_meta_data?.full_name || assignment.user.email,
            role: assignment.role?.role_name || roleCode,
            has_approved: hasApproved,
            approval_time: approvalTime,
            can_approve: !hasApproved
          });
        }
      }
    }

    return approvers;
  }

  private matchesAutoApprovalRule(
    request: ApprovalRequest,
    rule: any
  ): boolean {
    return this.matchesTriggerConditions(rule.conditions, {
      ...request.proposed_changes,
      confidence_score: request.metadata?.confidence_score,
      amount: request.metadata?.amount
    });
  }

  /**
   * Map approval entity and action types to CRM decision types
   */
  private getDecisionType(entityType: EntityType, actionType: ActionType): string {
    // Map common combinations
    const mapping: Record<string, string> = {
      'lead:create': 'create_lead',
      'lead:update': 'update_lead',
      'lead:delete': 'delete_lead',
      'client:create': 'create_client',
      'client:update': 'update_client',
      'client:delete': 'delete_client',
      'appointment:create': 'schedule_appointment',
      'appointment:update': 'update_appointment',
      'appointment:delete': 'cancel_appointment',
      'task:create': 'create_task',
      'task:update': 'update_task',
      'task:delete': 'delete_task',
      'property:create': 'create_property',
      'property:update': 'update_property',
      'property:delete': 'delete_property',
      'communication:create': 'add_note',
      'communication:update': 'update_note',
      'deal:create': 'create_deal',
      'deal:update': 'update_deal',
      'deal:status_change': 'change_deal_status'
    };
    
    const key = `${entityType}:${actionType}`;
    
    // Return mapped value or construct a default
    return mapping[key] || `${actionType}_${entityType}`;
  }
}

export const approvalService = ApprovalService.getInstance();