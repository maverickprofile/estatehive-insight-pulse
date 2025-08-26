-- =====================================================
-- ADD SUBCATEGORY FIELD TO PROPERTIES TABLE
-- =====================================================
-- Run this file to add subcategory support for properties
-- Categories: sale, rent, lease, rent_to_own
-- Subcategories: eh_living, eh_verified, eh_signature
-- =====================================================

BEGIN;

-- Add subcategory column if it doesn't exist
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS subcategory TEXT 
CHECK (subcategory IN ('eh_living', 'eh_verified', 'eh_signature'));

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_properties_subcategory ON properties(subcategory);

-- Update existing properties to have null subcategory (optional, based on your requirements)
-- UPDATE properties SET subcategory = NULL WHERE subcategory IS NULL;

COMMIT;

-- Verification
DO $$
BEGIN
    RAISE NOTICE 'Subcategory field has been added to properties table';
    RAISE NOTICE 'Valid subcategories: eh_living, eh_verified, eh_signature';
    RAISE NOTICE 'You can now categorize properties with these premium subcategories';
END $$;