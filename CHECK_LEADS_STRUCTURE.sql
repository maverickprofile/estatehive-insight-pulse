-- Check current structure of leads table
-- Run this FIRST to see what columns exist

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'leads'
ORDER BY ordinal_position;

-- Check if these critical columns exist
SELECT 
    COUNT(*) FILTER (WHERE column_name = 'interest_type') as has_interest_type,
    COUNT(*) FILTER (WHERE column_name = 'interested_in') as has_interested_in,
    COUNT(*) FILTER (WHERE column_name = 'budget_min') as has_budget_min,
    COUNT(*) FILTER (WHERE column_name = 'budget_max') as has_budget_max,
    COUNT(*) FILTER (WHERE column_name = 'source') as has_source,
    COUNT(*) FILTER (WHERE column_name = 'location_preference') as has_location_preference
FROM information_schema.columns 
WHERE table_name = 'leads';

-- Check existing leads to see what data they have
SELECT 
    id,
    name,
    email,
    phone,
    created_at
FROM leads 
ORDER BY created_at DESC 
LIMIT 5;