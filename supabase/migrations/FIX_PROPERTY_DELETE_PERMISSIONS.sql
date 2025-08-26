-- =====================================================
-- FIX PROPERTY DELETE PERMISSIONS
-- =====================================================
-- This migration ensures proper delete permissions for properties
-- =====================================================

BEGIN;

-- First, drop existing RLS policies for properties if they exist
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON properties;
DROP POLICY IF EXISTS "Enable delete for admins" ON properties;
DROP POLICY IF EXISTS "Enable delete for property owners" ON properties;

-- Enable Row Level Security on properties table if not already enabled
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows authenticated users to delete their own properties
CREATE POLICY "Enable delete for property owners" ON properties
    FOR DELETE
    USING (
        auth.uid() IS NOT NULL AND (
            created_by = auth.uid() OR
            agent_id = (SELECT id FROM agents WHERE user_id = auth.uid() LIMIT 1)
        )
    );

-- Create a policy that allows admins to delete any property
CREATE POLICY "Enable delete for admins" ON properties
    FOR DELETE
    USING (
        auth.uid() IS NOT NULL AND
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Also ensure SELECT, INSERT, and UPDATE policies exist
DROP POLICY IF EXISTS "Enable read access for all" ON properties;
CREATE POLICY "Enable read access for all" ON properties
    FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON properties;
CREATE POLICY "Enable insert for authenticated users" ON properties
    FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Enable update for property owners and admins" ON properties;
CREATE POLICY "Enable update for property owners and admins" ON properties
    FOR UPDATE
    USING (
        auth.uid() IS NOT NULL AND (
            created_by = auth.uid() OR
            agent_id = (SELECT id FROM agents WHERE user_id = auth.uid() LIMIT 1) OR
            EXISTS (
                SELECT 1 FROM profiles 
                WHERE profiles.id = auth.uid() 
                AND profiles.role = 'admin'
            )
        )
    )
    WITH CHECK (
        auth.uid() IS NOT NULL AND (
            created_by = auth.uid() OR
            agent_id = (SELECT id FROM agents WHERE user_id = auth.uid() LIMIT 1) OR
            EXISTS (
                SELECT 1 FROM profiles 
                WHERE profiles.id = auth.uid() 
                AND profiles.role = 'admin'
            )
        )
    );

COMMIT;

-- Verification
DO $$
BEGIN
    RAISE NOTICE 'Property deletion permissions have been updated';
    RAISE NOTICE 'Admins can now delete any property';
    RAISE NOTICE 'Users can delete their own properties';
    RAISE NOTICE 'RLS policies have been properly configured';
END $$;