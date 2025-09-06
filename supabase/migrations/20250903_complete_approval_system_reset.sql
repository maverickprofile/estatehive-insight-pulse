-- =====================================================
-- COMPLETE APPROVAL SYSTEM RESET AND SETUP
-- =====================================================
-- This migration safely drops and recreates all approval system objects
-- Run this INSTEAD of the other migrations if you're getting errors
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- DROP ALL EXISTING OBJECTS (SAFE)
-- =====================================================

-- Drop existing indexes
DROP INDEX IF EXISTS idx_user_roles_org CASCADE;
DROP INDEX IF EXISTS idx_user_roles_code CASCADE;
DROP INDEX IF EXISTS idx_user_role_assignments_user CASCADE;
DROP INDEX IF EXISTS idx_user_role_assignments_role CASCADE;
DROP INDEX IF EXISTS idx_approval_requests_org CASCADE;
DROP INDEX IF EXISTS idx_approval_requests_status CASCADE;
DROP INDEX IF EXISTS idx_approval_requests_entity CASCADE;
DROP INDEX IF EXISTS idx_approval_requests_decision CASCADE;
DROP INDEX IF EXISTS idx_approval_requests_expires CASCADE;
DROP INDEX IF EXISTS idx_approval_workflows_org CASCADE;
DROP INDEX IF EXISTS idx_approval_workflows_entity CASCADE;
DROP INDEX IF EXISTS idx_approval_workflows_active CASCADE;
DROP INDEX IF EXISTS idx_audit_logs_org CASCADE;
DROP INDEX IF EXISTS idx_audit_logs_entity CASCADE;
DROP INDEX IF EXISTS idx_audit_logs_user CASCADE;
DROP INDEX IF EXISTS idx_audit_logs_created CASCADE;
DROP INDEX IF EXISTS idx_ai_decisions_org CASCADE;
DROP INDEX IF EXISTS idx_ai_decisions_comm CASCADE;
DROP INDEX IF EXISTS idx_ai_decisions_status CASCADE;

-- Drop existing tables (in correct order due to foreign keys)
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS approval_requests CASCADE;
DROP TABLE IF EXISTS approval_workflows CASCADE;
DROP TABLE IF EXISTS user_role_assignments CASCADE;
DROP TABLE IF EXISTS user_roles CASCADE;
DROP TABLE IF EXISTS ai_decisions CASCADE;

-- =====================================================
-- CREATE CORE TABLES
-- =====================================================

-- 1. Create approval_requests table (main table)
CREATE TABLE public.approval_requests (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID,
    
    -- Request details
    entity_type TEXT NOT NULL,
    entity_id UUID,
    action_type TEXT NOT NULL,
    
    -- Decision reference
    decision_id UUID,
    
    -- Approval details
    requested_by UUID,
    requested_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Workflow
    workflow_id UUID,
    current_level INTEGER DEFAULT 1,
    max_level INTEGER DEFAULT 1,
    
    -- Status
    status TEXT DEFAULT 'pending',
    priority TEXT DEFAULT 'medium',
    
    -- Approval action
    approved_by UUID,
    approved_at TIMESTAMPTZ,
    rejected_by UUID,
    rejected_at TIMESTAMPTZ,
    
    -- Additional info
    change_summary TEXT,
    proposed_changes JSONB DEFAULT '{}',
    approval_notes TEXT,
    rejection_reason TEXT,
    
    -- Expiry
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours'),
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create ai_decisions table
CREATE TABLE public.ai_decisions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    communication_id UUID,
    organization_id UUID,
    
    -- Decision details
    decision_type TEXT NOT NULL,
    suggested_action JSONB NOT NULL,
    confidence_score NUMERIC(3, 2),
    
    -- Execution status
    status TEXT DEFAULT 'pending',
    executed_at TIMESTAMPTZ,
    execution_result JSONB,
    
    -- Approval tracking
    requires_approval BOOLEAN DEFAULT false,
    approval_request_id UUID REFERENCES approval_requests(id),
    
    -- Metadata
    ai_model TEXT,
    prompt_tokens INTEGER,
    completion_tokens INTEGER,
    processing_time_ms INTEGER,
    
    -- Timestamps
    suggested_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create audit_logs table
CREATE TABLE public.audit_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID,
    
    -- Audit details
    event_type TEXT NOT NULL,
    entity_type TEXT,
    entity_id UUID,
    
    -- User tracking
    user_id UUID,
    user_role TEXT,
    ip_address TEXT,
    user_agent TEXT,
    
    -- Event data
    action TEXT NOT NULL,
    description TEXT,
    old_values JSONB,
    new_values JSONB,
    metadata JSONB DEFAULT '{}',
    
    -- Reference
    request_id UUID,
    session_id TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create approval_workflows table
CREATE TABLE public.approval_workflows (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID,
    
    -- Workflow details
    workflow_name TEXT NOT NULL,
    description TEXT,
    
    -- Conditions
    entity_type TEXT NOT NULL,
    action_type TEXT NOT NULL,
    conditions JSONB DEFAULT '{}',
    
    -- Approval chain
    approval_levels INTEGER DEFAULT 1,
    approval_chain JSONB DEFAULT '[]',
    
    -- Auto-approval rules
    auto_approve_enabled BOOLEAN DEFAULT false,
    auto_approve_conditions JSONB DEFAULT '{}',
    
    -- Settings
    require_all_approvals BOOLEAN DEFAULT false,
    allow_self_approval BOOLEAN DEFAULT false,
    escalation_enabled BOOLEAN DEFAULT false,
    escalation_time_hours INTEGER DEFAULT 24,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ENABLE ROW LEVEL SECURITY WITH PROPER POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE approval_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_workflows ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for approval_requests
CREATE POLICY "Enable all operations for all users" ON approval_requests
    FOR ALL USING (true) WITH CHECK (true);

-- Create permissive policies for ai_decisions
CREATE POLICY "Enable all operations for all users" ON ai_decisions
    FOR ALL USING (true) WITH CHECK (true);

-- Create permissive policies for audit_logs
CREATE POLICY "Enable all operations for all users" ON audit_logs
    FOR ALL USING (true) WITH CHECK (true);

-- Create permissive policies for approval_workflows
CREATE POLICY "Enable all operations for all users" ON approval_workflows
    FOR ALL USING (true) WITH CHECK (true);

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Grant full permissions to authenticated users
GRANT ALL ON approval_requests TO authenticated;
GRANT ALL ON ai_decisions TO authenticated;
GRANT ALL ON audit_logs TO authenticated;
GRANT ALL ON approval_workflows TO authenticated;

-- Grant full permissions to anon users (for development)
GRANT ALL ON approval_requests TO anon;
GRANT ALL ON ai_decisions TO anon;
GRANT ALL ON audit_logs TO anon;
GRANT ALL ON approval_workflows TO anon;

-- Grant usage on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;

-- =====================================================
-- CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Indexes for approval_requests
CREATE INDEX idx_approval_requests_org ON approval_requests(organization_id);
CREATE INDEX idx_approval_requests_status ON approval_requests(status);
CREATE INDEX idx_approval_requests_decision ON approval_requests(decision_id);
CREATE INDEX idx_approval_requests_expires ON approval_requests(expires_at);

-- Indexes for ai_decisions
CREATE INDEX idx_ai_decisions_org ON ai_decisions(organization_id);
CREATE INDEX idx_ai_decisions_comm ON ai_decisions(communication_id);
CREATE INDEX idx_ai_decisions_status ON ai_decisions(status);

-- Indexes for audit_logs
CREATE INDEX idx_audit_logs_org ON audit_logs(organization_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);

-- Indexes for approval_workflows
CREATE INDEX idx_approval_workflows_org ON approval_workflows(organization_id);
CREATE INDEX idx_approval_workflows_entity ON approval_workflows(entity_type, action_type);

-- =====================================================
-- ADD FOREIGN KEY CONSTRAINT AFTER TABLES ARE CREATED
-- =====================================================

ALTER TABLE approval_requests 
    ADD CONSTRAINT fk_approval_request_decision 
    FOREIGN KEY (decision_id) 
    REFERENCES ai_decisions(id) 
    ON DELETE SET NULL;

-- =====================================================
-- INSERT DEFAULT WORKFLOW (OPTIONAL)
-- =====================================================

INSERT INTO approval_workflows (
    workflow_name,
    description,
    entity_type,
    action_type,
    approval_levels,
    auto_approve_enabled,
    auto_approve_conditions,
    is_default
) VALUES (
    'Default Approval Workflow',
    'Standard approval workflow for all actions',
    'all',
    'all',
    1,
    true,
    '{"confidence_threshold": 0.9}',
    true
) ON CONFLICT DO NOTHING;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Approval system has been successfully set up!';
    RAISE NOTICE '📋 Tables created: approval_requests, ai_decisions, audit_logs, approval_workflows';
    RAISE NOTICE '🔒 RLS policies: Enabled with permissive policies';
    RAISE NOTICE '🎯 Indexes: Created for performance';
    RAISE NOTICE '✨ Ready to use!';
END $$;