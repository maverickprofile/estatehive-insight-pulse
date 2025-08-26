-- =====================================================
-- SUPER ADMIN SETUP
-- =====================================================
-- Creates super admin account for mahesh@simsinfotech.com
-- Password: 123456 (will be changed on first login)
-- =====================================================

BEGIN;

-- Note: The actual user creation in auth.users table must be done through 
-- Supabase Dashboard or using Supabase Admin API
-- This migration handles the profile and permissions setup

-- Create or update super admin profile
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
    -- This ID will be replaced with actual auth.users ID after user creation
    (SELECT id FROM auth.users WHERE email = 'mahesh@simsinfotech.com'),
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
        'permissions', 'all',
        'access_level', 'super_admin'
    )
)
ON CONFLICT (id) DO UPDATE 
SET 
    is_super_admin = true,
    organization_id = '00000000-0000-0000-0000-000000000001',
    role = 'admin',
    is_active = true,
    updated_at = NOW();

-- Add super admin to team_members
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
    id,
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
        'analytics', jsonb_build_object('view', true, 'export', true)
    ),
    'Management',
    'CEO & Founder',
    true
FROM auth.users
WHERE email = 'mahesh@simsinfotech.com'
ON CONFLICT (organization_id, user_id) DO UPDATE
SET 
    role = 'super_admin',
    permissions = EXCLUDED.permissions,
    is_active = true,
    updated_at = NOW();

-- Set organization owner
UPDATE organizations 
SET 
    owner_id = (SELECT id FROM auth.users WHERE email = 'mahesh@simsinfotech.com'),
    updated_at = NOW()
WHERE id = '00000000-0000-0000-0000-000000000001';

-- Log the super admin setup
INSERT INTO activity_logs (
    organization_id,
    user_id,
    user_email,
    action,
    entity_type,
    metadata
)
SELECT
    '00000000-0000-0000-0000-000000000001',
    id,
    'mahesh@simsinfotech.com',
    'SUPER_ADMIN_INITIALIZED',
    'system',
    jsonb_build_object(
        'message', 'Super admin account initialized',
        'timestamp', NOW()::text
    )
FROM auth.users
WHERE email = 'mahesh@simsinfotech.com';

COMMIT;

-- =====================================================
-- IMPORTANT NOTES:
-- =====================================================
-- 1. Before running this migration, create the user in Supabase Dashboard:
--    - Email: mahesh@simsinfotech.com
--    - Password: 123456
-- 
-- 2. Or use Supabase Admin API to create the user programmatically
--
-- 3. After user creation, run this migration to set up permissions
--
-- 4. The super admin will have access to:
--    - All organizations
--    - All properties, leads, clients
--    - Team management
--    - System settings
--    - Complete audit logs
-- =====================================================