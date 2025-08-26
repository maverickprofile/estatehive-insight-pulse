-- =====================================================
-- FIX RLS INFINITE RECURSION ERROR
-- =====================================================
-- Fixes the infinite recursion in Row Level Security policies
-- =====================================================

BEGIN;

-- =====================================================
-- 1. DROP PROBLEMATIC POLICIES
-- =====================================================

-- Drop all existing policies that might cause recursion
DROP POLICY IF EXISTS "Users view own organization" ON organizations;
DROP POLICY IF EXISTS "Org owners update organization" ON organizations;
DROP POLICY IF EXISTS "View team members" ON team_members;
DROP POLICY IF EXISTS "Admins manage team" ON team_members;
DROP POLICY IF EXISTS "View organization properties" ON properties;
DROP POLICY IF EXISTS "Create organization properties" ON properties;
DROP POLICY IF EXISTS "Update organization properties" ON properties;
DROP POLICY IF EXISTS "Delete organization properties" ON properties;
DROP POLICY IF EXISTS "View organization leads" ON leads;
DROP POLICY IF EXISTS "Create organization leads" ON leads;
DROP POLICY IF EXISTS "Update organization leads" ON leads;
DROP POLICY IF EXISTS "View organization clients" ON clients;
DROP POLICY IF EXISTS "Create organization clients" ON clients;
DROP POLICY IF EXISTS "Update organization clients" ON clients;
DROP POLICY IF EXISTS "View organization activity" ON activity_logs;
DROP POLICY IF EXISTS "Create activity logs" ON activity_logs;

-- =====================================================
-- 2. CREATE SIMPLER NON-RECURSIVE POLICIES
-- =====================================================

-- Create a security definer function to check organization membership
-- This avoids recursion by not using RLS within the check
CREATE OR REPLACE FUNCTION public.check_org_membership(org_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    is_member BOOLEAN;
    is_super BOOLEAN;
BEGIN
    -- Check if user is super admin
    SELECT EXISTS(
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND is_super_admin = true
    ) INTO is_super;
    
    IF is_super THEN
        RETURN TRUE;
    END IF;
    
    -- Check if user is member of organization
    SELECT EXISTS(
        SELECT 1 FROM public.team_members 
        WHERE user_id = auth.uid() 
        AND organization_id = org_id
        AND is_active = true
    ) INTO is_member;
    
    RETURN is_member;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get user's role in organization
CREATE OR REPLACE FUNCTION public.get_user_role(org_id UUID)
RETURNS TEXT AS $$
DECLARE
    user_role TEXT;
BEGIN
    SELECT role INTO user_role
    FROM public.team_members
    WHERE user_id = auth.uid()
    AND organization_id = org_id
    AND is_active = true
    LIMIT 1;
    
    RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin_in_org(org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS(
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND is_super_admin = true
    ) OR EXISTS(
        SELECT 1 FROM public.team_members
        WHERE user_id = auth.uid()
        AND organization_id = org_id
        AND role IN ('super_admin', 'admin')
        AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 3. ORGANIZATIONS POLICIES (SIMPLE)
-- =====================================================

CREATE POLICY "View own organization" ON organizations
    FOR SELECT USING (
        public.check_org_membership(id)
    );

CREATE POLICY "Update own organization" ON organizations
    FOR UPDATE USING (
        public.is_admin_in_org(id)
    );

-- =====================================================
-- 4. TEAM MEMBERS POLICIES (SIMPLE)
-- =====================================================

-- Allow users to view team members in their organization
CREATE POLICY "View own org team members" ON team_members
    FOR SELECT USING (
        public.check_org_membership(organization_id)
    );

-- Allow admins to manage team members
CREATE POLICY "Admins manage team members" ON team_members
    FOR INSERT WITH CHECK (
        public.is_admin_in_org(organization_id)
    );

CREATE POLICY "Admins update team members" ON team_members
    FOR UPDATE USING (
        public.is_admin_in_org(organization_id)
    );

CREATE POLICY "Admins delete team members" ON team_members
    FOR DELETE USING (
        public.is_admin_in_org(organization_id)
    );

-- =====================================================
-- 5. PROPERTIES POLICIES (SIMPLE)
-- =====================================================

-- View properties
CREATE POLICY "View org properties" ON properties
    FOR SELECT USING (
        public.check_org_membership(organization_id)
    );

-- Create properties
CREATE POLICY "Create org properties" ON properties
    FOR INSERT WITH CHECK (
        public.check_org_membership(organization_id)
    );

-- Update properties
CREATE POLICY "Update org properties" ON properties
    FOR UPDATE USING (
        public.check_org_membership(organization_id)
        AND (
            public.get_user_role(organization_id) IN ('super_admin', 'admin', 'manager', 'agent')
            OR created_by = auth.uid()
        )
    );

-- Delete properties
CREATE POLICY "Delete org properties" ON properties
    FOR DELETE USING (
        public.check_org_membership(organization_id)
        AND public.get_user_role(organization_id) IN ('super_admin', 'admin', 'manager')
    );

-- =====================================================
-- 6. LEADS POLICIES (SIMPLE)
-- =====================================================

CREATE POLICY "View org leads" ON leads
    FOR SELECT USING (
        public.check_org_membership(organization_id)
    );

CREATE POLICY "Create org leads" ON leads
    FOR INSERT WITH CHECK (
        public.check_org_membership(organization_id)
    );

CREATE POLICY "Update org leads" ON leads
    FOR UPDATE USING (
        public.check_org_membership(organization_id)
    );

CREATE POLICY "Delete org leads" ON leads
    FOR DELETE USING (
        public.check_org_membership(organization_id)
        AND public.get_user_role(organization_id) IN ('super_admin', 'admin', 'manager')
    );

-- =====================================================
-- 7. CLIENTS POLICIES (SIMPLE)
-- =====================================================

CREATE POLICY "View org clients" ON clients
    FOR SELECT USING (
        public.check_org_membership(organization_id)
    );

CREATE POLICY "Create org clients" ON clients
    FOR INSERT WITH CHECK (
        public.check_org_membership(organization_id)
    );

CREATE POLICY "Update org clients" ON clients
    FOR UPDATE USING (
        public.check_org_membership(organization_id)
    );

CREATE POLICY "Delete org clients" ON clients
    FOR DELETE USING (
        public.check_org_membership(organization_id)
        AND public.get_user_role(organization_id) IN ('super_admin', 'admin', 'manager')
    );

-- =====================================================
-- 8. AGENTS POLICIES
-- =====================================================

CREATE POLICY "View org agents" ON agents
    FOR SELECT USING (
        public.check_org_membership(organization_id)
    );

CREATE POLICY "Create org agents" ON agents
    FOR INSERT WITH CHECK (
        public.check_org_membership(organization_id)
        AND public.is_admin_in_org(organization_id)
    );

CREATE POLICY "Update org agents" ON agents
    FOR UPDATE USING (
        public.check_org_membership(organization_id)
        AND public.is_admin_in_org(organization_id)
    );

CREATE POLICY "Delete org agents" ON agents
    FOR DELETE USING (
        public.check_org_membership(organization_id)
        AND public.is_admin_in_org(organization_id)
    );

-- =====================================================
-- 9. APPOINTMENTS POLICIES
-- =====================================================

CREATE POLICY "View org appointments" ON appointments
    FOR SELECT USING (
        public.check_org_membership(organization_id)
    );

CREATE POLICY "Create org appointments" ON appointments
    FOR INSERT WITH CHECK (
        public.check_org_membership(organization_id)
    );

CREATE POLICY "Update org appointments" ON appointments
    FOR UPDATE USING (
        public.check_org_membership(organization_id)
    );

CREATE POLICY "Delete org appointments" ON appointments
    FOR DELETE USING (
        public.check_org_membership(organization_id)
        AND public.get_user_role(organization_id) IN ('super_admin', 'admin', 'manager')
    );

-- =====================================================
-- 10. INVOICES POLICIES
-- =====================================================

CREATE POLICY "View org invoices" ON invoices
    FOR SELECT USING (
        public.check_org_membership(organization_id)
    );

CREATE POLICY "Create org invoices" ON invoices
    FOR INSERT WITH CHECK (
        public.check_org_membership(organization_id)
    );

CREATE POLICY "Update org invoices" ON invoices
    FOR UPDATE USING (
        public.check_org_membership(organization_id)
    );

CREATE POLICY "Delete org invoices" ON invoices
    FOR DELETE USING (
        public.check_org_membership(organization_id)
        AND public.get_user_role(organization_id) IN ('super_admin', 'admin')
    );

-- =====================================================
-- 11. CONVERSATIONS POLICIES
-- =====================================================

CREATE POLICY "View org conversations" ON conversations
    FOR SELECT USING (
        public.check_org_membership(organization_id)
    );

CREATE POLICY "Create org conversations" ON conversations
    FOR INSERT WITH CHECK (
        public.check_org_membership(organization_id)
    );

CREATE POLICY "Update org conversations" ON conversations
    FOR UPDATE USING (
        public.check_org_membership(organization_id)
    );

-- =====================================================
-- 12. NOTIFICATIONS POLICIES
-- =====================================================

CREATE POLICY "View org notifications" ON notifications
    FOR SELECT USING (
        public.check_org_membership(organization_id)
    );

CREATE POLICY "Create org notifications" ON notifications
    FOR INSERT WITH CHECK (
        public.check_org_membership(organization_id)
    );

-- =====================================================
-- 13. ACTIVITY LOGS POLICIES
-- =====================================================

CREATE POLICY "View org activity logs" ON activity_logs
    FOR SELECT USING (
        public.check_org_membership(organization_id)
    );

CREATE POLICY "Create org activity logs" ON activity_logs
    FOR INSERT WITH CHECK (
        user_id = auth.uid()
    );

-- =====================================================
-- 14. TEAM INVITATIONS POLICIES
-- =====================================================

CREATE POLICY "View org invitations" ON team_invitations
    FOR SELECT USING (
        public.is_admin_in_org(organization_id)
    );

CREATE POLICY "Create org invitations" ON team_invitations
    FOR INSERT WITH CHECK (
        public.is_admin_in_org(organization_id)
    );

CREATE POLICY "Update org invitations" ON team_invitations
    FOR UPDATE USING (
        public.is_admin_in_org(organization_id)
    );

CREATE POLICY "Delete org invitations" ON team_invitations
    FOR DELETE USING (
        public.is_admin_in_org(organization_id)
    );

-- =====================================================
-- 15. PROFILES POLICIES
-- =====================================================

-- Allow users to view profiles in their organization
CREATE POLICY "View org profiles" ON profiles
    FOR SELECT USING (
        id = auth.uid() 
        OR 
        public.check_org_membership(organization_id)
    );

-- Allow users to update their own profile
CREATE POLICY "Update own profile" ON profiles
    FOR UPDATE USING (
        id = auth.uid()
    );

COMMIT;

-- =====================================================
-- VERIFICATION
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE 'RLS recursion fix has been applied successfully';
    RAISE NOTICE 'All policies now use SECURITY DEFINER functions to avoid recursion';
    RAISE NOTICE 'Organization membership checks are centralized';
END $$;