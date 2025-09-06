-- Fix leads table structure for proper lead creation
-- This migration ensures all required fields exist and have proper defaults

-- 1. Add missing columns if they don't exist
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS interested_in TEXT;

ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS location_preference TEXT[] DEFAULT '{}';

-- 2. Ensure source column accepts all required values
-- First check if any constraint exists on source column
DO $$ 
BEGIN
    -- Drop any existing check constraint on source column
    ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_source_check;
    
    -- No need for a check constraint - keep it flexible for various sources
    -- The application will handle validation
END $$;

-- 3. Set default values for critical fields to prevent insertion errors
ALTER TABLE leads 
ALTER COLUMN interest_type SET DEFAULT 'buy';

ALTER TABLE leads 
ALTER COLUMN stage SET DEFAULT 'new';

ALTER TABLE leads 
ALTER COLUMN priority SET DEFAULT 'medium';

ALTER TABLE leads 
ALTER COLUMN score SET DEFAULT 0;

ALTER TABLE leads 
ALTER COLUMN followup_count SET DEFAULT 0;

ALTER TABLE leads 
ALTER COLUMN site_visits_count SET DEFAULT 0;

ALTER TABLE leads 
ALTER COLUMN converted_to_client SET DEFAULT false;

ALTER TABLE leads 
ALTER COLUMN language_preference SET DEFAULT 'en';

-- 4. Ensure property_type and property_subtype arrays have defaults
ALTER TABLE leads 
ALTER COLUMN property_type SET DEFAULT '{}';

ALTER TABLE leads 
ALTER COLUMN property_subtype SET DEFAULT '{}';

ALTER TABLE leads 
ALTER COLUMN preferred_cities SET DEFAULT '{}';

ALTER TABLE leads 
ALTER COLUMN preferred_neighborhoods SET DEFAULT '{}';

ALTER TABLE leads 
ALTER COLUMN preferred_amenities SET DEFAULT '{}';

ALTER TABLE leads 
ALTER COLUMN properties_visited SET DEFAULT '{}';

ALTER TABLE leads 
ALTER COLUMN tags SET DEFAULT '{}';

-- 5. Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_leads_source ON leads(source);
CREATE INDEX IF NOT EXISTS idx_leads_stage ON leads(stage);
CREATE INDEX IF NOT EXISTS idx_leads_priority ON leads(priority);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_name ON leads(name);
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_phone ON leads(phone);

-- 6. Create the convert_lead_to_client function if it doesn't exist
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
        alternate_phone,
        whatsapp_number,
        telegram_username,
        date_of_birth,
        occupation,
        company_name,
        annual_income,
        address_line1,
        city,
        state,
        country,
        client_type,
        client_category,
        status,
        preferred_contact_method,
        preferred_contact_time,
        preferred_language,
        interested_property_types,
        preferred_locations,
        budget_min,
        budget_max,
        notes,
        tags,
        created_at
    ) VALUES (
        p_lead_id,
        true,
        v_lead.name,
        v_lead.email,
        v_lead.phone,
        v_lead.alternate_phone,
        v_lead.whatsapp_number,
        v_lead.telegram_username,
        v_lead.date_of_birth,
        v_lead.occupation,
        v_lead.company_name,
        v_lead.annual_income,
        v_lead.location,
        v_lead.preferred_cities[1],
        NULL,
        'India',
        'individual',
        CASE 
            WHEN v_lead.interest_type = 'buy' THEN 'buyer'
            WHEN v_lead.interest_type = 'sell' THEN 'seller'
            WHEN v_lead.interest_type IN ('rent', 'lease') THEN 'tenant'
            WHEN v_lead.interest_type = 'invest' THEN 'investor'
            ELSE 'buyer'
        END,
        'active',
        v_lead.preferred_contact_method,
        v_lead.preferred_contact_time,
        v_lead.language_preference,
        v_lead.property_type,
        v_lead.location_preference,
        v_lead.budget_min,
        v_lead.budget_max,
        v_lead.notes,
        v_lead.tags,
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
END;
$$ LANGUAGE plpgsql;

-- 7. Grant necessary permissions
GRANT EXECUTE ON FUNCTION convert_lead_to_client(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION convert_lead_to_client(INTEGER) TO service_role;

-- 8. Refresh the schema cache
NOTIFY pgrst, 'reload schema';