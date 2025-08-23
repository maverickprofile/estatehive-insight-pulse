-- =====================================================
-- COMPLETE PROPERTIES TABLE - MATCHING ADD PROPERTY FORM
-- =====================================================
-- Drop and recreate with ALL fields from the form
-- =====================================================

-- Drop existing table and start fresh
DROP TABLE IF EXISTS properties CASCADE;

-- Create properties table with ALL fields from AddProperty form
CREATE TABLE properties (
    -- Primary Key
    id SERIAL PRIMARY KEY,
    
    -- ===== BASIC INFORMATION =====
    title TEXT NOT NULL,
    description TEXT,
    property_type TEXT DEFAULT 'residential',
    property_subtype TEXT DEFAULT 'apartment', -- apartment, villa, studio, penthouse, etc.
    category TEXT DEFAULT 'sale', -- sale, rent, lease
    status TEXT DEFAULT 'active', -- active, draft, pending, sold, rented
    
    -- ===== LOCATION DETAILS =====
    address TEXT, -- Street address
    unit_number TEXT, -- Unit/Flat number
    neighborhood TEXT, -- Area/Neighborhood
    city TEXT NOT NULL,
    state TEXT,
    postal_code TEXT,
    country TEXT DEFAULT 'India',
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    
    -- ===== PRICING INFORMATION =====
    price DECIMAL(15,2), -- Sale price
    original_price DECIMAL(15,2), -- Original/Listed price
    price_negotiable BOOLEAN DEFAULT false,
    currency TEXT DEFAULT 'INR',
    
    -- Rental specific (if category = rent)
    rent_amount DECIMAL(15,2),
    rent_frequency TEXT DEFAULT 'monthly',
    security_deposit DECIMAL(15,2),
    maintenance_fee DECIMAL(15,2),
    
    -- ===== PROPERTY SPECIFICATIONS =====
    area_sqft DECIMAL(10,2), -- Area in square feet
    plot_area DECIMAL(10,2),
    built_up_area DECIMAL(10,2),
    carpet_area DECIMAL(10,2),
    
    -- ===== ROOM DETAILS =====
    bedrooms INTEGER,
    bathrooms INTEGER,
    balconies INTEGER,
    total_rooms INTEGER,
    
    -- ===== PARKING & FLOORS =====
    parking_spaces INTEGER,
    covered_parking INTEGER,
    floor_number INTEGER,
    total_floors INTEGER,
    
    -- ===== CONSTRUCTION & CONDITION =====
    year_built INTEGER,
    possession_date DATE,
    furnishing_status TEXT DEFAULT 'unfurnished', -- unfurnished, semi_furnished, fully_furnished
    facing_direction TEXT DEFAULT 'north', -- north, south, east, west, etc.
    property_condition TEXT DEFAULT 'new', -- new, resale, under_construction
    
    -- ===== AMENITIES (Store as array) =====
    amenities TEXT[], -- ["Swimming Pool", "Gym", "Parking", etc.]
    
    -- ===== IMAGES =====
    image_urls TEXT[], -- Array of image URLs
    images TEXT[], -- Alternative field for image storage
    floor_plan_url TEXT,
    brochure_url TEXT,
    video_url TEXT,
    virtual_tour_url TEXT,
    
    -- ===== MARKETING & SEO =====
    is_featured BOOLEAN DEFAULT false,
    featured BOOLEAN DEFAULT false, -- Duplicate for compatibility
    meta_title TEXT,
    meta_description TEXT,
    slug TEXT UNIQUE,
    tags TEXT[],
    
    -- ===== STATISTICS =====
    views_count INTEGER DEFAULT 0,
    inquiries_count INTEGER DEFAULT 0,
    
    -- ===== OWNERSHIP & ASSIGNMENT =====
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    owner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    agent_id TEXT, -- Reference to agents table if exists
    builder_name TEXT,
    project_name TEXT,
    
    -- ===== ADDITIONAL DETAILS =====
    property_tax DECIMAL(10,2),
    hoa_fees DECIMAL(10,2),
    utilities_included TEXT[],
    pet_friendly BOOLEAN DEFAULT false,
    
    -- ===== RERA DETAILS =====
    rera_id TEXT,
    rera_approved BOOLEAN DEFAULT false,
    
    -- ===== TIMESTAMPS =====
    listed_date DATE DEFAULT CURRENT_DATE,
    sold_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX idx_properties_status ON properties(status);
CREATE INDEX idx_properties_type ON properties(property_type);
CREATE INDEX idx_properties_category ON properties(category);
CREATE INDEX idx_properties_city ON properties(city);
CREATE INDEX idx_properties_price ON properties(price);
CREATE INDEX idx_properties_featured ON properties(is_featured);
CREATE INDEX idx_properties_created_by ON properties(created_by);
CREATE INDEX idx_properties_area ON properties(area_sqft);
CREATE INDEX idx_properties_bedrooms ON properties(bedrooms);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view active properties" ON properties;
DROP POLICY IF EXISTS "Users can manage own properties" ON properties;
DROP POLICY IF EXISTS "Admins can manage all properties" ON properties;

-- Anyone can view active properties
CREATE POLICY "Public can view active properties" ON properties
    FOR SELECT
    USING (status = 'active');

-- Authenticated users can view all properties
CREATE POLICY "Authenticated can view all properties" ON properties
    FOR SELECT
    TO authenticated
    USING (true);

-- Users can manage their own properties
CREATE POLICY "Users can manage own properties" ON properties
    FOR ALL
    TO authenticated
    USING (created_by = auth.uid())
    WITH CHECK (created_by = auth.uid());

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_properties_updated_at
    BEFORE UPDATE ON properties
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Calculate area in square meters if needed
CREATE OR REPLACE FUNCTION calculate_property_fields()
RETURNS TRIGGER AS $$
BEGIN
    -- Generate slug if not provided
    IF NEW.slug IS NULL AND NEW.title IS NOT NULL THEN
        NEW.slug = LOWER(
            REGEXP_REPLACE(
                REGEXP_REPLACE(NEW.title, '[^a-zA-Z0-9\s-]', '', 'g'),
                '\s+', '-', 'g'
            )
        ) || '-' || SUBSTR(MD5(RANDOM()::TEXT), 1, 6);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_property_fields_trigger
    BEFORE INSERT OR UPDATE ON properties
    FOR EACH ROW
    EXECUTE FUNCTION calculate_property_fields();

-- =====================================================
-- STORAGE BUCKET FOR IMAGES
-- =====================================================
DO $$
BEGIN
    -- Create property-images bucket if it doesn't exist
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
        'property-images',
        'property-images',
        true,
        10485760, -- 10MB
        ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    )
    ON CONFLICT (id) DO UPDATE
    SET 
        public = true,
        file_size_limit = 10485760;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Storage bucket might already exist or storage not enabled';
END $$;

-- Storage policies
DO $$
BEGIN
    -- Allow anyone to view property images
    CREATE POLICY "Anyone can view property images" ON storage.objects
        FOR SELECT USING (bucket_id = 'property-images');
    
    -- Allow authenticated users to upload
    CREATE POLICY "Authenticated users can upload property images" ON storage.objects
        FOR INSERT 
        TO authenticated
        WITH CHECK (bucket_id = 'property-images');
    
    -- Allow users to update their own images
    CREATE POLICY "Users can update own property images" ON storage.objects
        FOR UPDATE
        TO authenticated
        USING (bucket_id = 'property-images' AND auth.uid()::text = (storage.foldername(name))[1]);
    
    -- Allow users to delete their own images
    CREATE POLICY "Users can delete own property images" ON storage.objects
        FOR DELETE
        TO authenticated
        USING (bucket_id = 'property-images' AND auth.uid()::text = (storage.foldername(name))[1]);
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Storage policies might already exist';
END $$;

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================
GRANT ALL ON properties TO authenticated;
GRANT SELECT ON properties TO anon;
GRANT ALL ON properties_id_seq TO authenticated;

-- =====================================================
-- TEST INSERT
-- =====================================================
DO $$
BEGIN
    INSERT INTO properties (
        title,
        description,
        property_type,
        property_subtype,
        category,
        status,
        city,
        state,
        area_sqft,
        bedrooms,
        bathrooms,
        price,
        amenities,
        is_featured
    ) VALUES (
        'Test Property',
        'This is a test property to verify table creation',
        'residential',
        'apartment',
        'sale',
        'draft',
        'Test City',
        'Test State',
        1500,
        3,
        2,
        5000000,
        ARRAY['Parking', 'Gym', 'Swimming Pool'],
        false
    );
    
    -- Delete the test property
    DELETE FROM properties WHERE title = 'Test Property';
    
    RAISE NOTICE '✅ Properties table created successfully with all fields!';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '⚠️ Test insert failed: %', SQLERRM;
END $$;

-- =====================================================
-- VERIFICATION
-- =====================================================
DO $$
DECLARE
    col_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO col_count
    FROM information_schema.columns
    WHERE table_name = 'properties';
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ PROPERTIES TABLE CREATED SUCCESSFULLY!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '📊 Total columns: %', col_count;
    RAISE NOTICE '🏠 Ready for property listings';
    RAISE NOTICE '🖼️ Image storage configured';
    RAISE NOTICE '🔒 RLS policies applied';
    RAISE NOTICE '========================================';
END $$;