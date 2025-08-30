-- =====================================================
-- SAFE UPDATE OF EH CATEGORIES FOR PROPERTIES
-- =====================================================
-- This migration safely updates the subcategory field by:
-- 1. First checking and updating existing data
-- 2. Then applying the new constraint
-- =====================================================

BEGIN;

-- Step 1: Check what subcategory values currently exist
DO $$
DECLARE
    existing_values TEXT;
BEGIN
    SELECT string_agg(DISTINCT subcategory::text, ', ') 
    INTO existing_values
    FROM properties 
    WHERE subcategory IS NOT NULL;
    
    IF existing_values IS NOT NULL THEN
        RAISE NOTICE 'Existing subcategory values found: %', existing_values;
    ELSE
        RAISE NOTICE 'No existing subcategory values found';
    END IF;
END $$;

-- Step 2: Update any existing 'eh_living' values to 'eh_signature' (or set to NULL)
-- You can modify this based on your preference
UPDATE properties 
SET subcategory = CASE 
    WHEN subcategory = 'eh_living' THEN 'eh_signature'  -- Map eh_living to eh_signature
    WHEN subcategory IN ('eh_verified', 'eh_signature') THEN subcategory  -- Keep these as is
    ELSE NULL  -- Set any other values to NULL
END
WHERE subcategory IS NOT NULL;

-- Step 3: Drop the existing constraint if it exists
ALTER TABLE properties 
DROP CONSTRAINT IF EXISTS properties_subcategory_check;

-- Step 4: Add the updated constraint with all EH categories
ALTER TABLE properties 
ADD CONSTRAINT properties_subcategory_check 
CHECK (subcategory IS NULL OR subcategory IN (
    'eh_commercial',  -- EH Commercial properties
    'eh_verified',    -- EH Verified properties  
    'eh_signature',   -- EH Signature properties
    'eh_dubai'        -- EH Dubai properties
));

-- Step 5: Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_properties_subcategory ON properties(subcategory);
CREATE INDEX IF NOT EXISTS idx_properties_category_subcategory ON properties(category, subcategory);

-- Step 6: Add comment to explain the subcategory field
COMMENT ON COLUMN properties.subcategory IS 'Premium EH property categories: eh_commercial (commercial properties), eh_verified (verified premium properties), eh_signature (signature luxury properties), eh_dubai (Dubai properties)';

COMMIT;

-- Verification and information
DO $$
DECLARE
    total_count INTEGER;
    commercial_count INTEGER;
    verified_count INTEGER;
    signature_count INTEGER;
    dubai_count INTEGER;
    null_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_count FROM properties;
    SELECT COUNT(*) INTO commercial_count FROM properties WHERE subcategory = 'eh_commercial';
    SELECT COUNT(*) INTO verified_count FROM properties WHERE subcategory = 'eh_verified';
    SELECT COUNT(*) INTO signature_count FROM properties WHERE subcategory = 'eh_signature';
    SELECT COUNT(*) INTO dubai_count FROM properties WHERE subcategory = 'eh_dubai';
    SELECT COUNT(*) INTO null_count FROM properties WHERE subcategory IS NULL;
    
    RAISE NOTICE '======================================';
    RAISE NOTICE 'EH Categories Update Completed Successfully!';
    RAISE NOTICE '======================================';
    RAISE NOTICE 'Total properties: %', total_count;
    RAISE NOTICE 'Properties by category:';
    RAISE NOTICE '  - EH Commercial: %', commercial_count;
    RAISE NOTICE '  - EH Verified: %', verified_count;
    RAISE NOTICE '  - EH Signature: %', signature_count;
    RAISE NOTICE '  - EH Dubai: %', dubai_count;
    RAISE NOTICE '  - No category: %', null_count;
    RAISE NOTICE '======================================';
    RAISE NOTICE 'Available EH Categories:';
    RAISE NOTICE '1. eh_commercial - Commercial properties';
    RAISE NOTICE '2. eh_verified - Verified premium properties';
    RAISE NOTICE '3. eh_signature - Signature luxury properties';
    RAISE NOTICE '4. eh_dubai - Dubai properties';
    RAISE NOTICE '======================================';
END $$;