// =====================================================
// APPROVAL SYSTEM TYPE DEFINITIONS
// =====================================================

export interface UserRole {
  id: string;
  organization_id: string;
  role_name: string;
  role_code: 'admin' | 'manager' | 'agent' | 'viewer' | string;
  description?: string;
  permissions: RolePermissions;
  approval_levels: number;
  can_auto_approve: boolean;
  auto_approve_conditions?: Record<string, any>;
  parent_role_id?: string;
  hierarchy_level: number;
  is_active: boolean;
  is_system_role: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface RolePermissions {
  create: string[];
  read: string[];
  update: string[];
  delete: string[];
}

export interface UserRoleAssignment {
  id: string;
  user_id: string;
  role_id: string;
  organization_id: string;
  assigned_by?: string;
  assigned_at: Date;
  expires_at?: Date;
  scope_type?: 'global' | 'team' | 'region' | 'custom';
  scope_data?: Record<string, any>;
  is_active: boolean;
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

export interface ApprovalWorkflow {
  id: string;
  organization_id: string;
  workflow_name: string;
  workflow_code: string;
  description?: string;
  entity_type: EntityType;
  action_type: ActionType;
  required_approvers: string[];
  approval_sequence: 'parallel' | 'sequential' | 'any' | 'custom';
  min_approvers: number;
  trigger_conditions?: TriggerConditions;
  auto_approve_conditions?: Record<string, any>;
  bypass_roles?: string[];
  approval_timeout_hours: number;
  escalation_config?: EscalationConfig;
  is_active: boolean;
  priority: number;
  created_at: Date;
  updated_at: Date;
}

export interface ApprovalRequest {
  id: string;
  organization_id: string;
  decision_id?: string;
  workflow_id?: string;
  request_type: string;
  entity_type: EntityType;
  entity_id?: string;
  action_type: ActionType;
  requested_by: string;
  requested_at: Date;
  request_reason?: string;
  current_data?: Record<string, any>;
  proposed_changes?: Record<string, any>;
  change_summary?: string;
  status: ApprovalStatus;
  approvals_required: number;
  approvals_received: number;
  rejection_count: number;
  expires_at: Date;
  approved_at?: Date;
  completed_at?: Date;
  priority: Priority;
  is_urgent: boolean;
  tags?: string[];
  metadata?: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export interface ApprovalAction {
  id: string;
  request_id: string;
  user_id: string;
  role_id?: string;
  action: 'approve' | 'reject' | 'request_changes' | 'delegate' | 'escalate';
  modified_data?: Record<string, any>;
  reason?: string;
  notes?: string;
  delegated_to?: string;
  escalated_to?: string;
  action_taken_at: Date;
  ip_address?: string;
  user_agent?: string;
  created_at: Date;
}

export interface CRMAuditTrail {
  id: string;
  organization_id: string;
  action_id?: string;
  action_type: string;
  action_category?: 'approval' | 'data_change' | 'access' | 'system';
  entity_type: EntityType;
  entity_id?: string;
  entity_name?: string;
  user_id: string;
  user_name?: string;
  user_role?: string;
  operation: Operation;
  before_data?: Record<string, any>;
  after_data?: Record<string, any>;
  changed_fields?: string[];
  approval_request_id?: string;
  approved_by?: string[];
  approval_notes?: string;
  session_id?: string;
  ip_address?: string;
  user_agent?: string;
  request_method?: string;
  request_path?: string;
  success: boolean;
  error_message?: string;
  data_classification?: 'public' | 'internal' | 'confidential' | 'restricted';
  retention_days: number;
  timestamp: Date;
  created_at: Date;
}

export interface AutoApprovalRule {
  id: string;
  organization_id: string;
  rule_name: string;
  rule_code: string;
  description?: string;
  entity_type: EntityType;
  action_type: ActionType;
  conditions: ApprovalConditions;
  require_previous_approval_history?: boolean;
  min_user_tenure_days?: number;
  max_daily_auto_approvals?: number;
  priority: number;
  stop_on_match: boolean;
  is_active: boolean;
  usage_count: number;
  last_used_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface ApprovalNotificationPreferences {
  id: string;
  user_id: string;
  email_enabled: boolean;
  sms_enabled: boolean;
  push_enabled: boolean;
  in_app_enabled: boolean;
  telegram_enabled: boolean;
  whatsapp_enabled: boolean;
  notify_new_requests: boolean;
  notify_approvals: boolean;
  notify_rejections: boolean;
  notify_escalations: boolean;
  notify_expirations: boolean;
  immediate_notifications: boolean;
  digest_frequency: 'realtime' | 'hourly' | 'daily' | 'weekly';
  quiet_hours_start?: string;
  quiet_hours_end?: string;
  timezone: string;
  min_priority: Priority;
  entity_type_filters?: EntityType[];
  created_at: Date;
  updated_at: Date;
}

// =====================================================
// ENUMS AND TYPES
// =====================================================

export type EntityType = 
  | 'client'
  | 'lead'
  | 'property'
  | 'appointment'
  | 'task'
  | 'communication'
  | 'invoice';

export type ActionType = 
  | 'create'
  | 'update'
  | 'delete'
  | 'status_change'
  | 'assignment'
  | 'bulk_action';

export type ApprovalStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'expired'
  | 'cancelled'
  | 'auto_approved'
  | 'partially_approved';

export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export type Operation = 
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'approve'
  | 'reject'
  | 'export'
  | 'import';

// =====================================================
// APPROVAL CONDITION TYPES
// =====================================================

export interface TriggerConditions {
  amount?: ComparisonCondition;
  count?: ComparisonCondition;
  confidence_score?: ComparisonCondition;
  user_roles?: string[];
  time_range?: TimeRange;
  working_days_only?: boolean;
  [key: string]: any;
}

export interface ApprovalConditions {
  confidence_score?: ComparisonCondition;
  amount?: ComparisonCondition;
  user_roles?: string[];
  time_range?: TimeRange;
  working_days_only?: boolean;
  entity_fields?: Record<string, any>;
}

export interface ComparisonCondition {
  eq?: number;
  neq?: number;
  gt?: number;
  gte?: number;
  lt?: number;
  lte?: number;
  in?: number[];
  nin?: number[];
}

export interface TimeRange {
  start: string;
  end: string;
}

export interface EscalationConfig {
  escalate_to?: string[];
  escalation_message?: string;
  auto_approve?: boolean;
  auto_reject?: boolean;
}

// =====================================================
// REQUEST/RESPONSE TYPES
// =====================================================

export interface CreateApprovalRequestPayload {
  entity_type: EntityType;
  entity_id?: string;
  action_type: ActionType;
  current_data?: Record<string, any>;
  proposed_changes: Record<string, any>;
  change_summary?: string;
  request_reason?: string;
  priority?: Priority;
  is_urgent?: boolean;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface ApprovalActionPayload {
  request_id: string;
  action: 'approve' | 'reject' | 'request_changes';
  modified_data?: Record<string, any>;
  reason?: string;
  notes?: string;
}

export interface ApprovalPreview {
  request: ApprovalRequest;
  workflow?: ApprovalWorkflow;
  current_data: Record<string, any>;
  proposed_changes: Record<string, any>;
  changed_fields: ChangedField[];
  impact_analysis?: ImpactAnalysis;
  required_approvers?: ApproverInfo[];
  can_auto_approve: boolean;
  user_can_approve: boolean;
}

export interface ChangedField {
  field_name: string;
  field_label: string;
  old_value: any;
  new_value: any;
  change_type: 'added' | 'modified' | 'deleted';
  is_critical?: boolean;
}

export interface ImpactAnalysis {
  affected_entities: AffectedEntity[];
  risk_level: 'low' | 'medium' | 'high';
  warnings?: string[];
  recommendations?: string[];
}

export interface AffectedEntity {
  entity_type: EntityType;
  entity_id: string;
  entity_name: string;
  impact_description: string;
}

export interface ApproverInfo {
  user_id: string;
  user_name: string;
  role: string;
  has_approved?: boolean;
  approval_time?: Date;
  can_approve: boolean;
}

// =====================================================
// PERMISSION CHECK TYPES
// =====================================================

export interface PermissionCheck {
  user_id: string;
  entity_type: EntityType;
  action_type: ActionType;
  entity_id?: string;
  context?: Record<string, any>;
}

export interface PermissionResult {
  allowed: boolean;
  requires_approval: boolean;
  workflow?: ApprovalWorkflow;
  reason?: string;
  bypass_reason?: string;
  auto_approve_eligible?: boolean;
}

// =====================================================
// AUDIT TYPES
// =====================================================

export interface AuditFilter {
  organization_id?: string;
  user_id?: string;
  entity_type?: EntityType;
  entity_id?: string;
  action_type?: string;
  date_from?: Date;
  date_to?: Date;
  success?: boolean;
}

export interface AuditReport {
  total_actions: number;
  actions_by_type: Record<string, number>;
  actions_by_user: Record<string, number>;
  approval_stats: ApprovalStatistics;
  timeline: AuditTimelineEntry[];
}

export interface ApprovalStatistics {
  total_requests: number;
  approved: number;
  rejected: number;
  expired: number;
  auto_approved: number;
  average_approval_time: number;
  approval_rate: number;
}

export interface AuditTimelineEntry {
  timestamp: Date;
  user: string;
  action: string;
  entity: string;
  result: 'success' | 'failure';
  details?: string;
}