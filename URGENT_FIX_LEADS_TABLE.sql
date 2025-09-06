-- URGENT: Fix leads table and approval system
-- Run this in Supabase SQL Editor immediately

-- Step 1: Add missing column to leads table
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS interested_in TEXT;

-- Step 2: Check if leads table has all required columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'leads' 
AND column_name IN ('name', 'phone', 'email', 'source', 'interested_in', 'budget_min', 'budget_max', 'notes', 'priority', 'stage');

-- Step 3: Create a test lead directly to verify table works
INSERT INTO leads (
    name,
    phone,
    email,
    source,
    interested_in,
    budget_min,
    budget_max,
    notes,
    priority,
    stage,
    created_at
) VALUES (
    'Direct Test Lead',
    '+91-9999999999',
    'test@direct.com',
    'voice_crm',
    'Test Property',
    1000000,
    5000000,
    'Test lead to verify table structure',
    'normal',
    'new',
    NOW()
);

-- Step 4: Check if the lead was created
SELECT * FROM leads WHERE source = 'voice_crm' ORDER BY created_at DESC LIMIT 5;

-- Step 5: Clear the Supabase cache (run this after the above)
-- This forces Supabase to refresh the schema cache
NOTIFY pgrst, 'reload schema';

-- If you still get errors after running this:
-- 1. Go to Supabase Dashboard > Settings > API
-- 2. Click "Reload Schema Cache" button
-- 3. Wait 30 seconds
-- 4. Try approving again