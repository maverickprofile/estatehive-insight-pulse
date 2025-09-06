-- Complete fix for leads table structure
-- This migration adds all missing columns first, then sets defaults

-- 1. First, add ALL missing columns that don't exist
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS interest_type VARCHAR(20) DEFAULT 'buy';

ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS interested_in TEXT;

ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS location_preference TEXT[] DEFAULT '{}';

ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS score INTEGER DEFAULT 0;

ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS followup_count INTEGER DEFAULT 0;

ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS site_visits_count INTEGER DEFAULT 0;

ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS converted_to_client BOOLEAN DEFAULT false;

ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS language_preference VARCHAR(10) DEFAULT 'en';

ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS property_type TEXT[] DEFAULT '{}';

ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS property_subtype TEXT[] DEFAULT '{}';

ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS preferred_cities TEXT[] DEFAULT '{}';

ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS preferred_neighborhoods TEXT[] DEFAULT '{}';

ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS preferred_amenities TEXT[] DEFAULT '{}';

ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS properties_visited INTEGER[] DEFAULT '{}';

ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS budget_min NUMERIC;

ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS budget_max NUMERIC;

ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS location TEXT;

ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS source VARCHAR(50);

ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS stage VARCHAR(20) DEFAULT 'new';

ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'medium';

ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS notes TEXT;

ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS assigned_to UUID;

ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS converted_at TIMESTAMP;

ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS client_id INTEGER;

-- 2. Now update columns that already exist to ensure they have proper defaults
ALTER TABLE leads 
ALTER COLUMN stage SET DEFAULT 'new';

ALTER TABLE leads 
ALTER COLUMN priority SET DEFAULT 'medium';

-- 3. Add check constraint for interest_type if needed
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'leads_interest_type_check'
    ) THEN
        ALTER TABLE leads 
        ADD CONSTRAINT leads_interest_type_check 
        CHECK (interest_type IN ('buy', 'sell', 'rent', 'lease', 'invest'));
    END IF;
END $$;

-- 4. Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_leads_source ON leads(source);
CREATE INDEX IF NOT EXISTS idx_leads_stage ON leads(stage);
CREATE INDEX IF NOT EXISTS idx_leads_priority ON leads(priority);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_name ON leads(name);
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_phone ON leads(phone);
CREATE INDEX IF NOT EXISTS idx_leads_interest_type ON leads(interest_type);

-- 5. Create or replace the convert_lead_to_client function
CREATE OR REPLACE FUNCTION convert_lead_to_client(p_lead_id INTEGER)
RETURNS JSON AS $$
DECLARE
    v_lead RECORD;
    v_client_id INTEGER;
    v_result JSON;
BEGIN
    -- Get the lead data
    SELECT * INTO v_lead FROM leads WHERE id = p_lead_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Lead with ID % not found', p_lead_id;
    END IF;
    
    IF v_lead.converted_to_client THEN
        RAISE EXCEPTION 'Lead has already been converted to client';
    END IF;
    
    -- Insert into clients table
    INSERT INTO clients (
        lead_id,
        converted_from_lead,
        name,
        email,
        phone,
        client_type,
        client_category,
        status,
        preferred_language,
        budget_min,
        budget_max,
        notes,
        created_at
    ) VALUES (
        p_lead_id,
        true,
        v_lead.name,
        v_lead.email,
        v_lead.phone,
        'individual',
        CASE 
            WHEN v_lead.interest_type = 'buy' THEN 'buyer'
            WHEN v_lead.interest_type = 'sell' THEN 'seller'
            WHEN v_lead.interest_type IN ('rent', 'lease') THEN 'tenant'
            WHEN v_lead.interest_type = 'invest' THEN 'investor'
            ELSE 'buyer'
        END,
        'active',
        COALESCE(v_lead.language_preference, 'en'),
        v_lead.budget_min,
        v_lead.budget_max,
        v_lead.notes,
        NOW()
    ) RETURNING id INTO v_client_id;
    
    -- Update the lead record
    UPDATE leads 
    SET 
        converted_to_client = true,
        converted_at = NOW(),
        client_id = v_client_id
    WHERE id = p_lead_id;
    
    -- Return result
    v_result := json_build_object(
        'success', true,
        'client_id', v_client_id,
        'lead_id', p_lead_id,
        'message', 'Lead successfully converted to client'
    );
    
    RETURN v_result;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error converting lead to client: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- 6. Grant necessary permissions
GRANT EXECUTE ON FUNCTION convert_lead_to_client(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION convert_lead_to_client(INTEGER) TO service_role;

-- 7. Test by inserting a sample lead to verify structure
DO $$
BEGIN
    -- Try to insert a test lead and then delete it
    INSERT INTO leads (
        name,
        email,
        phone,
        source,
        interest_type,
        interested_in,
        budget_min,
        budget_max,
        stage,
        priority,
        notes
    ) VALUES (
        'Test Lead - Delete Me',
        'test@example.com',
        '+1234567890',
        'test',
        'buy',
        'Test Property',
        100000,
        500000,
        'new',
        'low',
        'This is a test lead to verify table structure - should be deleted'
    );
    
    -- Delete the test lead immediately
    DELETE FROM leads WHERE name = 'Test Lead - Delete Me';
    
    RAISE NOTICE 'Lead table structure verified successfully';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error testing lead structure: %', SQLERRM;
END $$;

-- 8. Show the current structure of the leads table for verification
-- Run this separately to see the structure:
-- SELECT column_name, data_type, is_nullable, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'leads' 
-- ORDER BY ordinal_position;