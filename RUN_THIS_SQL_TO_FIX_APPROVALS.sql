-- IMPORTANT: Run this SQL in your Supabase SQL Editor to fix the approval system
-- This will add all missing columns and ensure the approval system works properly

-- Step 1: Ensure approval_requests table has all required columns
ALTER TABLE approval_requests 
ADD COLUMN IF NOT EXISTS current_data JSONB,
ADD COLUMN IF NOT EXISTS proposed_changes JSONB,
ADD COLUMN IF NOT EXISTS change_summary TEXT,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS tags TEXT[],
ADD COLUMN IF NOT EXISTS is_urgent BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS request_reason TEXT,
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS rejected_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS approval_notes TEXT,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Step 2: Ensure ai_decisions table has all required columns
ALTER TABLE ai_decisions
ADD COLUMN IF NOT EXISTS action_type TEXT,
ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'normal',
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS executed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS error_message TEXT;

-- Step 3: Create approval_actions table if it doesn't exist
CREATE TABLE IF NOT EXISTS approval_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID NOT NULL,
    user_id TEXT NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('approve', 'reject', 'request_changes')),
    modified_data JSONB,
    reason TEXT,
    notes TEXT,
    action_taken_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 4: Create crm_action_queue table if it doesn't exist
CREATE TABLE IF NOT EXISTS crm_action_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    decision_id UUID,
    action_type TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    operation TEXT NOT NULL,
    payload JSONB NOT NULL,
    status TEXT DEFAULT 'queued',
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    scheduled_for TIMESTAMP WITH TIME ZONE,
    executed_at TIMESTAMP WITH TIME ZONE,
    result JSONB,
    error TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 5: Enable RLS with permissive policies for testing
ALTER TABLE approval_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_action_queue ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Enable all for authenticated users" ON approval_requests;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON ai_decisions;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON approval_actions;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON crm_action_queue;

-- Create permissive policies for authenticated users
CREATE POLICY "Enable all for authenticated users" ON approval_requests
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Enable all for authenticated users" ON ai_decisions
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Enable all for authenticated users" ON approval_actions
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Enable all for authenticated users" ON crm_action_queue
    FOR ALL USING (true) WITH CHECK (true);

-- Step 6: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_approval_requests_status ON approval_requests(status);
CREATE INDEX IF NOT EXISTS idx_approval_requests_created_at ON approval_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_approval_requests_organization_id ON approval_requests(organization_id);
CREATE INDEX IF NOT EXISTS idx_ai_decisions_status ON ai_decisions(status);
CREATE INDEX IF NOT EXISTS idx_ai_decisions_communication_id ON ai_decisions(communication_id);
CREATE INDEX IF NOT EXISTS idx_crm_action_queue_status ON crm_action_queue(status);

-- Step 7: Fix existing approval requests with incorrect data structure
UPDATE approval_requests 
SET metadata = jsonb_build_object(
    'proposed_changes', 
    CASE 
        WHEN proposed_changes IS NOT NULL THEN proposed_changes
        WHEN metadata->'proposed_changes' IS NOT NULL THEN metadata->'proposed_changes'
        ELSE '{}'::jsonb
    END,
    'current_data',
    CASE
        WHEN current_data IS NOT NULL THEN current_data
        WHEN metadata->'current_data' IS NOT NULL THEN metadata->'current_data'
        ELSE '{}'::jsonb
    END,
    'change_summary',
    COALESCE(
        change_summary,
        metadata->>'change_summary',
        'Updated via migration'
    ),
    'confidence_score', 
    COALESCE(
        (metadata->>'confidence_score')::numeric, 
        0.8
    )
)
WHERE metadata IS NULL OR metadata = '{}'::jsonb;

-- Step 8: Insert a test approval request to verify everything works
INSERT INTO approval_requests (
    id,
    organization_id,
    entity_type,
    entity_id,
    action_type,
    requested_by,
    status,
    priority,
    metadata,
    created_at,
    updated_at,
    requested_at,
    expires_at
) VALUES (
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000000',
    'lead',
    gen_random_uuid(),
    'create',
    '00000000-0000-0000-0000-000000000000',
    'pending',
    'high',
    jsonb_build_object(
        'proposed_changes', jsonb_build_object(
            'name', 'Test Lead from SQL',
            'phone', '+91-9876543210',
            'email', 'test@example.com',
            'budget_min', 5000000,
            'budget_max', 8000000,
            'source', 'voice_crm',
            'notes', 'This is a test lead created from SQL migration'
        ),
        'change_summary', 'Create lead for Test Lead from SQL',
        'request_reason', 'Testing approval system setup',
        'confidence_score', 0.95
    ),
    NOW(),
    NOW(),
    NOW(),
    NOW() + INTERVAL '24 hours'
) ON CONFLICT DO NOTHING;

-- Step 9: Add missing column to leads table
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS interested_in TEXT;

-- Step 10: Verify the setup
SELECT 
    'approval_requests' as table_name,
    COUNT(*) as record_count 
FROM approval_requests
UNION ALL
SELECT 
    'ai_decisions' as table_name,
    COUNT(*) as record_count 
FROM ai_decisions
UNION ALL
SELECT 
    'approval_actions' as table_name,
    COUNT(*) as record_count 
FROM approval_actions
UNION ALL
SELECT 
    'crm_action_queue' as table_name,
    COUNT(*) as record_count 
FROM crm_action_queue;

-- If everything runs successfully, you should see:
-- 1. All tables created/updated without errors
-- 2. At least 1 record in approval_requests table
-- 3. The approval system should now work properly