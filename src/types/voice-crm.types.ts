// Voice CRM Decision System Types

export interface AIDecision {
  id: string;
  communication_id: string;
  decision_type: DecisionType;
  action_type: ActionType;
  confidence_score: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: DecisionStatus;
  parameters: Record<string, any>;
  suggested_at: Date;
  expires_at?: Date;
  approved_by?: string;
  approved_at?: Date;
  rejected_reason?: string;
  executed_at?: Date;
  execution_result?: any;
  error_message?: string;
}

export type DecisionType = 
  | 'create_lead'
  | 'update_client'
  | 'schedule_appointment'
  | 'create_task'
  | 'update_property'
  | 'send_message'
  | 'change_status'
  | 'assign_agent'
  | 'update_budget'
  | 'add_note';

export type ActionType = 
  | 'client_action'
  | 'lead_action'
  | 'appointment_action'
  | 'task_action'
  | 'property_action'
  | 'communication_action';

export type DecisionStatus = 
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'expired'
  | 'executing'
  | 'completed'
  | 'failed';

export interface ActionApproval {
  id: string;
  decision_id: string;
  user_id: string;
  chat_id: string;
  message_id: number;
  action: 'approve' | 'reject' | 'modify';
  modified_parameters?: Record<string, any>;
  reason?: string;
  created_at: Date;
}

export interface CRMAction {
  id: string;
  decision_id: string;
  action_type: ActionType;
  entity_type: 'client' | 'lead' | 'appointment' | 'task' | 'property' | 'communication';
  entity_id?: string | number;
  operation: 'create' | 'update' | 'delete';
  payload: Record<string, any>;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  retry_count: number;
  max_retries: number;
  scheduled_for?: Date;
  executed_at?: Date;
  result?: any;
  error?: string;
}

// Specific action payloads
export interface CreateLeadPayload {
  name: string;
  phone: string;
  email?: string;
  source: string;
  interested_in?: string;
  budget_min?: number;
  budget_max?: number;
  notes?: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
}

export interface UpdateClientPayload {
  client_id: number;
  updates: {
    name?: string;
    email?: string;
    phone?: string;
    status?: string;
    client_type?: string;
    budget_min?: number;
    budget_max?: number;
    preferences?: Record<string, any>;
    notes?: string;
  };
}

export interface ScheduleAppointmentPayload {
  title: string;
  description?: string;
  appointment_type: 'property_viewing' | 'consultation' | 'follow_up' | 'closing' | 'inspection';
  client_id?: number;
  lead_id?: number;
  property_id?: number;
  agent_id?: string;
  start_time: Date;
  end_time: Date;
  location?: string;
  notes?: string;
}

export interface CreateTaskPayload {
  title: string;
  description?: string;
  task_type: 'follow_up' | 'documentation' | 'call' | 'email' | 'meeting' | 'other';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  due_date: Date;
  assigned_to?: string;
  related_to?: {
    entity_type: 'client' | 'lead' | 'property' | 'appointment';
    entity_id: string | number;
  };
  tags?: string[];
}

// Decision suggestion from AI
export interface DecisionSuggestion {
  decision_type: DecisionType;
  confidence: number;
  reasoning: string;
  parameters: Record<string, any>;
  alternatives?: DecisionSuggestion[];
  requires_approval: boolean;
  auto_approve_eligible: boolean;
}

// Telegram interaction types
export interface TelegramActionMessage {
  chat_id: string | number;
  message_text: string;
  decisions: AIDecision[];
  inline_keyboard: TelegramInlineButton[][];
}

export interface TelegramInlineButton {
  text: string;
  callback_data: string;
  url?: string;
}

export interface TelegramCallbackData {
  action: 'approve' | 'reject' | 'modify' | 'view_details';
  decision_id: string;
  additional_data?: any;
}

// Voice processing context
export interface VoiceProcessingContext {
  communication_id: string;
  transcription: string;
  ai_summary: string;
  key_points: string[];
  action_items: string[];
  entities: {
    people?: string[];
    locations?: string[];
    dates?: string[];
    amounts?: string[];
    property_types?: string[];
  };
  sentiment: string;
  urgency: string;
  client_info?: {
    id: number;
    name: string;
    type: string;
  };
}

// Action templates for common scenarios
export interface ActionTemplate {
  id: string;
  name: string;
  description: string;
  trigger_keywords: string[];
  decision_type: DecisionType;
  default_parameters: Record<string, any>;
  required_entities: string[];
  confidence_threshold: number;
}

// Auto-approval rules
export interface AutoApprovalRule {
  id: string;
  rule_name: string;
  decision_type: DecisionType;
  conditions: {
    min_confidence?: number;
    max_amount?: number;
    allowed_users?: string[];
    allowed_chat_ids?: string[];
    time_window?: {
      start: string; // HH:mm format
      end: string;
    };
    max_daily_approvals?: number;
  };
  is_active: boolean;
}

// Execution result types
export interface ExecutionResult {
  success: boolean;
  entity_id?: string | number;
  entity_type?: string;
  message: string;
  data?: any;
  timestamp: Date;
}

// Analytics and learning
export interface DecisionAnalytics {
  decision_type: DecisionType;
  total_suggested: number;
  total_approved: number;
  total_rejected: number;
  average_confidence: number;
  average_execution_time: number;
  success_rate: number;
  common_rejection_reasons: string[];
  user_preferences: Record<string, any>;
}