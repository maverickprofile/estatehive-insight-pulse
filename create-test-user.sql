-- =====================================================
-- CREATE TEST USER DIRECTLY (BYPASS EMAIL VALIDATION)
-- =====================================================
-- Run this in Supabase SQL Editor to create a test user
-- =====================================================

DO $$
DECLARE
    user_id UUID;
BEGIN
    -- Generate a new UUID for the user
    user_id := gen_random_uuid();
    
    -- Insert into auth.users (Supabase auth table)
    INSERT INTO auth.users (
        id,
        instance_id,
        email,
        encrypted_password,
        email_confirmed_at,
        created_at,
        updated_at,
        aud,
        role
    ) VALUES (
        user_id,
        '00000000-0000-0000-0000-000000000000',
        'admin@estatehive.com',
        crypt('Admin@123456', gen_salt('bf')),
        NOW(), -- Auto-confirm email
        NOW(),
        NOW(),
        'authenticated',
        'authenticated'
    ) ON CONFLICT (email) DO NOTHING;
    
    -- Insert into profiles
    INSERT INTO profiles (id, email, full_name, role)
    VALUES (
        user_id,
        'admin@estatehive.com',
        'Admin User',
        'admin'
    ) ON CONFLICT (id) DO UPDATE
    SET role = 'admin';
    
    RAISE NOTICE '';
    RAISE NOTICE '✅ TEST USER CREATED SUCCESSFULLY!';
    RAISE NOTICE '📧 Email: admin@estatehive.com';
    RAISE NOTICE '🔑 Password: Admin@123456';
    RAISE NOTICE '';
    RAISE NOTICE 'You can now login with these credentials!';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Error creating user: %', SQLERRM;
        RAISE NOTICE 'User might already exist. Try logging in!';
END $$;

-- Verify the user was created
SELECT 
    u.email,
    u.email_confirmed_at,
    p.role,
    p.full_name
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE u.email = 'admin@estatehive.com';