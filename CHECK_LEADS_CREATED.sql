-- Check if leads were created successfully
SELECT 
    id,
    name,
    phone,
    email,
    source,
    interested_in,
    budget_min,
    budget_max,
    created_at
FROM leads 
WHERE source = 'voice_crm' 
ORDER BY created_at DESC 
LIMIT 10;

-- If you see "Unknown Lead" entries, it means the system is working
-- but the data isn't being passed properly from the approval

-- Count how many leads were created
SELECT 
    COUNT(*) as total_voice_crm_leads,
    COUNT(CASE WHEN name = 'Unknown Lead' THEN 1 END) as unknown_leads,
    COUNT(CASE WHEN name != 'Unknown Lead' THEN 1 END) as named_leads
FROM leads 
WHERE source = 'voice_crm';

-- Check one of your approval requests to see what data it contains
SELECT 
    id,
    entity_type,
    action_type,
    status,
    proposed_changes,
    metadata,
    metadata->'proposed_changes' as metadata_proposed_changes
FROM approval_requests 
WHERE entity_type = 'lead' 
ORDER BY created_at DESC 
LIMIT 5;