-- =====================================================
-- FIX AGENTS TABLE RLS POLICIES
-- =====================================================
-- Fixes the Row Level Security policies for agents table
-- to allow authenticated users to create and manage agents
-- =====================================================

-- First, ensure RLS is enabled
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies on agents table
DROP POLICY IF EXISTS "Authenticated users can manage agents" ON agents;
DROP POLICY IF EXISTS "View org agents" ON agents;
DROP POLICY IF EXISTS "Create org agents" ON agents;
DROP POLICY IF EXISTS "Update org agents" ON agents;
DROP POLICY IF EXISTS "Delete org agents" ON agents;
DROP POLICY IF EXISTS "Agents can manage own properties" ON agents;
DROP POLICY IF EXISTS "Agents can view assigned leads" ON agents;
DROP POLICY IF EXISTS "Agents can update assigned leads" ON agents;
DROP POLICY IF EXISTS "Agents can view assigned clients" ON agents;

-- Create simple, permissive policies for authenticated users
-- This allows any authenticated user to perform CRUD operations on agents

-- Policy for SELECT (viewing agents)
CREATE POLICY "Authenticated users can view all agents" ON agents
    FOR SELECT 
    TO authenticated
    USING (true);

-- Policy for INSERT (creating new agents)
CREATE POLICY "Authenticated users can create agents" ON agents
    FOR INSERT 
    TO authenticated
    WITH CHECK (true);

-- Policy for UPDATE (modifying agents)
CREATE POLICY "Authenticated users can update agents" ON agents
    FOR UPDATE 
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Policy for DELETE (removing agents)
CREATE POLICY "Authenticated users can delete agents" ON agents
    FOR DELETE 
    TO authenticated
    USING (true);

-- Grant necessary permissions to authenticated users
GRANT ALL ON agents TO authenticated;
GRANT USAGE ON SEQUENCE agent_seq TO authenticated;

-- Verify the policies are in place
DO $$
DECLARE
    policy_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE tablename = 'agents';
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ AGENTS RLS POLICIES FIXED!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '📊 Total policies on agents table: %', policy_count;
    RAISE NOTICE '✅ Authenticated users can now:';
    RAISE NOTICE '   - View all agents';
    RAISE NOTICE '   - Create new agents';
    RAISE NOTICE '   - Update agents';
    RAISE NOTICE '   - Delete agents';
    RAISE NOTICE '========================================';
END $$;