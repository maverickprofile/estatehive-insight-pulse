-- =====================================================
-- ESTATE HIVE CRM - FIX PROPERTIES RLS POLICIES
-- =====================================================
-- Fix Row Level Security policies for properties table
-- =====================================================

-- First, check if RLS is enabled on the properties table
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view active properties" ON properties;
DROP POLICY IF EXISTS "Authenticated users can create properties" ON properties;
DROP POLICY IF EXISTS "Users can update their own properties" ON properties;
DROP POLICY IF EXISTS "Users can delete their own properties" ON properties;
DROP POLICY IF EXISTS "Authenticated users can update any property" ON properties;

-- Create new RLS policies

-- Policy 1: Anyone can view all properties (public listing)
CREATE POLICY "Anyone can view properties" ON properties
    FOR SELECT
    USING (true);

-- Policy 2: Authenticated users can create properties
CREATE POLICY "Authenticated users can create properties" ON properties
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- Policy 3: Authenticated users can update any property
-- This allows agents and admins to update properties
CREATE POLICY "Authenticated users can update properties" ON properties
    FOR UPDATE
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- Policy 4: Authenticated users can delete properties they created
CREATE POLICY "Users can delete their own properties" ON properties
    FOR DELETE
    USING (auth.uid() = created_by OR auth.uid() = owner_id);

-- Policy 5: Service role bypass (for backend operations)
CREATE POLICY "Service role bypass" ON properties
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

-- Grant necessary permissions
GRANT ALL ON properties TO authenticated;
GRANT SELECT ON properties TO anon;

-- =====================================================
-- ALTERNATIVE: If you want to temporarily disable RLS
-- =====================================================
-- Uncomment the line below to disable RLS (NOT recommended for production)
-- ALTER TABLE properties DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- INSTRUCTIONS TO RUN THIS SCRIPT:
-- =====================================================
-- 1. Go to your Supabase Dashboard
-- 2. Navigate to SQL Editor
-- 3. Create a new query
-- 4. Copy and paste this entire script
-- 5. Click "Run" to execute
-- 
-- This will fix the RLS policies for the properties table
-- =====================================================