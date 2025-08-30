-- =====================================================
-- UPDATE EH CATEGORIES FOR PROPERTIES
-- =====================================================
-- This migration updates the subcategory field to include
-- the new EH categories system
-- =====================================================

BEGIN;

-- First, drop the existing constraint if it exists
ALTER TABLE properties 
DROP CONSTRAINT IF EXISTS properties_subcategory_check;

-- Add the updated subcategory constraint with all EH categories
ALTER TABLE properties 
ADD CONSTRAINT properties_subcategory_check 
CHECK (subcategory IN (
    'eh_commercial',  -- EH Commercial properties
    'eh_verified',    -- EH Verified properties  
    'eh_signature',   -- EH Signature properties
    'eh_dubai'        -- EH Dubai properties
));

-- Create index if it doesn't exist for better query performance
CREATE INDEX IF NOT EXISTS idx_properties_subcategory ON properties(subcategory);
CREATE INDEX IF NOT EXISTS idx_properties_category_subcategory ON properties(category, subcategory);

-- Add comment to explain the subcategory field
COMMENT ON COLUMN properties.subcategory IS 'Premium EH property categories: eh_commercial (commercial properties), eh_verified (verified premium properties), eh_signature (signature luxury properties), eh_dubai (Dubai properties)';

COMMIT;

-- Verification and information
DO $$
BEGIN
    RAISE NOTICE '======================================';
    RAISE NOTICE 'EH Categories Update Completed!';
    RAISE NOTICE '======================================';
    RAISE NOTICE 'Available EH Categories:';
    RAISE NOTICE '1. eh_commercial - Commercial properties';
    RAISE NOTICE '2. eh_verified - Verified premium properties';
    RAISE NOTICE '3. eh_signature - Signature luxury properties';
    RAISE NOTICE '4. eh_dubai - Dubai properties';
    RAISE NOTICE '======================================';
END $$;