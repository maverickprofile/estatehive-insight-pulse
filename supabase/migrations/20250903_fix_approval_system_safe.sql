-- =====================================================
-- SAFE MIGRATION: Fix Approval System Tables and RLS
-- =====================================================
-- This migration safely creates missing tables and fixes RLS policies
-- It checks for existing objects to avoid errors
-- =====================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- CREATE MISSING TABLES (Skip if exists)
-- =====================================================

-- Check and create approval_requests table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables 
                   WHERE table_schema = 'public' 
                   AND table_name = 'approval_requests') THEN
        CREATE TABLE public.approval_requests (
            id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
            organization_id UUID,
            
            -- Request details
            entity_type TEXT NOT NULL, -- 'lead', 'client', 'property', 'task', etc.
            entity_id UUID,
            action_type TEXT NOT NULL, -- 'create', 'update', 'delete', 'status_change', etc.
            
            -- Decision reference
            decision_id UUID,
            
            -- Approval details
            requested_by UUID,
            requested_at TIMESTAMPTZ DEFAULT NOW(),
            
            -- Approval workflow
            workflow_id UUID,
            current_level INTEGER DEFAULT 1,
            max_level INTEGER DEFAULT 1,
            
            -- Status
            status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'expired', 'auto_approved'
            priority TEXT DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
            
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
    END IF;
END $$;

-- Check and create ai_decisions table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables 
                   WHERE table_schema = 'public' 
                   AND table_name = 'ai_decisions') THEN
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
            approval_request_id UUID,
            
            -- Metadata
            ai_model TEXT,
            prompt_tokens INTEGER,
            completion_tokens INTEGER,
            processing_time_ms INTEGER,
            
            -- Timestamps
            suggested_at TIMESTAMPTZ DEFAULT NOW(),
            created_at TIMESTAMPTZ DEFAULT NOW()
        );
    END IF;
END $$;

-- Check and create audit_logs table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables 
                   WHERE table_schema = 'public' 
                   AND table_name = 'audit_logs') THEN
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
    END IF;
END $$;

-- Check and create approval_workflows table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables 
                   WHERE table_schema = 'public' 
                   AND table_name = 'approval_workflows') THEN
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
    END IF;
END $$;

-- =====================================================
-- FIX ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Fix approval_requests table RLS
ALTER TABLE approval_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "approval_requests_insert_policy" ON approval_requests;
DROP POLICY IF EXISTS "approval_requests_select_policy" ON approval_requests;
DROP POLICY IF EXISTS "approval_requests_update_policy" ON approval_requests;
DROP POLICY IF EXISTS "approval_requests_delete_policy" ON approval_requests;

CREATE POLICY "approval_requests_insert_policy" ON approval_requests
    FOR INSERT WITH CHECK (true);

CREATE POLICY "approval_requests_select_policy" ON approval_requests
    FOR SELECT USING (true);

CREATE POLICY "approval_requests_update_policy" ON approval_requests
    FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "approval_requests_delete_policy" ON approval_requests
    FOR DELETE USING (true);

-- Fix ai_decisions table RLS
ALTER TABLE ai_decisions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ai_decisions_insert_policy" ON ai_decisions;
DROP POLICY IF EXISTS "ai_decisions_select_policy" ON ai_decisions;
DROP POLICY IF EXISTS "ai_decisions_update_policy" ON ai_decisions;
DROP POLICY IF EXISTS "ai_decisions_delete_policy" ON ai_decisions;

CREATE POLICY "ai_decisions_insert_policy" ON ai_decisions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "ai_decisions_select_policy" ON ai_decisions
    FOR SELECT USING (true);

CREATE POLICY "ai_decisions_update_policy" ON ai_decisions
    FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "ai_decisions_delete_policy" ON ai_decisions
    FOR DELETE USING (true);

-- Fix audit_logs table RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "audit_logs_insert_policy" ON audit_logs;
DROP POLICY IF EXISTS "audit_logs_select_policy" ON audit_logs;

CREATE POLICY "audit_logs_insert_policy" ON audit_logs
    FOR INSERT WITH CHECK (true);

CREATE POLICY "audit_logs_select_policy" ON audit_logs
    FOR SELECT USING (true);

-- Fix approval_workflows table RLS
ALTER TABLE approval_workflows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "approval_workflows_insert_policy" ON approval_workflows;
DROP POLICY IF EXISTS "approval_workflows_select_policy" ON approval_workflows;
DROP POLICY IF EXISTS "approval_workflows_update_policy" ON approval_workflows;
DROP POLICY IF EXISTS "approval_workflows_delete_policy" ON approval_workflows;

CREATE POLICY "approval_workflows_insert_policy" ON approval_workflows
    FOR INSERT WITH CHECK (true);

CREATE POLICY "approval_workflows_select_policy" ON approval_workflows
    FOR SELECT USING (true);

CREATE POLICY "approval_workflows_update_policy" ON approval_workflows
    FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "approval_workflows_delete_policy" ON approval_workflows
    FOR DELETE USING (true);

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Grant permissions to authenticated users
GRANT ALL ON approval_requests TO authenticated;
GRANT ALL ON ai_decisions TO authenticated;
GRANT ALL ON approval_workflows TO authenticated;
GRANT ALL ON audit_logs TO authenticated;

-- Grant permissions to anon users (for public access)
GRANT ALL ON approval_requests TO anon;
GRANT ALL ON ai_decisions TO anon;
GRANT ALL ON approval_workflows TO anon;
GRANT ALL ON audit_logs TO anon;

-- =====================================================
-- CREATE INDEXES (Skip if exists)
-- =====================================================

-- Create indexes if they don't exist
DO $$
BEGIN
    -- approval_requests indexes
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_approval_requests_org') THEN
        CREATE INDEX idx_approval_requests_org ON approval_requests(organization_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_approval_requests_status') THEN
        CREATE INDEX idx_approval_requests_status ON approval_requests(status);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_approval_requests_decision') THEN
        CREATE INDEX idx_approval_requests_decision ON approval_requests(decision_id);
    END IF;
    
    -- ai_decisions indexes
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_ai_decisions_org') THEN
        CREATE INDEX idx_ai_decisions_org ON ai_decisions(organization_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_ai_decisions_comm') THEN
        CREATE INDEX idx_ai_decisions_comm ON ai_decisions(communication_id);
    END IF;
    
    -- audit_logs indexes
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_audit_logs_org') THEN
        CREATE INDEX idx_audit_logs_org ON audit_logs(organization_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_audit_logs_entity') THEN
        CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
    END IF;
    
    -- approval_workflows indexes
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_approval_workflows_org') THEN
        CREATE INDEX idx_approval_workflows_org ON approval_workflows(organization_id);
    END IF;
END $$;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE 'Approval system tables and RLS policies have been successfully configured!';
END $$;