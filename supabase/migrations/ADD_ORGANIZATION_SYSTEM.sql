-- =====================================================
-- ORGANIZATION & TEAM MANAGEMENT SYSTEM
-- =====================================================
-- Adds multi-tenant support with team invitations
-- Super Admin: mahesh@simsinfotech.com
-- =====================================================

BEGIN;

-- =====================================================
-- 1. CREATE ORGANIZATION TABLES
-- =====================================================

-- Organizations/Companies table
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    logo_url TEXT,
    website TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    country TEXT DEFAULT 'India',
    postal_code TEXT,
    settings JSONB DEFAULT '{
        "allow_property_sharing": false,
        "require_approval": true,
        "default_currency": "INR",
        "timezone": "Asia/Kolkata"
    }',
    subscription_plan TEXT DEFAULT 'basic',
    subscription_expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Team members linking users to organizations
CREATE TABLE IF NOT EXISTS team_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('super_admin', 'admin', 'manager', 'agent', 'viewer')) DEFAULT 'agent',
    permissions JSONB DEFAULT '{
        "properties": {"create": true, "read": true, "update": true, "delete": false},
        "leads": {"create": true, "read": true, "update": true, "delete": false},
        "clients": {"create": true, "read": true, "update": true, "delete": false},
        "invoices": {"create": true, "read": true, "update": false, "delete": false},
        "reports": {"view": true, "export": false},
        "team": {"invite": false, "remove": false, "edit": false}
    }',
    department TEXT,
    designation TEXT,
    invited_by UUID REFERENCES auth.users(id),
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    last_active_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, user_id)
);

-- Team invitations for new members
CREATE TABLE IF NOT EXISTS team_invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'agent' CHECK (role IN ('admin', 'manager', 'agent', 'viewer')),
    permissions JSONB,
    token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
    message TEXT,
    invited_by UUID NOT NULL REFERENCES auth.users(id),
    invited_by_name TEXT,
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
    accepted BOOLEAN DEFAULT false,
    accepted_at TIMESTAMPTZ,
    rejected BOOLEAN DEFAULT false,
    rejected_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activity logs for audit trail
CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    user_email TEXT,
    action TEXT NOT NULL,
    entity_type TEXT,
    entity_id TEXT,
    entity_name TEXT,
    changes JSONB,
    metadata JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_team_members_org_id ON team_members(organization_id);
CREATE INDEX idx_team_members_user_id ON team_members(user_id);
CREATE INDEX idx_team_invitations_token ON team_invitations(token);
CREATE INDEX idx_team_invitations_email ON team_invitations(email);
CREATE INDEX idx_activity_logs_org_id ON activity_logs(organization_id);
CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at DESC);

-- =====================================================
-- 2. ADD ORGANIZATION SUPPORT TO EXISTING TABLES
-- =====================================================

-- Add organization_id to all business tables
ALTER TABLE properties ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
ALTER TABLE agents ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

-- Add created_by field to track who created records
ALTER TABLE properties ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- Add organization_id to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN DEFAULT false;

-- Create indexes for organization filtering
CREATE INDEX IF NOT EXISTS idx_properties_org_id ON properties(organization_id);
CREATE INDEX IF NOT EXISTS idx_leads_org_id ON leads(organization_id);
CREATE INDEX IF NOT EXISTS idx_clients_org_id ON clients(organization_id);
CREATE INDEX IF NOT EXISTS idx_agents_org_id ON agents(organization_id);
CREATE INDEX IF NOT EXISTS idx_appointments_org_id ON appointments(organization_id);
CREATE INDEX IF NOT EXISTS idx_invoices_org_id ON invoices(organization_id);

-- =====================================================
-- 3. CREATE DEFAULT ORGANIZATION & SUPER ADMIN
-- =====================================================

-- Create SIMS InfoTech as default organization
INSERT INTO organizations (
    id,
    name,
    email,
    phone,
    website,
    city,
    state,
    country,
    settings,
    subscription_plan,
    is_active
) VALUES (
    '00000000-0000-0000-0000-000000000001',
    'SIMS InfoTech',
    'mahesh@simsinfotech.com',
    '+91 9999999999',
    'https://simsinfotech.com',
    'Bangalore',
    'Karnataka', 
    'India',
    '{
        "allow_property_sharing": true,
        "require_approval": false,
        "default_currency": "INR",
        "timezone": "Asia/Kolkata",
        "features": ["unlimited_properties", "unlimited_users", "api_access", "custom_branding"]
    }',
    'enterprise',
    true
) ON CONFLICT (id) DO NOTHING;

-- Assign all existing data to default organization
UPDATE properties SET organization_id = '00000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
UPDATE leads SET organization_id = '00000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
UPDATE clients SET organization_id = '00000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
UPDATE agents SET organization_id = '00000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
UPDATE appointments SET organization_id = '00000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
UPDATE invoices SET organization_id = '00000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
UPDATE conversations SET organization_id = '00000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
UPDATE notifications SET organization_id = '00000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;

-- =====================================================
-- 4. ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- =====================================================
-- ORGANIZATION POLICIES
-- =====================================================

-- Organizations: Users can view their organization
CREATE POLICY "Users view own organization" ON organizations
    FOR SELECT USING (
        id IN (
            SELECT organization_id FROM team_members 
            WHERE user_id = auth.uid()
        )
        OR 
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND is_super_admin = true
        )
    );

-- Organizations: Only org owners and super admin can update
CREATE POLICY "Org owners update organization" ON organizations
    FOR UPDATE USING (
        owner_id = auth.uid()
        OR 
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND is_super_admin = true
        )
    );

-- =====================================================
-- TEAM MEMBER POLICIES
-- =====================================================

-- Team members: View members in same organization
CREATE POLICY "View team members" ON team_members
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM team_members 
            WHERE user_id = auth.uid()
        )
        OR 
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND is_super_admin = true
        )
    );

-- Team members: Admins can manage team
CREATE POLICY "Admins manage team" ON team_members
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM team_members 
            WHERE user_id = auth.uid() 
            AND organization_id = team_members.organization_id
            AND role IN ('super_admin', 'admin')
        )
        OR 
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND is_super_admin = true
        )
    );

-- =====================================================
-- PROPERTIES POLICIES
-- =====================================================

-- Properties: View organization properties
CREATE POLICY "View organization properties" ON properties
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM team_members 
            WHERE user_id = auth.uid()
        )
        OR 
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND is_super_admin = true
        )
    );

-- Properties: Create with proper organization
CREATE POLICY "Create organization properties" ON properties
    FOR INSERT WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM team_members 
            WHERE user_id = auth.uid()
            AND role IN ('super_admin', 'admin', 'manager', 'agent')
        )
        OR 
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND is_super_admin = true
        )
    );

-- Properties: Update organization properties
CREATE POLICY "Update organization properties" ON properties
    FOR UPDATE USING (
        organization_id IN (
            SELECT organization_id FROM team_members 
            WHERE user_id = auth.uid()
            AND role IN ('super_admin', 'admin', 'manager', 'agent')
        )
        OR created_by = auth.uid()
        OR 
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND is_super_admin = true
        )
    );

-- Properties: Delete with permission
CREATE POLICY "Delete organization properties" ON properties
    FOR DELETE USING (
        organization_id IN (
            SELECT organization_id FROM team_members 
            WHERE user_id = auth.uid()
            AND role IN ('super_admin', 'admin', 'manager')
        )
        OR 
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND is_super_admin = true
        )
    );

-- =====================================================
-- SIMILAR POLICIES FOR OTHER TABLES
-- =====================================================

-- Leads policies
CREATE POLICY "View organization leads" ON leads
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM team_members WHERE user_id = auth.uid()
        )
        OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_super_admin = true)
    );

CREATE POLICY "Create organization leads" ON leads
    FOR INSERT WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM team_members WHERE user_id = auth.uid()
        )
        OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_super_admin = true)
    );

CREATE POLICY "Update organization leads" ON leads
    FOR UPDATE USING (
        organization_id IN (
            SELECT organization_id FROM team_members WHERE user_id = auth.uid()
        )
        OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_super_admin = true)
    );

-- Clients policies
CREATE POLICY "View organization clients" ON clients
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM team_members WHERE user_id = auth.uid()
        )
        OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_super_admin = true)
    );

CREATE POLICY "Create organization clients" ON clients
    FOR INSERT WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM team_members WHERE user_id = auth.uid()
        )
        OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_super_admin = true)
    );

CREATE POLICY "Update organization clients" ON clients
    FOR UPDATE USING (
        organization_id IN (
            SELECT organization_id FROM team_members WHERE user_id = auth.uid()
        )
        OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_super_admin = true)
    );

-- Activity logs policies
CREATE POLICY "View organization activity" ON activity_logs
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM team_members WHERE user_id = auth.uid()
        )
        OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_super_admin = true)
    );

CREATE POLICY "Create activity logs" ON activity_logs
    FOR INSERT WITH CHECK (
        user_id = auth.uid()
    );

-- =====================================================
-- 5. HELPER FUNCTIONS
-- =====================================================

-- Function to get user's current organization
CREATE OR REPLACE FUNCTION get_user_organization()
RETURNS UUID AS $$
DECLARE
    org_id UUID;
BEGIN
    SELECT organization_id INTO org_id
    FROM team_members
    WHERE user_id = auth.uid()
    AND is_active = true
    LIMIT 1;
    
    RETURN org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_org_admin(org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM team_members 
        WHERE user_id = auth.uid() 
        AND organization_id = org_id
        AND role IN ('super_admin', 'admin')
        AND is_active = true
    ) OR EXISTS (
        SELECT 1 
        FROM profiles 
        WHERE id = auth.uid() 
        AND is_super_admin = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log activity
CREATE OR REPLACE FUNCTION log_activity(
    p_action TEXT,
    p_entity_type TEXT DEFAULT NULL,
    p_entity_id TEXT DEFAULT NULL,
    p_entity_name TEXT DEFAULT NULL,
    p_changes JSONB DEFAULT NULL,
    p_metadata JSONB DEFAULT NULL
)
RETURNS void AS $$
DECLARE
    v_org_id UUID;
    v_user_email TEXT;
BEGIN
    -- Get user's organization
    SELECT organization_id INTO v_org_id
    FROM team_members
    WHERE user_id = auth.uid()
    LIMIT 1;
    
    -- Get user's email
    SELECT email INTO v_user_email
    FROM profiles
    WHERE id = auth.uid();
    
    -- Insert activity log
    INSERT INTO activity_logs (
        organization_id,
        user_id,
        user_email,
        action,
        entity_type,
        entity_id,
        entity_name,
        changes,
        metadata
    ) VALUES (
        v_org_id,
        auth.uid(),
        v_user_email,
        p_action,
        p_entity_type,
        p_entity_id,
        p_entity_name,
        p_changes,
        p_metadata
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 6. TRIGGERS
-- =====================================================

-- Update timestamps
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_team_members_updated_at BEFORE UPDATE ON team_members
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMIT;

-- =====================================================
-- 7. SUPER ADMIN SETUP (Run separately after user creation)
-- =====================================================
-- This should be run after creating the super admin user through Supabase Auth

/*
-- To set up super admin (run after user is created):

UPDATE profiles 
SET 
    is_super_admin = true,
    organization_id = '00000000-0000-0000-0000-000000000001',
    role = 'admin'
WHERE email = 'mahesh@simsinfotech.com';

INSERT INTO team_members (
    organization_id,
    user_id,
    role,
    permissions,
    is_active
) 
SELECT 
    '00000000-0000-0000-0000-000000000001',
    id,
    'super_admin',
    '{
        "properties": {"create": true, "read": true, "update": true, "delete": true},
        "leads": {"create": true, "read": true, "update": true, "delete": true},
        "clients": {"create": true, "read": true, "update": true, "delete": true},
        "invoices": {"create": true, "read": true, "update": true, "delete": true},
        "reports": {"view": true, "export": true},
        "team": {"invite": true, "remove": true, "edit": true}
    }',
    true
FROM profiles
WHERE email = 'mahesh@simsinfotech.com'
ON CONFLICT (organization_id, user_id) DO UPDATE
SET role = 'super_admin', is_active = true;

UPDATE organizations 
SET owner_id = (SELECT id FROM profiles WHERE email = 'mahesh@simsinfotech.com')
WHERE id = '00000000-0000-0000-0000-000000000001';
*/