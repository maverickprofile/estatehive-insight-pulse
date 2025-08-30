-- =====================================================
-- UPDATE EH CATEGORIES - PRESERVE EXISTING VALUES
-- =====================================================
-- This migration adds new categories while preserving existing ones
-- =====================================================

BEGIN;

-- Step 1: Drop the existing constraint if it exists
ALTER TABLE properties 
DROP CONSTRAINT IF EXISTS properties_subcategory_check;

-- Step 2: Add the updated constraint with ALL categories (old and new)
ALTER TABLE properties 
ADD CONSTRAINT properties_subcategory_check 
CHECK (subcategory IS NULL OR subcategory IN (
    'eh_living',      -- Existing EH Living category (preserved)
    'eh_commercial',  -- NEW: EH Commercial properties
    'eh_verified',    -- Existing EH Verified properties  
    'eh_signature',   -- Existing EH Signature properties
    'eh_dubai'        -- NEW: EH Dubai properties
));

-- Step 3: Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_properties_subcategory ON properties(subcategory);
CREATE INDEX IF NOT EXISTS idx_properties_category_subcategory ON properties(category, subcategory);

-- Step 4: Add comment to explain the subcategory field
COMMENT ON COLUMN properties.subcategory IS 'Premium EH property categories: eh_living (living spaces), eh_commercial (commercial properties), eh_verified (verified premium properties), eh_signature (signature luxury properties), eh_dubai (Dubai properties)';

COMMIT;

-- Verification
DO $$
DECLARE
    total_count INTEGER;
    living_count INTEGER;
    commercial_count INTEGER;
    verified_count INTEGER;
    signature_count INTEGER;
    dubai_count INTEGER;
    null_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_count FROM properties;
    SELECT COUNT(*) INTO living_count FROM properties WHERE subcategory = 'eh_living';
    SELECT COUNT(*) INTO commercial_count FROM properties WHERE subcategory = 'eh_commercial';
    SELECT COUNT(*) INTO verified_count FROM properties WHERE subcategory = 'eh_verified';
    SELECT COUNT(*) INTO signature_count FROM properties WHERE subcategory = 'eh_signature';
    SELECT COUNT(*) INTO dubai_count FROM properties WHERE subcategory = 'eh_dubai';
    SELECT COUNT(*) INTO null_count FROM properties WHERE subcategory IS NULL;
    
    RAISE NOTICE '======================================';
    RAISE NOTICE 'EH Categories Update Completed!';
    RAISE NOTICE '======================================';
    RAISE NOTICE 'Total properties: %', total_count;
    RAISE NOTICE 'Properties by category:';
    RAISE NOTICE '  - EH Living: %', living_count;
    RAISE NOTICE '  - EH Commercial: %', commercial_count;
    RAISE NOTICE '  - EH Verified: %', verified_count;
    RAISE NOTICE '  - EH Signature: %', signature_count;
    RAISE NOTICE '  - EH Dubai: %', dubai_count;
    RAISE NOTICE '  - No category: %', null_count;
    RAISE NOTICE '======================================';
END $$;