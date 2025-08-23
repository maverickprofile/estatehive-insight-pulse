-- =====================================================
-- ADD MISSING FIELDS TO MATCH APPLICATION REQUIREMENTS
-- =====================================================

-- Add missing columns to properties table
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS property_subtype TEXT,
ADD COLUMN IF NOT EXISTS category TEXT CHECK (category IN ('sale', 'rent', 'lease')),
ADD COLUMN IF NOT EXISTS unit_number TEXT,
ADD COLUMN IF NOT EXISTS postal_code TEXT,
ADD COLUMN IF NOT EXISTS neighborhood TEXT,
ADD COLUMN IF NOT EXISTS original_price DECIMAL(15,2),
ADD COLUMN IF NOT EXISTS price_negotiable BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'INR',
ADD COLUMN IF NOT EXISTS rent_amount DECIMAL(15,2),
ADD COLUMN IF NOT EXISTS rent_frequency TEXT DEFAULT 'monthly',
ADD COLUMN IF NOT EXISTS security_deposit DECIMAL(15,2),
ADD COLUMN IF NOT EXISTS maintenance_fee DECIMAL(15,2),
ADD COLUMN IF NOT EXISTS total_rooms INTEGER,
ADD COLUMN IF NOT EXISTS covered_parking INTEGER,
ADD COLUMN IF NOT EXISTS image_urls TEXT[],
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- Add missing columns to agents table
ALTER TABLE agents 
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS specialties TEXT[],
ADD COLUMN IF NOT EXISTS service_areas TEXT[];

-- Create function to increment property views (if not exists)
CREATE OR REPLACE FUNCTION increment_property_view(p_property_id INTEGER)
RETURNS VOID AS $$
BEGIN
    UPDATE properties 
    SET views_count = COALESCE(views_count, 0) + 1
    WHERE id = p_property_id;
END;
$$ LANGUAGE plpgsql;

-- Update RLS policies for new created_by field
CREATE POLICY "Users can manage own properties" ON properties
    FOR ALL USING (
        created_by = auth.uid() OR
        agent_id IN (SELECT id FROM agents WHERE user_id = auth.uid())
    );

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_properties_category ON properties(category);
CREATE INDEX IF NOT EXISTS idx_properties_created_by ON properties(created_by);

-- =====================================================
-- FIX PROPERTY TYPE VALUES
-- =====================================================

-- Update property_type check constraint to include all types
ALTER TABLE properties DROP CONSTRAINT IF EXISTS properties_property_type_check;
ALTER TABLE properties ADD CONSTRAINT properties_property_type_check 
    CHECK (property_type IN ('residential', 'commercial', 'land', 'industrial', 'agricultural', 'mixed_use', 'other'));

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE 'Missing fields added successfully!';
    RAISE NOTICE 'Properties table now includes: category, property_subtype, rental fields, image_urls';
    RAISE NOTICE 'Agents table now includes: is_verified, specialties, service_areas';
END $$;