-- =====================================================
-- CLEANUP AND FIX EXISTING DATABASE
-- =====================================================
-- This script safely handles existing objects and adds missing ones
-- =====================================================

-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "Users can manage own properties" ON properties;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Anyone can view active properties" ON properties;
DROP POLICY IF EXISTS "Agents can manage own properties" ON properties;
DROP POLICY IF EXISTS "Admins can manage all properties" ON properties;

-- Add missing columns to properties table (IF NOT EXISTS)
DO $$ 
BEGIN
    -- Add columns only if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='properties' AND column_name='property_subtype') THEN
        ALTER TABLE properties ADD COLUMN property_subtype TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='properties' AND column_name='category') THEN
        ALTER TABLE properties ADD COLUMN category TEXT CHECK (category IN ('sale', 'rent', 'lease'));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='properties' AND column_name='unit_number') THEN
        ALTER TABLE properties ADD COLUMN unit_number TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='properties' AND column_name='postal_code') THEN
        ALTER TABLE properties ADD COLUMN postal_code TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='properties' AND column_name='neighborhood') THEN
        ALTER TABLE properties ADD COLUMN neighborhood TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='properties' AND column_name='original_price') THEN
        ALTER TABLE properties ADD COLUMN original_price DECIMAL(15,2);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='properties' AND column_name='price_negotiable') THEN
        ALTER TABLE properties ADD COLUMN price_negotiable BOOLEAN DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='properties' AND column_name='currency') THEN
        ALTER TABLE properties ADD COLUMN currency TEXT DEFAULT 'INR';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='properties' AND column_name='rent_amount') THEN
        ALTER TABLE properties ADD COLUMN rent_amount DECIMAL(15,2);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='properties' AND column_name='rent_frequency') THEN
        ALTER TABLE properties ADD COLUMN rent_frequency TEXT DEFAULT 'monthly';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='properties' AND column_name='security_deposit') THEN
        ALTER TABLE properties ADD COLUMN security_deposit DECIMAL(15,2);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='properties' AND column_name='maintenance_fee') THEN
        ALTER TABLE properties ADD COLUMN maintenance_fee DECIMAL(15,2);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='properties' AND column_name='total_rooms') THEN
        ALTER TABLE properties ADD COLUMN total_rooms INTEGER;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='properties' AND column_name='covered_parking') THEN
        ALTER TABLE properties ADD COLUMN covered_parking INTEGER;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='properties' AND column_name='image_urls') THEN
        ALTER TABLE properties ADD COLUMN image_urls TEXT[];
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='properties' AND column_name='created_by') THEN
        ALTER TABLE properties ADD COLUMN created_by UUID REFERENCES profiles(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Add missing columns to agents table (IF NOT EXISTS)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='agents' AND column_name='is_verified') THEN
        ALTER TABLE agents ADD COLUMN is_verified BOOLEAN DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='agents' AND column_name='specialties') THEN
        ALTER TABLE agents ADD COLUMN specialties TEXT[];
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='agents' AND column_name='service_areas') THEN
        ALTER TABLE agents ADD COLUMN service_areas TEXT[];
    END IF;
END $$;

-- Create or replace the increment property view function
CREATE OR REPLACE FUNCTION increment_property_view(p_property_id INTEGER)
RETURNS VOID AS $$
BEGIN
    UPDATE properties 
    SET views_count = COALESCE(views_count, 0) + 1
    WHERE id = p_property_id;
END;
$$ LANGUAGE plpgsql;

-- Recreate RLS policies with proper permissions
-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON profiles
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Properties policies
CREATE POLICY "Anyone can view active properties" ON properties
    FOR SELECT USING (status = 'active' OR status IS NULL);

CREATE POLICY "Users can manage own properties" ON properties
    FOR ALL USING (
        created_by = auth.uid() OR
        agent_id IN (SELECT id FROM agents WHERE user_id = auth.uid())
    );

CREATE POLICY "Admins can manage all properties" ON properties
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Fix property_type constraint if needed
DO $$
BEGIN
    -- Drop existing constraint if it exists
    ALTER TABLE properties DROP CONSTRAINT IF EXISTS properties_property_type_check;
    
    -- Add new constraint with all property types
    ALTER TABLE properties ADD CONSTRAINT properties_property_type_check 
        CHECK (property_type IN ('residential', 'commercial', 'land', 'industrial', 'agricultural', 'mixed_use', 'other') OR property_type IS NULL);
END $$;

-- Create indexes only if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_properties_category') THEN
        CREATE INDEX idx_properties_category ON properties(category);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_properties_created_by') THEN
        CREATE INDEX idx_properties_created_by ON properties(created_by);
    END IF;
END $$;

-- Ensure the handle_new_user function exists
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        COALESCE(NEW.raw_user_meta_data->>'role', 'user')
    )
    ON CONFLICT (id) DO UPDATE
    SET 
        email = EXCLUDED.email,
        full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
        updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Grant permissions to anon users (for public data)
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON properties TO anon;

-- Create a test user if needed (optional - uncomment to use)
-- INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
-- VALUES (
--     gen_random_uuid(),
--     'test@example.com',
--     crypt('Test@123456', gen_salt('bf')),
--     NOW(),
--     NOW(),
--     NOW()
-- ) ON CONFLICT (email) DO NOTHING;

-- =====================================================
-- VERIFICATION
-- =====================================================
DO $$
DECLARE
    table_count INTEGER;
    column_count INTEGER;
BEGIN
    -- Count tables
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE';
    
    -- Count columns in properties table
    SELECT COUNT(*) INTO column_count
    FROM information_schema.columns 
    WHERE table_name = 'properties';
    
    RAISE NOTICE '✅ Database setup complete!';
    RAISE NOTICE '📊 Total tables: %', table_count;
    RAISE NOTICE '🏠 Properties table columns: %', column_count;
    RAISE NOTICE '🔐 RLS policies applied';
    RAISE NOTICE '✨ Ready for authentication!';
END $$;