-- Fix duplicate CRM actions issue
-- This script cleans up duplicate actions and adds constraints to prevent future duplicates

-- 1. First, identify and keep only the first action for each decision_id
WITH duplicates AS (
  SELECT 
    id,
    decision_id,
    ROW_NUMBER() OVER (PARTITION BY decision_id ORDER BY created_at ASC) as rn
  FROM crm_action_queue
  WHERE decision_id IS NOT NULL
)
DELETE FROM crm_action_queue
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- 2. Add unique constraint on decision_id to prevent future duplicates
ALTER TABLE crm_action_queue
DROP CONSTRAINT IF EXISTS crm_action_queue_decision_id_key;

ALTER TABLE crm_action_queue
ADD CONSTRAINT crm_action_queue_decision_id_key UNIQUE (decision_id);

-- 3. Clean up completed actions older than 24 hours to keep queue clean
DELETE FROM crm_action_queue 
WHERE status = 'completed' 
AND created_at < NOW() - INTERVAL '24 hours';

-- 4. Reset any stuck 'processing' actions back to 'queued'
UPDATE crm_action_queue
SET status = 'queued',
    updated_at = NOW()
WHERE status = 'processing'
AND updated_at < NOW() - INTERVAL '5 minutes';

-- 5. Add index for better performance
CREATE INDEX IF NOT EXISTS idx_crm_action_queue_status_created 
ON crm_action_queue(status, created_at);

-- 6. Clean up and add unique constraint on approval_actions
-- First check if status column exists, if not add it
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='approval_actions' AND column_name='status') THEN
        ALTER TABLE approval_actions ADD COLUMN status TEXT DEFAULT 'executed';
    END IF;
END $$;

-- Remove duplicate approval actions, keeping only the first one for each request_id
WITH duplicates AS (
  SELECT 
    id,
    request_id,
    ROW_NUMBER() OVER (PARTITION BY request_id ORDER BY created_at ASC, id ASC) as rn
  FROM approval_actions
  WHERE request_id IS NOT NULL
)
DELETE FROM approval_actions
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- Now add the unique constraint
ALTER TABLE approval_actions
DROP CONSTRAINT IF EXISTS approval_actions_request_id_key;

ALTER TABLE approval_actions
ADD CONSTRAINT approval_actions_request_id_key 
UNIQUE (request_id);

-- 7. View current queue status
SELECT 
  status,
  COUNT(*) as count,
  MAX(created_at) as latest,
  MIN(created_at) as oldest
FROM crm_action_queue
GROUP BY status
ORDER BY status;

-- 8. Check for any duplicate leads by phone number
SELECT 
  phone,
  COUNT(*) as duplicate_count,
  STRING_AGG(name, ', ') as names,
  STRING_AGG(id::text, ', ') as ids
FROM leads
WHERE source = 'voice_crm'
AND phone IS NOT NULL
AND phone != ''
GROUP BY phone
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;

-- Success message
SELECT 'Duplicate prevention constraints added successfully!' as message;