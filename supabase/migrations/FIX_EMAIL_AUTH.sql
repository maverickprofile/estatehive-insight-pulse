-- =====================================================
-- FIX EMAIL AUTHENTICATION SETTINGS
-- =====================================================

-- 1. Ensure profiles table exists and is properly set up
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    phone TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'user',
    department TEXT,
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    phone_verified BOOLEAN DEFAULT false,
    last_login TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Disable RLS temporarily for testing
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- 3. Create a simpler trigger that won't fail
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email)
    VALUES (NEW.id, NEW.email)
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- 5. Grant all permissions
GRANT ALL ON profiles TO anon;
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON profiles TO service_role;

-- =====================================================
-- IMPORTANT: GO TO SUPABASE DASHBOARD AND DO THIS:
-- =====================================================
-- 1. Go to Authentication > Providers > Email
-- 2. DISABLE "Confirm email" 
-- 3. ENABLE "Allow sign ups"
-- 4. Save changes
--
-- Then in Authentication > Settings:
-- 1. Add http://localhost:8081 to Site URL
-- 2. Add http://localhost:8081/* to Redirect URLs
-- 3. DISABLE "Enable email confirmations"
-- =====================================================

RAISE NOTICE '';
RAISE NOTICE '=========================================';
RAISE NOTICE '⚠️  IMPORTANT MANUAL STEPS REQUIRED:';
RAISE NOTICE '=========================================';
RAISE NOTICE '1. Go to Supabase Dashboard';
RAISE NOTICE '2. Authentication → Providers → Email';
RAISE NOTICE '3. DISABLE "Confirm email"';
RAISE NOTICE '4. ENABLE "Allow sign ups"';
RAISE NOTICE '5. Save changes';
RAISE NOTICE '';
RAISE NOTICE 'Then in Authentication → Settings:';
RAISE NOTICE '1. DISABLE "Enable email confirmations"';
RAISE NOTICE '2. Save changes';
RAISE NOTICE '=========================================';