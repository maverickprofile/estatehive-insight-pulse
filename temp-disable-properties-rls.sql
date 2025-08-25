-- =====================================================
-- TEMPORARY: DISABLE RLS ON PROPERTIES TABLE
-- =====================================================
-- This will temporarily disable RLS to test if that's the issue
-- =====================================================

-- Disable RLS on properties table
ALTER TABLE properties DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- TO RE-ENABLE RLS LATER:
-- =====================================================
-- ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
-- Then run the fix-properties-rls.sql script
-- =====================================================