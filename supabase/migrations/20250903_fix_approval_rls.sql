-- Fix RLS policies for approval_requests table
-- This migration adds proper RLS policies to allow CRUD operations

-- First, check if RLS is enabled
ALTER TABLE approval_requests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON approval_requests;
DROP POLICY IF EXISTS "approval_requests_insert_policy" ON approval_requests;
DROP POLICY IF EXISTS "approval_requests_select_policy" ON approval_requests;
DROP POLICY IF EXISTS "approval_requests_update_policy" ON approval_requests;
DROP POLICY IF EXISTS "approval_requests_delete_policy" ON approval_requests;

-- Create comprehensive policies for approval_requests
-- Allow authenticated users to insert approval requests
CREATE POLICY "approval_requests_insert_policy" ON approval_requests
    FOR INSERT
    WITH CHECK (true);

-- Allow authenticated users to select approval requests
CREATE POLICY "approval_requests_select_policy" ON approval_requests
    FOR SELECT
    USING (true);

-- Allow authenticated users to update approval requests
CREATE POLICY "approval_requests_update_policy" ON approval_requests
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- Allow authenticated users to delete approval requests
CREATE POLICY "approval_requests_delete_policy" ON approval_requests
    FOR DELETE
    USING (true);

-- Also fix RLS for related tables if they exist
-- Fix ai_decisions table
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ai_decisions') THEN
        ALTER TABLE ai_decisions ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "ai_decisions_insert_policy" ON ai_decisions;
        DROP POLICY IF EXISTS "ai_decisions_select_policy" ON ai_decisions;
        DROP POLICY IF EXISTS "ai_decisions_update_policy" ON ai_decisions;
        DROP POLICY IF EXISTS "ai_decisions_delete_policy" ON ai_decisions;
        
        CREATE POLICY "ai_decisions_insert_policy" ON ai_decisions
            FOR INSERT
            WITH CHECK (true);
            
        CREATE POLICY "ai_decisions_select_policy" ON ai_decisions
            FOR SELECT
            USING (true);
            
        CREATE POLICY "ai_decisions_update_policy" ON ai_decisions
            FOR UPDATE
            USING (true)
            WITH CHECK (true);
            
        CREATE POLICY "ai_decisions_delete_policy" ON ai_decisions
            FOR DELETE
            USING (true);
    END IF;
END $$;

-- Fix approval_workflows table
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'approval_workflows') THEN
        ALTER TABLE approval_workflows ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "approval_workflows_insert_policy" ON approval_workflows;
        DROP POLICY IF EXISTS "approval_workflows_select_policy" ON approval_workflows;
        DROP POLICY IF EXISTS "approval_workflows_update_policy" ON approval_workflows;
        DROP POLICY IF EXISTS "approval_workflows_delete_policy" ON approval_workflows;
        
        CREATE POLICY "approval_workflows_insert_policy" ON approval_workflows
            FOR INSERT
            WITH CHECK (true);
            
        CREATE POLICY "approval_workflows_select_policy" ON approval_workflows
            FOR SELECT
            USING (true);
            
        CREATE POLICY "approval_workflows_update_policy" ON approval_workflows
            FOR UPDATE
            USING (true)
            WITH CHECK (true);
            
        CREATE POLICY "approval_workflows_delete_policy" ON approval_workflows
            FOR DELETE
            USING (true);
    END IF;
END $$;

-- Fix audit_logs table
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_logs') THEN
        ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "audit_logs_insert_policy" ON audit_logs;
        DROP POLICY IF EXISTS "audit_logs_select_policy" ON audit_logs;
        
        CREATE POLICY "audit_logs_insert_policy" ON audit_logs
            FOR INSERT
            WITH CHECK (true);
            
        CREATE POLICY "audit_logs_select_policy" ON audit_logs
            FOR SELECT
            USING (true);
    END IF;
END $$;

-- Fix client_communications table
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'client_communications') THEN
        ALTER TABLE client_communications ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "client_communications_insert_policy" ON client_communications;
        DROP POLICY IF EXISTS "client_communications_select_policy" ON client_communications;
        DROP POLICY IF EXISTS "client_communications_update_policy" ON client_communications;
        DROP POLICY IF EXISTS "client_communications_delete_policy" ON client_communications;
        
        CREATE POLICY "client_communications_insert_policy" ON client_communications
            FOR INSERT
            WITH CHECK (true);
            
        CREATE POLICY "client_communications_select_policy" ON client_communications
            FOR SELECT
            USING (true);
            
        CREATE POLICY "client_communications_update_policy" ON client_communications
            FOR UPDATE
            USING (true)
            WITH CHECK (true);
            
        CREATE POLICY "client_communications_delete_policy" ON client_communications
            FOR DELETE
            USING (true);
    END IF;
END $$;

-- Fix voice_processing_jobs table
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'voice_processing_jobs') THEN
        ALTER TABLE voice_processing_jobs ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "voice_processing_jobs_insert_policy" ON voice_processing_jobs;
        DROP POLICY IF EXISTS "voice_processing_jobs_select_policy" ON voice_processing_jobs;
        DROP POLICY IF EXISTS "voice_processing_jobs_update_policy" ON voice_processing_jobs;
        DROP POLICY IF EXISTS "voice_processing_jobs_delete_policy" ON voice_processing_jobs;
        
        CREATE POLICY "voice_processing_jobs_insert_policy" ON voice_processing_jobs
            FOR INSERT
            WITH CHECK (true);
            
        CREATE POLICY "voice_processing_jobs_select_policy" ON voice_processing_jobs
            FOR SELECT
            USING (true);
            
        CREATE POLICY "voice_processing_jobs_update_policy" ON voice_processing_jobs
            FOR UPDATE
            USING (true)
            WITH CHECK (true);
            
        CREATE POLICY "voice_processing_jobs_delete_policy" ON voice_processing_jobs
            FOR DELETE
            USING (true);
    END IF;
END $$;

-- Grant necessary permissions to authenticated users
GRANT ALL ON approval_requests TO authenticated;
GRANT ALL ON ai_decisions TO authenticated;
GRANT ALL ON approval_workflows TO authenticated;
GRANT ALL ON audit_logs TO authenticated;
GRANT ALL ON client_communications TO authenticated;
GRANT ALL ON voice_processing_jobs TO authenticated;

-- Also grant to anon for public access (if needed)
GRANT ALL ON approval_requests TO anon;
GRANT ALL ON ai_decisions TO anon;
GRANT ALL ON approval_workflows TO anon;
GRANT ALL ON audit_logs TO anon;
GRANT ALL ON client_communications TO anon;
GRANT ALL ON voice_processing_jobs TO anon;