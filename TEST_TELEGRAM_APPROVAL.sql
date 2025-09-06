-- Test Script for Telegram Voice to Approval System
-- Run these queries after sending a voice note through Telegram

-- 1. Check recent voice processing jobs
SELECT 
    vpj.id,
    vpj.communication_id,
    vpj.status,
    vpj.current_step,
    vpj.error_message,
    vpj.created_at,
    vpj.updated_at
FROM voice_processing_jobs vpj
ORDER BY created_at DESC
LIMIT 5;

-- 2. Check recent communications with transcriptions
SELECT 
    cc.id,
    cc.transcription,
    cc.processed_content,
    cc.subject,
    cc.sentiment,
    cc.key_points,
    cc.action_items,
    cc.entities,
    cc.status,
    cc.created_at
FROM client_communications cc
WHERE cc.transcription IS NOT NULL
ORDER BY created_at DESC
LIMIT 5;

-- 3. Check AI decisions created from voice notes
SELECT 
    ad.id,
    ad.communication_id,
    ad.decision_type,
    ad.confidence_score,
    ad.status,
    ad.parameters,
    ad.suggested_at,
    cc.transcription as voice_transcription
FROM ai_decisions ad
LEFT JOIN client_communications cc ON ad.communication_id = cc.id
ORDER BY ad.suggested_at DESC
LIMIT 10;

-- 4. Check approval requests created
SELECT 
    ar.id,
    ar.decision_id,
    ar.action_type,
    ar.proposed_changes,
    ar.change_summary,
    ar.priority,
    ar.status,
    ar.requested_at,
    ar.expires_at,
    ar.metadata
FROM approval_requests ar
ORDER BY requested_at DESC
LIMIT 10;

-- 5. Check the link between decisions and approval requests
SELECT 
    ad.id as decision_id,
    ad.decision_type,
    ad.confidence_score,
    ad.status as decision_status,
    ar.id as approval_id,
    ar.status as approval_status,
    ar.action_type,
    cc.transcription
FROM ai_decisions ad
LEFT JOIN approval_requests ar ON ar.decision_id = ad.id
LEFT JOIN client_communications cc ON ad.communication_id = cc.id
WHERE ad.suggested_at > NOW() - INTERVAL '1 hour'
ORDER BY ad.suggested_at DESC;

-- 6. Debug: Check for orphaned decisions (no approval request)
SELECT 
    ad.id,
    ad.decision_type,
    ad.communication_id,
    ad.status,
    ad.parameters,
    cc.transcription
FROM ai_decisions ad
LEFT JOIN approval_requests ar ON ar.decision_id = ad.id
LEFT JOIN client_communications cc ON ad.communication_id = cc.id
WHERE ar.id IS NULL
  AND ad.status = 'pending'
  AND ad.decision_type != 'add_note' -- Notes might auto-approve
  AND ad.suggested_at > NOW() - INTERVAL '1 hour'
ORDER BY ad.suggested_at DESC;

-- 7. Check auto-approval rules
SELECT 
    aar.id,
    aar.rule_name,
    aar.entity_type,
    aar.action_type,
    aar.conditions,
    aar.is_active
FROM auto_approval_rules aar
WHERE is_active = true;

-- 8. Count statistics for recent activity
SELECT 
    'Communications' as type, 
    COUNT(*) as count
FROM client_communications 
WHERE created_at > NOW() - INTERVAL '1 hour'
UNION ALL
SELECT 
    'AI Decisions', 
    COUNT(*) 
FROM ai_decisions 
WHERE suggested_at > NOW() - INTERVAL '1 hour'
UNION ALL
SELECT 
    'Approval Requests', 
    COUNT(*) 
FROM approval_requests 
WHERE requested_at > NOW() - INTERVAL '1 hour'
UNION ALL
SELECT 
    'Auto-Approved', 
    COUNT(*) 
FROM approval_requests 
WHERE status = 'auto_approved'
    AND requested_at > NOW() - INTERVAL '1 hour';

-- 9. Test specific phrase detection
-- Look for "create lead" mentions in recent transcriptions
SELECT 
    cc.id,
    cc.transcription,
    cc.entities,
    ad.decision_type,
    ad.parameters
FROM client_communications cc
LEFT JOIN ai_decisions ad ON ad.communication_id = cc.id
WHERE (
    LOWER(cc.transcription) LIKE '%create%lead%' OR
    LOWER(cc.transcription) LIKE '%new lead%' OR
    LOWER(cc.transcription) LIKE '%add%lead%'
)
AND cc.created_at > NOW() - INTERVAL '1 hour'
ORDER BY cc.created_at DESC;

-- 10. Full workflow trace for most recent voice note
WITH recent_comm AS (
    SELECT id, transcription, created_at
    FROM client_communications
    WHERE transcription IS NOT NULL
    ORDER BY created_at DESC
    LIMIT 1
)
SELECT 
    'Communication' as stage,
    rc.id,
    rc.transcription as details,
    rc.created_at as timestamp
FROM recent_comm rc
UNION ALL
SELECT 
    'AI Decision' as stage,
    ad.id,
    ad.decision_type || ' (confidence: ' || ad.confidence_score || ')' as details,
    ad.suggested_at as timestamp
FROM ai_decisions ad
WHERE ad.communication_id = (SELECT id FROM recent_comm)
UNION ALL
SELECT 
    'Approval Request' as stage,
    ar.id,
    ar.action_type || ' (status: ' || ar.status || ')' as details,
    ar.requested_at as timestamp
FROM approval_requests ar
WHERE ar.decision_id IN (
    SELECT id FROM ai_decisions 
    WHERE communication_id = (SELECT id FROM recent_comm)
)
ORDER BY timestamp;