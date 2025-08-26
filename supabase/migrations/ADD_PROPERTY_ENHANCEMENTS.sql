-- =====================================================
-- PROPERTY ENHANCEMENTS - SALE TYPE AND LOCATION
-- =====================================================
-- Adds sale_type field, enhances location fields
-- =====================================================

BEGIN;

-- 1. Add sale_type field for properties
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS sale_type TEXT 
CHECK (sale_type IN ('new', 'resale'));

-- 2. First update any properties with rent_to_own to rent
UPDATE properties 
SET category = 'rent' 
WHERE category = 'rent_to_own';

-- 3. Update category constraint to remove rent_to_own
ALTER TABLE properties 
DROP CONSTRAINT IF EXISTS properties_category_check;

ALTER TABLE properties 
ADD CONSTRAINT properties_category_check 
CHECK (category IN ('sale', 'rent', 'lease'));

-- 4. Ensure is_featured field exists and has proper index
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_properties_is_featured 
ON properties(is_featured) 
WHERE is_featured = true;

-- 5. Add structured location fields for better autocomplete
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS country_code TEXT CHECK (country_code IN ('IN', 'AE')),
ADD COLUMN IF NOT EXISTS state_code TEXT,
ADD COLUMN IF NOT EXISTS locality TEXT,
ADD COLUMN IF NOT EXISTS landmark TEXT,
ADD COLUMN IF NOT EXISTS map_location JSONB;

-- 6. Create indexes for better location search performance
CREATE INDEX IF NOT EXISTS idx_properties_country_code ON properties(country_code);
CREATE INDEX IF NOT EXISTS idx_properties_city_country ON properties(city, country_code);
CREATE INDEX IF NOT EXISTS idx_properties_state_code ON properties(state_code);

-- 7. Update existing properties to set sale_type based on property age
UPDATE properties 
SET sale_type = CASE 
    WHEN category = 'sale' AND (year_built IS NULL OR year_built >= EXTRACT(YEAR FROM CURRENT_DATE) - 2) THEN 'new'
    WHEN category = 'sale' THEN 'resale'
    ELSE NULL
END
WHERE sale_type IS NULL AND category = 'sale';

-- 8. Set country_code based on existing country field
UPDATE properties 
SET country_code = CASE 
    WHEN LOWER(country) LIKE '%india%' THEN 'IN'
    WHEN LOWER(country) LIKE '%uae%' OR LOWER(country) LIKE '%dubai%' OR LOWER(country) LIKE '%emirates%' THEN 'AE'
    ELSE NULL
END
WHERE country_code IS NULL;

COMMIT;

-- Verification
DO $$
BEGIN
    RAISE NOTICE 'Property enhancements have been applied successfully';
    RAISE NOTICE 'Added: sale_type (new/resale) field';
    RAISE NOTICE 'Removed: rent_to_own from categories';
    RAISE NOTICE 'Added: Enhanced location fields with country_code';
    RAISE NOTICE 'Added: is_featured field with optimized index';
END $$;