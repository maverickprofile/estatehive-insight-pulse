-- =====================================================
-- CREATE PROTECTED SUPER ADMIN ACCOUNT
-- =====================================================
-- Creates Mahesh Kumar as permanent super admin
-- This account cannot be deleted or modified
-- =====================================================

BEGIN;

-- =====================================================
-- 0. CREATE DEFAULT ORGANIZATION IF NOT EXISTS
-- =====================================================

-- Ensure default organization exists
INSERT INTO organizations (
    id,
    name,
    email,
    phone,
    address,
    city,
    state,
    country,
    postal_code,
    settings,
    website,
    subscription_plan,
    is_active,
    created_at,
    updated_at
) VALUES (
    '00000000-0000-0000-0000-000000000001',
    'SIMS InfoTech',
    'mahesh@simsinfotech.com',
    '+91 9999999999',
    'Mumbai',
    'Mumbai',
    'Maharashtra',
    'India',
    '400001',
    jsonb_build_object(
        'timezone', 'Asia/Kolkata',
        'default_currency', 'INR',
        'allow_property_sharing', false,
        'require_approval', true
    ),
    'www.simsinfotech.com',
    'premium',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (id) DO UPDATE
SET 
    name = 'SIMS InfoTech',
    email = 'mahesh@simsinfotech.com',
    updated_at = NOW();

-- =====================================================
-- 1. CREATE SUPER ADMIN USER IN AUTH.USERS (if not exists)
-- =====================================================
-- NOTE: First create the user in Supabase Auth Dashboard with:
-- Email: mahesh@simsinfotech.com
-- Password: 123456

-- =====================================================
-- 2. INSERT SUPER ADMIN PROFILE
-- =====================================================

-- First, ensure the super admin user exists in profiles
INSERT INTO profiles (
    id,
    email,
    full_name,
    role,
    organization_id,
    is_super_admin,
    is_active,
    phone,
    department,
    metadata,
    created_at,
    updated_at
) 
SELECT 
    id,
    'mahesh@simsinfotech.com',
    'Mahesh Kumar',
    'admin',
    '00000000-0000-0000-0000-000000000001',
    true,
    true,
    '+91 9999999999',
    'Management',
    jsonb_build_object(
        'title', 'CEO & Founder',
        'company', 'SIMS InfoTech',
        'permissions', 'all',
        'access_level', 'super_admin',
        'protected', true,
        'created_by', 'system'
    ),
    NOW(),
    NOW()
FROM auth.users 
WHERE email = 'mahesh@simsinfotech.com'
ON CONFLICT (id) DO UPDATE 
SET 
    full_name = 'Mahesh Kumar',
    is_super_admin = true,
    organization_id = '00000000-0000-0000-0000-000000000001',
    role = 'admin',
    is_active = true,
    metadata = jsonb_build_object(
        'title', 'CEO & Founder',
        'company', 'SIMS InfoTech',
        'permissions', 'all',
        'access_level', 'super_admin',
        'protected', true,
        'created_by', 'system'
    ),
    updated_at = NOW();

-- If the auth.users doesn't exist yet, create a placeholder that will be updated later
INSERT INTO profiles (
    id,
    email,
    full_name,
    role,
    organization_id,
    is_super_admin,
    is_active,
    phone,
    department,
    metadata
)
VALUES (
    '00000000-0000-0000-0000-000000000000', -- Temporary ID, will be updated when auth user is created
    'mahesh@simsinfotech.com',
    'Mahesh Kumar',
    'admin',
    '00000000-0000-0000-0000-000000000001',
    true,
    true,
    '+91 9999999999',
    'Management',
    jsonb_build_object(
        'title', 'CEO & Founder',
        'company', 'SIMS InfoTech',
        'permissions', 'all',
        'access_level', 'super_admin',
        'protected', true,
        'created_by', 'system'
    )
)
ON CONFLICT (email) DO UPDATE 
SET 
    full_name = 'Mahesh Kumar',
    is_super_admin = true,
    organization_id = '00000000-0000-0000-0000-000000000001',
    role = 'admin',
    is_active = true,
    metadata = jsonb_build_object(
        'title', 'CEO & Founder',
        'company', 'SIMS InfoTech',
        'permissions', 'all',
        'access_level', 'super_admin',
        'protected', true,
        'created_by', 'system'
    ),
    updated_at = NOW();

-- =====================================================
-- 3. ADD SUPER ADMIN TO TEAM_MEMBERS
-- =====================================================

-- Insert into team_members (handle both cases - with and without auth.users)
INSERT INTO team_members (
    organization_id,
    user_id,
    role,
    permissions,
    department,
    designation,
    is_active
) 
SELECT 
    '00000000-0000-0000-0000-000000000001',
    COALESCE(
        (SELECT id FROM auth.users WHERE email = 'mahesh@simsinfotech.com'),
        '00000000-0000-0000-0000-000000000000'
    ),
    'super_admin',
    jsonb_build_object(
        'properties', jsonb_build_object('create', true, 'read', true, 'update', true, 'delete', true),
        'leads', jsonb_build_object('create', true, 'read', true, 'update', true, 'delete', true),
        'clients', jsonb_build_object('create', true, 'read', true, 'update', true, 'delete', true),
        'agents', jsonb_build_object('create', true, 'read', true, 'update', true, 'delete', true),
        'invoices', jsonb_build_object('create', true, 'read', true, 'update', true, 'delete', true),
        'reports', jsonb_build_object('view', true, 'export', true),
        'team', jsonb_build_object('invite', true, 'remove', true, 'edit', true),
        'settings', jsonb_build_object('view', true, 'edit', true),
        'analytics', jsonb_build_object('view', true, 'export', true),
        'protected', true
    ),
    'Management',
    'CEO & Founder',
    true
ON CONFLICT (organization_id, user_id) DO UPDATE
SET 
    role = 'super_admin',
    permissions = EXCLUDED.permissions,
    is_active = true,
    updated_at = NOW();

-- =====================================================
-- 4. CREATE PROTECTION TRIGGERS
-- =====================================================

-- Create a function to prevent modification/deletion of super admin
CREATE OR REPLACE FUNCTION protect_super_admin()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if trying to modify/delete Mahesh Kumar's account
    IF OLD.email = 'mahesh@simsinfotech.com' OR OLD.full_name = 'Mahesh Kumar' THEN
        IF TG_OP = 'DELETE' THEN
            RAISE EXCEPTION 'Cannot delete super admin account (Mahesh Kumar)';
        END IF;
        
        IF TG_OP = 'UPDATE' THEN
            -- Allow only specific safe updates
            IF NEW.is_super_admin = false OR 
               NEW.is_active = false OR 
               NEW.email != 'mahesh@simsinfotech.com' OR
               NEW.full_name != 'Mahesh Kumar' THEN
                RAISE EXCEPTION 'Cannot modify protected super admin fields for Mahesh Kumar';
            END IF;
        END IF;
    END IF;
    
    -- For updates, preserve protected fields
    IF TG_OP = 'UPDATE' AND OLD.is_super_admin = true AND OLD.email = 'mahesh@simsinfotech.com' THEN
        NEW.is_super_admin := true;
        NEW.email := 'mahesh@simsinfotech.com';
        NEW.full_name := 'Mahesh Kumar';
        NEW.is_active := true;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for profiles table
DROP TRIGGER IF EXISTS protect_super_admin_trigger ON profiles;
CREATE TRIGGER protect_super_admin_trigger
    BEFORE UPDATE OR DELETE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION protect_super_admin();

-- Create similar protection for team_members
CREATE OR REPLACE FUNCTION protect_super_admin_team_member()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if this is the super admin's team member record
    IF OLD.role = 'super_admin' AND 
       OLD.organization_id = '00000000-0000-0000-0000-000000000001' THEN
        IF TG_OP = 'DELETE' THEN
            RAISE EXCEPTION 'Cannot delete super admin team membership';
        END IF;
        
        IF TG_OP = 'UPDATE' THEN
            -- Preserve critical fields
            NEW.role := 'super_admin';
            NEW.is_active := true;
            NEW.organization_id := '00000000-0000-0000-0000-000000000001';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for team_members table
DROP TRIGGER IF EXISTS protect_super_admin_team_trigger ON team_members;
CREATE TRIGGER protect_super_admin_team_trigger
    BEFORE UPDATE OR DELETE ON team_members
    FOR EACH ROW
    EXECUTE FUNCTION protect_super_admin_team_member();

-- =====================================================
-- 5. UPDATE ORGANIZATION OWNER
-- =====================================================

UPDATE organizations 
SET 
    owner_id = COALESCE(
        (SELECT id FROM auth.users WHERE email = 'mahesh@simsinfotech.com'),
        '00000000-0000-0000-0000-000000000000'
    ),
    updated_at = NOW()
WHERE id = '00000000-0000-0000-0000-000000000001';

-- =====================================================
-- 6. CREATE HELPER FUNCTION TO FIX SUPER ADMIN ID
-- =====================================================

-- This function should be called after creating the auth.users account
CREATE OR REPLACE FUNCTION fix_super_admin_id()
RETURNS void AS $$
DECLARE
    auth_user_id UUID;
BEGIN
    -- Get the actual auth.users ID
    SELECT id INTO auth_user_id 
    FROM auth.users 
    WHERE email = 'mahesh@simsinfotech.com';
    
    IF auth_user_id IS NOT NULL THEN
        -- Update profiles with correct ID
        UPDATE profiles 
        SET id = auth_user_id 
        WHERE email = 'mahesh@simsinfotech.com' 
        AND id = '00000000-0000-0000-0000-000000000000';
        
        -- Update team_members with correct ID
        UPDATE team_members 
        SET user_id = auth_user_id 
        WHERE user_id = '00000000-0000-0000-0000-000000000000'
        AND organization_id = '00000000-0000-0000-0000-000000000001';
        
        -- Update organization owner
        UPDATE organizations 
        SET owner_id = auth_user_id 
        WHERE id = '00000000-0000-0000-0000-000000000001'
        AND owner_id = '00000000-0000-0000-0000-000000000000';
        
        RAISE NOTICE 'Super admin ID has been fixed successfully';
    ELSE
        RAISE NOTICE 'Auth user not found. Please create the user first.';
    END IF;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 7. LOG THE SUPER ADMIN CREATION
-- =====================================================

INSERT INTO activity_logs (
    organization_id,
    user_id,
    user_email,
    action,
    entity_type,
    metadata
)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    COALESCE(
        (SELECT id FROM auth.users WHERE email = 'mahesh@simsinfotech.com'),
        '00000000-0000-0000-0000-000000000000'
    ),
    'mahesh@simsinfotech.com',
    'SUPER_ADMIN_CREATED',
    'system',
    jsonb_build_object(
        'message', 'Protected super admin account created for Mahesh Kumar',
        'timestamp', NOW()::text,
        'protected', true
    )
);

COMMIT;

-- =====================================================
-- IMPORTANT INSTRUCTIONS:
-- =====================================================
-- 1. First run this migration to create the protected super admin profile
-- 
-- 2. Then create the auth.users account in Supabase Dashboard:
--    Email: mahesh@simsinfotech.com
--    Password: 123456
-- 
-- 3. After creating the auth.users account, run this command:
--    SELECT fix_super_admin_id();
--
-- This will update all references to use the correct auth.users ID
--
-- The super admin account for Mahesh Kumar is now protected and cannot be:
-- - Deleted
-- - Have is_super_admin set to false  
-- - Have email changed from mahesh@simsinfotech.com
-- - Have name changed from Mahesh Kumar
-- - Be deactivated
-- =====================================================