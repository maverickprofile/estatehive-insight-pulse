-- =====================================================
-- PERMISSION-BASED APPROVAL SYSTEM
-- =====================================================
-- Complete permission and approval workflow system for CRM actions
-- with role-based access control and comprehensive audit trails
-- =====================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. USER ROLES AND PERMISSIONS
-- =====================================================

-- User roles with granular permissions
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Role details
    role_name TEXT NOT NULL,
    role_code TEXT UNIQUE NOT NULL, -- e.g., 'admin', 'manager', 'agent'
    description TEXT,
    
    -- Permission configuration (JSON structure for flexibility)
    permissions JSONB DEFAULT '{}', -- { create: [], read: [], update: [], delete: [] }
    
    -- Approval settings
    approval_levels INTEGER DEFAULT 1, -- How many levels this role can approve
    can_auto_approve BOOLEAN DEFAULT false,
    auto_approve_conditions JSONB DEFAULT '{}', -- Conditions for auto-approval
    
    -- Hierarchy
    parent_role_id UUID REFERENCES public.user_roles(id),
    hierarchy_level INTEGER DEFAULT 0,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    is_system_role BOOLEAN DEFAULT false, -- Protected system roles
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(organization_id, role_name)
);

-- User role assignments
CREATE TABLE IF NOT EXISTS public.user_role_assignments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role_id UUID REFERENCES public.user_roles(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES auth.users(id),
    
    -- Assignment details
    assigned_by UUID REFERENCES auth.users(id),
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ, -- For temporary roles
    
    -- Scope limitations
    scope_type TEXT CHECK (scope_type IN ('global', 'team', 'region', 'custom')),
    scope_data JSONB DEFAULT '{}', -- Additional scope constraints
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Metadata
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, role_id, organization_id)
);

-- =====================================================
-- 2. APPROVAL WORKFLOWS
-- =====================================================

-- Approval workflow definitions
CREATE TABLE IF NOT EXISTS public.approval_workflows (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Workflow details
    workflow_name TEXT NOT NULL,
    workflow_code TEXT NOT NULL,
    description TEXT,
    
    -- Trigger configuration
    entity_type TEXT NOT NULL CHECK (entity_type IN (
        'client', 'lead', 'property', 'appointment', 'task', 'communication', 'invoice'
    )),
    action_type TEXT NOT NULL CHECK (action_type IN (
        'create', 'update', 'delete', 'status_change', 'assignment', 'bulk_action'
    )),
    
    -- Approval configuration
    required_approvers TEXT[] DEFAULT '{}', -- Role codes that must approve
    approval_sequence TEXT CHECK (approval_sequence IN (
        'parallel', 'sequential', 'any', 'custom'
    )) DEFAULT 'parallel',
    min_approvers INTEGER DEFAULT 1,
    
    -- Conditions for triggering
    trigger_conditions JSONB DEFAULT '{}', -- e.g., { amount: { gte: 100000 } }
    
    -- Auto-approval settings
    auto_approve_conditions JSONB DEFAULT '{}',
    bypass_roles TEXT[] DEFAULT '{}', -- Roles that can bypass this workflow
    
    -- Timeout settings
    approval_timeout_hours INTEGER DEFAULT 24,
    escalation_config JSONB DEFAULT '{}', -- What happens on timeout
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 1, -- Higher priority workflows evaluated first
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(organization_id, workflow_code)
);

-- =====================================================
-- 3. APPROVAL REQUESTS
-- =====================================================

-- Enhanced approval requests table
CREATE TABLE IF NOT EXISTS public.approval_requests (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID REFERENCES auth.users(id),
    
    -- Link to AI decision or manual request
    decision_id UUID REFERENCES public.ai_decisions(id) ON DELETE CASCADE,
    workflow_id UUID REFERENCES public.approval_workflows(id),
    
    -- Request details
    request_type TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    action_type TEXT NOT NULL,
    
    -- Requester information
    requested_by UUID REFERENCES auth.users(id),
    requested_at TIMESTAMPTZ DEFAULT NOW(),
    request_reason TEXT,
    
    -- Preview data
    current_data JSONB, -- Current state of entity
    proposed_changes JSONB, -- Proposed changes
    change_summary TEXT, -- Human-readable summary
    
    -- Approval status
    status TEXT CHECK (status IN (
        'pending', 'approved', 'rejected', 'expired', 
        'cancelled', 'auto_approved', 'partially_approved'
    )) DEFAULT 'pending',
    
    -- Approval tracking
    approvals_required INTEGER DEFAULT 1,
    approvals_received INTEGER DEFAULT 0,
    rejection_count INTEGER DEFAULT 0,
    
    -- Timing
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours'),
    approved_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    
    -- Priority and urgency
    priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
    is_urgent BOOLEAN DEFAULT false,
    
    -- Metadata
    tags TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Individual approval actions
CREATE TABLE IF NOT EXISTS public.approval_actions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    request_id UUID REFERENCES public.approval_requests(id) ON DELETE CASCADE,
    
    -- Approver information
    user_id UUID REFERENCES auth.users(id),
    role_id UUID REFERENCES public.user_roles(id),
    
    -- Action taken
    action TEXT CHECK (action IN (
        'approve', 'reject', 'request_changes', 'delegate', 'escalate'
    )) NOT NULL,
    
    -- Modified parameters (if changes requested)
    modified_data JSONB,
    
    -- Reasoning
    reason TEXT,
    notes TEXT,
    
    -- Delegation/Escalation
    delegated_to UUID REFERENCES auth.users(id),
    escalated_to UUID REFERENCES public.user_roles(id),
    
    -- Timestamps
    action_taken_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Context
    ip_address INET,
    user_agent TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 4. AUDIT TRAIL
-- =====================================================

-- Comprehensive audit trail for all CRM actions
CREATE TABLE IF NOT EXISTS public.crm_audit_trail (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID REFERENCES auth.users(id),
    
    -- Action identification
    action_id UUID, -- Links to specific action (approval_request, crm_action_queue, etc.)
    action_type TEXT NOT NULL,
    action_category TEXT, -- 'approval', 'data_change', 'access', 'system'
    
    -- Entity information
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    entity_name TEXT, -- Human-readable entity identifier
    
    -- User information
    user_id UUID REFERENCES auth.users(id),
    user_name TEXT,
    user_role TEXT,
    
    -- Change details
    operation TEXT CHECK (operation IN (
        'create', 'read', 'update', 'delete', 'approve', 'reject', 'export', 'import'
    )),
    before_data JSONB, -- State before change
    after_data JSONB, -- State after change
    changed_fields TEXT[], -- List of modified fields
    
    -- Approval information
    approval_request_id UUID REFERENCES public.approval_requests(id),
    approved_by UUID[],
    approval_notes TEXT,
    
    -- Session information
    session_id TEXT,
    ip_address INET,
    user_agent TEXT,
    request_method TEXT,
    request_path TEXT,
    
    -- Result
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    
    -- Compliance
    data_classification TEXT, -- 'public', 'internal', 'confidential', 'restricted'
    retention_days INTEGER DEFAULT 2555, -- 7 years default
    
    -- Timestamps
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    
    -- Indexing for performance
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 5. AUTO-APPROVAL RULES
-- =====================================================

-- Enhanced auto-approval rules
CREATE TABLE IF NOT EXISTS public.auto_approval_rules (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Rule details
    rule_name TEXT NOT NULL,
    rule_code TEXT UNIQUE NOT NULL,
    description TEXT,
    
    -- Scope
    entity_type TEXT NOT NULL,
    action_type TEXT NOT NULL,
    
    -- Conditions (all must be met)
    conditions JSONB NOT NULL DEFAULT '{}',
    /* Example conditions:
    {
        "confidence_score": { "gte": 0.95 },
        "amount": { "lte": 10000 },
        "user_roles": ["agent", "manager"],
        "time_range": { "start": "09:00", "end": "17:00" },
        "working_days_only": true
    }
    */
    
    -- Additional checks
    require_previous_approval_history BOOLEAN DEFAULT false,
    min_user_tenure_days INTEGER,
    max_daily_auto_approvals INTEGER,
    
    -- Rule configuration
    priority INTEGER DEFAULT 1,
    stop_on_match BOOLEAN DEFAULT true, -- Stop evaluating other rules if matched
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Usage tracking
    usage_count INTEGER DEFAULT 0,
    last_used_at TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(organization_id, rule_code)
);

-- =====================================================
-- 6. NOTIFICATION PREFERENCES
-- =====================================================

-- User notification preferences for approvals
CREATE TABLE IF NOT EXISTS public.approval_notification_preferences (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Channel preferences
    email_enabled BOOLEAN DEFAULT true,
    sms_enabled BOOLEAN DEFAULT false,
    push_enabled BOOLEAN DEFAULT true,
    in_app_enabled BOOLEAN DEFAULT true,
    telegram_enabled BOOLEAN DEFAULT false,
    whatsapp_enabled BOOLEAN DEFAULT false,
    
    -- Notification types
    notify_new_requests BOOLEAN DEFAULT true,
    notify_approvals BOOLEAN DEFAULT true,
    notify_rejections BOOLEAN DEFAULT true,
    notify_escalations BOOLEAN DEFAULT true,
    notify_expirations BOOLEAN DEFAULT true,
    
    -- Timing preferences
    immediate_notifications BOOLEAN DEFAULT true,
    digest_frequency TEXT CHECK (digest_frequency IN (
        'realtime', 'hourly', 'daily', 'weekly'
    )) DEFAULT 'realtime',
    quiet_hours_start TIME,
    quiet_hours_end TIME,
    timezone TEXT DEFAULT 'UTC',
    
    -- Filtering
    min_priority TEXT CHECK (min_priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'low',
    entity_type_filters TEXT[] DEFAULT '{}',
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- =====================================================
-- 7. INDEXES FOR PERFORMANCE
-- =====================================================

-- Indexes for user_roles
CREATE INDEX idx_user_roles_org ON public.user_roles(organization_id);
CREATE INDEX idx_user_roles_code ON public.user_roles(role_code);
CREATE INDEX idx_user_roles_active ON public.user_roles(is_active);

-- Indexes for user_role_assignments
CREATE INDEX idx_role_assignments_user ON public.user_role_assignments(user_id);
CREATE INDEX idx_role_assignments_role ON public.user_role_assignments(role_id);
CREATE INDEX idx_role_assignments_org ON public.user_role_assignments(organization_id);

-- Indexes for approval_workflows
CREATE INDEX idx_workflows_org ON public.approval_workflows(organization_id);
CREATE INDEX idx_workflows_entity_action ON public.approval_workflows(entity_type, action_type);
CREATE INDEX idx_workflows_active ON public.approval_workflows(is_active);

-- Indexes for approval_requests
CREATE INDEX idx_approval_requests_org ON public.approval_requests(organization_id);
CREATE INDEX idx_approval_requests_status ON public.approval_requests(status);
CREATE INDEX idx_approval_requests_requester ON public.approval_requests(requested_by);
CREATE INDEX idx_approval_requests_expires ON public.approval_requests(expires_at);

-- Indexes for approval_actions
CREATE INDEX idx_approval_actions_request ON public.approval_actions(request_id);
CREATE INDEX idx_approval_actions_user ON public.approval_actions(user_id);
CREATE INDEX idx_approval_actions_taken_at ON public.approval_actions(action_taken_at);

-- Indexes for audit trail
CREATE INDEX idx_audit_org ON public.crm_audit_trail(organization_id);
CREATE INDEX idx_audit_user ON public.crm_audit_trail(user_id);
CREATE INDEX idx_audit_entity ON public.crm_audit_trail(entity_type, entity_id);
CREATE INDEX idx_audit_timestamp ON public.crm_audit_trail(timestamp);
CREATE INDEX idx_audit_action ON public.crm_audit_trail(action_type, operation);

-- =====================================================
-- 8. ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_role_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_audit_trail ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auto_approval_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_notification_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_roles
CREATE POLICY "Users can view roles in their organization"
ON public.user_roles FOR SELECT
USING (
    organization_id IN (
        SELECT organization_id FROM public.user_role_assignments 
        WHERE user_id = auth.uid() AND is_active = true
    )
);

CREATE POLICY "Admins can manage roles"
ON public.user_roles FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.user_role_assignments ura
        JOIN public.user_roles ur ON ura.role_id = ur.id
        WHERE ura.user_id = auth.uid() 
        AND ur.role_code = 'admin'
        AND ura.is_active = true
    )
);

-- RLS Policies for approval_requests
CREATE POLICY "Users can view their approval requests"
ON public.approval_requests FOR SELECT
USING (
    requested_by = auth.uid()
    OR EXISTS (
        SELECT 1 FROM public.user_role_assignments ura
        JOIN public.user_roles ur ON ura.role_id = ur.id
        WHERE ura.user_id = auth.uid()
        AND ur.role_code = ANY(
            SELECT required_approvers FROM public.approval_workflows
            WHERE id = workflow_id
        )
    )
);

-- RLS Policies for audit trail
CREATE POLICY "Users can view audit trail for their organization"
ON public.crm_audit_trail FOR SELECT
USING (
    organization_id IN (
        SELECT organization_id FROM public.user_role_assignments 
        WHERE user_id = auth.uid() AND is_active = true
    )
);

-- =====================================================
-- 9. FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update triggers
CREATE TRIGGER update_user_roles_updated_at BEFORE UPDATE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_approval_workflows_updated_at BEFORE UPDATE ON public.approval_workflows
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_approval_requests_updated_at BEFORE UPDATE ON public.approval_requests
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Function to check user permissions
CREATE OR REPLACE FUNCTION check_user_permission(
    p_user_id UUID,
    p_entity_type TEXT,
    p_action_type TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    v_has_permission BOOLEAN := FALSE;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM public.user_role_assignments ura
        JOIN public.user_roles ur ON ura.role_id = ur.id
        WHERE ura.user_id = p_user_id
        AND ura.is_active = true
        AND ur.is_active = true
        AND (
            ur.permissions->p_action_type ? p_entity_type
            OR ur.role_code = 'admin'
        )
    ) INTO v_has_permission;
    
    RETURN v_has_permission;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's highest role
CREATE OR REPLACE FUNCTION get_user_highest_role(p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
    v_role_code TEXT;
BEGIN
    SELECT ur.role_code INTO v_role_code
    FROM public.user_role_assignments ura
    JOIN public.user_roles ur ON ura.role_id = ur.id
    WHERE ura.user_id = p_user_id
    AND ura.is_active = true
    AND ur.is_active = true
    ORDER BY ur.hierarchy_level DESC
    LIMIT 1;
    
    RETURN v_role_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 10. DEFAULT DATA
-- =====================================================

-- Insert default roles
INSERT INTO public.user_roles (role_name, role_code, description, permissions, approval_levels, can_auto_approve, hierarchy_level, is_system_role)
VALUES 
    ('Administrator', 'admin', 'Full system access', 
     '{"create": ["*"], "read": ["*"], "update": ["*"], "delete": ["*"]}', 
     3, true, 3, true),
    
    ('Manager', 'manager', 'Team management access', 
     '{"create": ["lead", "client", "appointment"], "read": ["*"], "update": ["lead", "client", "appointment"], "delete": ["appointment"]}', 
     2, false, 2, true),
    
    ('Agent', 'agent', 'Basic CRM access', 
     '{"create": ["lead", "appointment"], "read": ["own"], "update": ["own"], "delete": []}', 
     1, false, 1, true),
    
    ('Viewer', 'viewer', 'Read-only access', 
     '{"create": [], "read": ["*"], "update": [], "delete": []}', 
     0, false, 0, true)
ON CONFLICT (role_code) DO NOTHING;

-- Insert default approval workflows
INSERT INTO public.approval_workflows (workflow_name, workflow_code, entity_type, action_type, required_approvers, approval_sequence, trigger_conditions)
VALUES
    ('High Value Lead Creation', 'high_value_lead', 'lead', 'create', 
     ARRAY['manager'], 'any', 
     '{"budget_max": {"gte": 1000000}}'),
    
    ('Client Deletion', 'client_deletion', 'client', 'delete', 
     ARRAY['admin'], 'sequential', 
     '{}'),
    
    ('Bulk Status Update', 'bulk_status_update', 'lead', 'bulk_action', 
     ARRAY['manager'], 'any', 
     '{"count": {"gte": 10}}')
ON CONFLICT (organization_id, workflow_code) DO NOTHING;

-- =====================================================
-- 11. HELPER VIEWS
-- =====================================================

-- View for pending approvals
CREATE OR REPLACE VIEW pending_approvals AS
SELECT 
    ar.*,
    aw.workflow_name,
    aw.required_approvers,
    aw.approval_sequence,
    u.email as requester_email,
    u.raw_user_meta_data->>'full_name' as requester_name
FROM public.approval_requests ar
JOIN public.approval_workflows aw ON ar.workflow_id = aw.id
JOIN auth.users u ON ar.requested_by = u.id
WHERE ar.status = 'pending'
AND ar.expires_at > NOW();

-- View for user permissions
CREATE OR REPLACE VIEW user_permissions_view AS
SELECT 
    ura.user_id,
    ur.role_code,
    ur.role_name,
    ur.permissions,
    ur.approval_levels,
    ur.can_auto_approve,
    ura.is_active
FROM public.user_role_assignments ura
JOIN public.user_roles ur ON ura.role_id = ur.id
WHERE ura.is_active = true
AND ur.is_active = true;

COMMENT ON SCHEMA public IS 'Permission-based approval system for CRM actions';