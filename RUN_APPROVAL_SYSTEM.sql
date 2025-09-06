-- =====================================================
-- COMPLETE APPROVAL SYSTEM SETUP
-- Run this SQL in your Supabase SQL Editor
-- =====================================================

-- First check if tables exist and drop them if they do (for clean installation)
DROP TABLE IF EXISTS public.crm_audit_trail CASCADE;
DROP TABLE IF EXISTS public.action_approvals CASCADE;
DROP TABLE IF EXISTS public.approval_requests CASCADE;
DROP TABLE IF EXISTS public.user_role_assignments CASCADE;
DROP TABLE IF EXISTS public.auto_approval_rules CASCADE;
DROP TABLE IF EXISTS public.approval_workflows CASCADE;
DROP TABLE IF EXISTS public.user_roles CASCADE;

-- =====================================================
-- USER ROLES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role_name TEXT NOT NULL,
    role_code TEXT NOT NULL,
    description TEXT,
    permissions JSONB DEFAULT '{"create": [], "read": [], "update": [], "delete": []}',
    approval_levels INTEGER DEFAULT 1,
    can_auto_approve BOOLEAN DEFAULT false,
    auto_approve_conditions JSONB,
    parent_role_id UUID REFERENCES public.user_roles(id) ON DELETE SET NULL,
    hierarchy_level INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    is_system_role BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, role_code)
);

-- =====================================================
-- USER ROLE ASSIGNMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.user_role_assignments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id TEXT NOT NULL,
    role_id UUID REFERENCES public.user_roles(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    assigned_by TEXT,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    scope_type TEXT CHECK (scope_type IN ('global', 'team', 'region', 'custom')),
    scope_data JSONB,
    is_active BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- APPROVAL WORKFLOWS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.approval_workflows (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    workflow_name TEXT NOT NULL,
    workflow_code TEXT NOT NULL,
    description TEXT,
    entity_type TEXT NOT NULL,
    action_type TEXT NOT NULL,
    required_approvers JSONB DEFAULT '[]',
    approval_sequence TEXT CHECK (approval_sequence IN ('parallel', 'sequential', 'any', 'custom')) DEFAULT 'parallel',
    min_approvers INTEGER DEFAULT 1,
    trigger_conditions JSONB,
    auto_approve_conditions JSONB,
    bypass_roles TEXT[],
    approval_timeout_hours INTEGER DEFAULT 24,
    escalation_config JSONB,
    is_active BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- APPROVAL REQUESTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.approval_requests (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    decision_id UUID,
    workflow_id UUID REFERENCES public.approval_workflows(id) ON DELETE SET NULL,
    request_type TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    action_type TEXT NOT NULL,
    requested_by TEXT NOT NULL,
    requested_at TIMESTAMPTZ DEFAULT NOW(),
    request_reason TEXT,
    current_data JSONB,
    proposed_changes JSONB,
    change_summary TEXT,
    status TEXT CHECK (status IN ('pending', 'approved', 'rejected', 'expired', 'cancelled', 'auto_approved', 'partially_approved')) DEFAULT 'pending',
    approvals_required INTEGER DEFAULT 1,
    approvals_received INTEGER DEFAULT 0,
    rejection_count INTEGER DEFAULT 0,
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours'),
    approved_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
    is_urgent BOOLEAN DEFAULT false,
    tags TEXT[],
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- AUTO-APPROVAL RULES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.auto_approval_rules (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    rule_name TEXT NOT NULL,
    rule_code TEXT NOT NULL,
    description TEXT,
    entity_type TEXT NOT NULL,
    action_type TEXT NOT NULL,
    conditions JSONB DEFAULT '{}',
    require_previous_approval_history BOOLEAN DEFAULT false,
    min_user_tenure_days INTEGER,
    max_daily_auto_approvals INTEGER,
    priority INTEGER DEFAULT 0,
    stop_on_match BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    usage_count INTEGER DEFAULT 0,
    last_used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- CRM AUDIT TRAIL TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.crm_audit_trail (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id TEXT NOT NULL,
    action_id TEXT,
    action_type TEXT NOT NULL,
    action_category TEXT CHECK (action_category IN ('approval', 'data_change', 'access', 'system')),
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    entity_name TEXT,
    user_id TEXT NOT NULL,
    user_name TEXT,
    user_role TEXT,
    operation TEXT NOT NULL,
    before_data JSONB,
    after_data JSONB,
    changed_fields TEXT[],
    approval_request_id UUID REFERENCES public.approval_requests(id) ON DELETE SET NULL,
    approved_by TEXT[],
    approval_notes TEXT,
    session_id TEXT,
    ip_address TEXT,
    user_agent TEXT,
    request_method TEXT,
    request_path TEXT,
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    data_classification TEXT CHECK (data_classification IN ('public', 'internal', 'confidential', 'restricted')) DEFAULT 'internal',
    retention_days INTEGER DEFAULT 90,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- User roles indexes
CREATE INDEX idx_user_roles_org ON public.user_roles(organization_id);
CREATE INDEX idx_user_roles_code ON public.user_roles(role_code);
CREATE INDEX idx_user_roles_active ON public.user_roles(is_active);

-- User role assignments indexes
CREATE INDEX idx_role_assignments_user ON public.user_role_assignments(user_id);
CREATE INDEX idx_role_assignments_role ON public.user_role_assignments(role_id);
CREATE INDEX idx_role_assignments_org ON public.user_role_assignments(organization_id);

-- Approval workflows indexes
CREATE INDEX idx_workflows_org ON public.approval_workflows(organization_id);
CREATE INDEX idx_workflows_entity_action ON public.approval_workflows(entity_type, action_type);
CREATE INDEX idx_workflows_active ON public.approval_workflows(is_active);

-- Approval requests indexes
CREATE INDEX idx_approval_requests_org ON public.approval_requests(organization_id);
CREATE INDEX idx_approval_requests_status ON public.approval_requests(status);
CREATE INDEX idx_approval_requests_decision ON public.approval_requests(decision_id);
CREATE INDEX idx_approval_requests_requested_by ON public.approval_requests(requested_by);
CREATE INDEX idx_approval_requests_created ON public.approval_requests(created_at DESC);

-- Auto-approval rules indexes
CREATE INDEX idx_auto_rules_org ON public.auto_approval_rules(organization_id);
CREATE INDEX idx_auto_rules_entity_action ON public.auto_approval_rules(entity_type, action_type);
CREATE INDEX idx_auto_rules_active ON public.auto_approval_rules(is_active);

-- Audit trail indexes
CREATE INDEX idx_audit_org ON public.crm_audit_trail(organization_id);
CREATE INDEX idx_audit_user ON public.crm_audit_trail(user_id);
CREATE INDEX idx_audit_entity ON public.crm_audit_trail(entity_type, entity_id);
CREATE INDEX idx_audit_timestamp ON public.crm_audit_trail(timestamp DESC);
CREATE INDEX idx_audit_action ON public.crm_audit_trail(action_type);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_role_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auto_approval_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_audit_trail ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_roles
CREATE POLICY "Users can manage their organization's roles" ON public.user_roles
    FOR ALL TO authenticated
    USING (organization_id = auth.uid());

-- RLS Policies for user_role_assignments
CREATE POLICY "Users can manage their organization's role assignments" ON public.user_role_assignments
    FOR ALL TO authenticated
    USING (organization_id = auth.uid());

-- RLS Policies for approval_workflows
CREATE POLICY "Users can manage their organization's workflows" ON public.approval_workflows
    FOR ALL TO authenticated
    USING (organization_id = auth.uid());

-- RLS Policies for approval_requests
CREATE POLICY "Users can manage their organization's approval requests" ON public.approval_requests
    FOR ALL TO authenticated
    USING (organization_id = auth.uid());

-- RLS Policies for auto_approval_rules
CREATE POLICY "Users can manage their organization's auto-approval rules" ON public.auto_approval_rules
    FOR ALL TO authenticated
    USING (organization_id = auth.uid());

-- RLS Policies for crm_audit_trail
CREATE POLICY "Users can view their organization's audit trail" ON public.crm_audit_trail
    FOR SELECT TO authenticated
    USING (organization_id = auth.uid()::text);

CREATE POLICY "System can create audit entries" ON public.crm_audit_trail
    FOR INSERT TO authenticated
    WITH CHECK (true);

-- =====================================================
-- TRIGGER FUNCTIONS
-- =====================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_user_roles_updated_at BEFORE UPDATE ON public.user_roles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_role_assignments_updated_at BEFORE UPDATE ON public.user_role_assignments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workflows_updated_at BEFORE UPDATE ON public.approval_workflows
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_approval_requests_updated_at BEFORE UPDATE ON public.approval_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_auto_rules_updated_at BEFORE UPDATE ON public.auto_approval_rules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- DEFAULT DATA
-- =====================================================

-- Insert default user roles (will use current user as organization_id)
INSERT INTO public.user_roles (
    organization_id,
    role_name,
    role_code,
    description,
    hierarchy_level,
    approval_levels,
    can_auto_approve,
    is_system_role,
    permissions
) 
SELECT 
    auth.uid(),
    role_name,
    role_code,
    description,
    hierarchy_level,
    approval_levels,
    can_auto_approve,
    true,
    permissions
FROM (VALUES
    ('Administrator', 'admin', 'Full system access with all permissions', 1, 3, true, 
     '{"create": ["*"], "read": ["*"], "update": ["*"], "delete": ["*"]}'::jsonb),
    ('Manager', 'manager', 'Manage team and approve actions', 2, 2, true,
     '{"create": ["client", "lead", "appointment", "task"], "read": ["*"], "update": ["client", "lead", "appointment", "task"], "delete": ["appointment", "task"]}'::jsonb),
    ('Agent', 'agent', 'Handle clients and properties', 3, 1, false,
     '{"create": ["lead", "appointment", "task"], "read": ["*"], "update": ["lead", "appointment", "task"], "delete": []}'::jsonb),
    ('Viewer', 'viewer', 'Read-only access', 4, 0, false,
     '{"create": [], "read": ["*"], "update": [], "delete": []}'::jsonb)
) AS default_roles(role_name, role_code, description, hierarchy_level, approval_levels, can_auto_approve, permissions)
WHERE EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid())
ON CONFLICT (organization_id, role_code) DO NOTHING;

-- Insert default approval workflows
INSERT INTO public.approval_workflows (
    organization_id,
    workflow_name,
    workflow_code,
    description,
    entity_type,
    action_type,
    min_approvers,
    approval_sequence,
    approval_timeout_hours,
    priority
)
SELECT 
    auth.uid(),
    workflow_name,
    workflow_code,
    description,
    entity_type,
    action_type,
    min_approvers,
    approval_sequence,
    approval_timeout_hours,
    priority
FROM (VALUES
    ('Lead Creation Approval', 'lead_create', 'Approval for creating new leads from voice notes', 'lead', 'create', 1, 'any', 24, 1),
    ('Client Update Approval', 'client_update', 'Approval for updating client information', 'client', 'update', 1, 'sequential', 24, 2),
    ('High Value Transaction', 'high_value', 'Approval for high-value property transactions', 'property', 'update', 2, 'sequential', 12, 3)
) AS default_workflows(workflow_name, workflow_code, description, entity_type, action_type, min_approvers, approval_sequence, approval_timeout_hours, priority)
WHERE EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid())
ON CONFLICT DO NOTHING;

-- Insert default auto-approval rules
INSERT INTO public.auto_approval_rules (
    organization_id,
    rule_name,
    rule_code,
    description,
    entity_type,
    action_type,
    conditions,
    priority
)
SELECT 
    auth.uid(),
    rule_name,
    rule_code,
    description,
    entity_type,
    action_type,
    conditions,
    priority
FROM (VALUES
    ('Auto-approve high confidence leads', 'auto_lead_high', 'Automatically approve lead creation with high confidence', 'lead', 'create', 
     '{"confidence_score": {"gte": 0.9}}'::jsonb, 1),
    ('Auto-approve minor updates', 'auto_update_minor', 'Automatically approve minor client updates', 'client', 'update',
     '{"confidence_score": {"gte": 0.85}, "working_days_only": true}'::jsonb, 2),
    ('Auto-approve notes', 'auto_notes', 'Automatically approve adding notes', 'communication', 'create',
     '{"confidence_score": {"gte": 0.7}}'::jsonb, 3)
) AS default_rules(rule_name, rule_code, description, entity_type, action_type, conditions, priority)
WHERE EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid())
ON CONFLICT DO NOTHING;

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

GRANT ALL ON public.user_roles TO authenticated;
GRANT ALL ON public.user_role_assignments TO authenticated;
GRANT ALL ON public.approval_workflows TO authenticated;
GRANT ALL ON public.approval_requests TO authenticated;
GRANT ALL ON public.auto_approval_rules TO authenticated;
GRANT ALL ON public.crm_audit_trail TO authenticated;

-- Grant usage on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Approval system tables created successfully!';
    RAISE NOTICE 'Default roles, workflows, and auto-approval rules have been configured.';
END $$;