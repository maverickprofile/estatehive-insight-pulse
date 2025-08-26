-- =====================================================
-- IMMEDIATE SUPER ADMIN INITIALIZATION
-- =====================================================
-- Run this AFTER creating the auth.users account
-- Email: mahesh@simsinfotech.com
-- Password: 123456
-- =====================================================

BEGIN;

-- =====================================================
-- 1. ENSURE ORGANIZATION EXISTS
-- =====================================================

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
    is_active
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
    true
)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 2. CREATE/UPDATE SUPER ADMIN PROFILE
-- =====================================================

-- First try to insert/update with actual auth user ID
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
        'protected', true
    )
FROM auth.users 
WHERE email = 'mahesh@simsinfotech.com'
ON CONFLICT (id) DO UPDATE 
SET 
    email = 'mahesh@simsinfotech.com',
    full_name = 'Mahesh Kumar',
    is_super_admin = true,
    organization_id = '00000000-0000-0000-0000-000000000001',
    role = 'admin',
    is_active = true,
    phone = '+91 9999999999',
    department = 'Management',
    metadata = jsonb_build_object(
        'title', 'CEO & Founder',
        'company', 'SIMS InfoTech',
        'permissions', 'all',
        'access_level', 'super_admin',
        'protected', true
    ),
    updated_at = NOW();

-- Also try by email if not found by ID
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
SELECT 
    COALESCE(
        (SELECT id FROM auth.users WHERE email = 'mahesh@simsinfotech.com'),
        gen_random_uuid()
    ),
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
        'protected', true
    )
WHERE NOT EXISTS (
    SELECT 1 FROM profiles WHERE email = 'mahesh@simsinfotech.com'
)
ON CONFLICT (email) DO UPDATE 
SET 
    full_name = 'Mahesh Kumar',
    is_super_admin = true,
    organization_id = '00000000-0000-0000-0000-000000000001',
    role = 'admin',
    is_active = true,
    phone = '+91 9999999999',
    department = 'Management',
    metadata = jsonb_build_object(
        'title', 'CEO & Founder',
        'company', 'SIMS InfoTech',
        'permissions', 'all',
        'access_level', 'super_admin',
        'protected', true
    ),
    updated_at = NOW();

-- =====================================================
-- 3. ADD TO TEAM_MEMBERS
-- =====================================================

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
        'all', true,
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
FROM profiles
WHERE email = 'mahesh@simsinfotech.com'
ON CONFLICT (organization_id, user_id) DO UPDATE
SET 
    role = 'super_admin',
    permissions = EXCLUDED.permissions,
    is_active = true,
    updated_at = NOW();

-- =====================================================
-- 4. SET ORGANIZATION OWNER
-- =====================================================

UPDATE organizations 
SET 
    owner_id = (SELECT id FROM profiles WHERE email = 'mahesh@simsinfotech.com'),
    updated_at = NOW()
WHERE id = '00000000-0000-0000-0000-000000000001';

-- =====================================================
-- 5. LOG THE SETUP
-- =====================================================

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
        'message', 'Super admin account initialized for Mahesh Kumar',
        'timestamp', NOW()::text,
        'protected', true
    )
FROM profiles
WHERE email = 'mahesh@simsinfotech.com';

COMMIT;

-- =====================================================
-- VERIFY THE SETUP
-- =====================================================

DO $$
DECLARE
    profile_exists BOOLEAN;
    team_member_exists BOOLEAN;
    org_exists BOOLEAN;
BEGIN
    -- Check if profile exists
    SELECT EXISTS(
        SELECT 1 FROM profiles 
        WHERE email = 'mahesh@simsinfotech.com' 
        AND is_super_admin = true
    ) INTO profile_exists;
    
    -- Check if team member exists
    SELECT EXISTS(
        SELECT 1 FROM team_members 
        WHERE organization_id = '00000000-0000-0000-0000-000000000001'
        AND role = 'super_admin'
    ) INTO team_member_exists;
    
    -- Check if organization exists
    SELECT EXISTS(
        SELECT 1 FROM organizations 
        WHERE id = '00000000-0000-0000-0000-000000000001'
    ) INTO org_exists;
    
    IF profile_exists AND team_member_exists AND org_exists THEN
        RAISE NOTICE 'SUCCESS: Super admin Mahesh Kumar has been initialized successfully!';
        RAISE NOTICE 'Profile: ✓ | Team Member: ✓ | Organization: ✓';
    ELSE
        RAISE NOTICE 'PARTIAL SUCCESS: Some components may need attention';
        RAISE NOTICE 'Profile: % | Team Member: % | Organization: %', 
            CASE WHEN profile_exists THEN '✓' ELSE '✗' END,
            CASE WHEN team_member_exists THEN '✓' ELSE '✗' END,
            CASE WHEN org_exists THEN '✓' ELSE '✗' END;
    END IF;
END $$;