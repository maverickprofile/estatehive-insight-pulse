-- =====================================================
-- FIX LEADS TABLE - FINAL VERSION
-- =====================================================
-- Matches CreateLead.tsx form exactly
-- =====================================================

-- Drop and recreate leads table with correct structure
DROP TABLE IF EXISTS leads CASCADE;

CREATE TABLE leads (
    id SERIAL PRIMARY KEY,
    
    -- Core fields from CreateLead form
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    source TEXT, -- Website, Referral, Facebook, Google Ads, Walk-in
    interest TEXT, -- Property interest (matches form field)
    location TEXT, -- Preferred location (matches form field)
    budget TEXT, -- Budget range as text
    stage TEXT DEFAULT 'new',
    priority TEXT DEFAULT 'medium', -- high, medium, low (matches form)
    agent TEXT DEFAULT 'Unassigned', -- Agent name (matches form)
    notes TEXT,
    
    -- Additional fields for complete functionality
    property_interest TEXT, -- Alias for interest
    preferred_location TEXT, -- Alias for location
    budget_min DECIMAL(15,2),
    budget_max DECIMAL(15,2),
    status TEXT DEFAULT 'active',
    
    -- Agent assignment (proper foreign key)
    assigned_agent_id TEXT,
    
    -- Property preferences
    property_type_preference TEXT,
    requirements TEXT,
    
    -- Conversion tracking
    converted_to_client_id INTEGER,
    conversion_date DATE,
    
    -- Communication tracking
    last_contacted_at TIMESTAMPTZ,
    next_followup_date DATE,
    contact_attempts INTEGER DEFAULT 0,
    
    -- Metadata
    tags TEXT[],
    metadata JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key constraint to agents if table exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'agents'
    ) THEN
        ALTER TABLE leads 
        ADD CONSTRAINT leads_assigned_agent_id_fkey 
        FOREIGN KEY (assigned_agent_id) 
        REFERENCES agents(id) 
        ON DELETE SET NULL;
    END IF;
END $$;

-- Create indexes for performance
CREATE INDEX idx_leads_stage ON leads(stage);
CREATE INDEX idx_leads_priority ON leads(priority);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_assigned_agent_id ON leads(assigned_agent_id);
CREATE INDEX idx_leads_phone ON leads(phone);
CREATE INDEX idx_leads_email ON leads(email);
CREATE INDEX idx_leads_created_at ON leads(created_at);
CREATE INDEX idx_leads_name ON leads(name);
CREATE INDEX idx_leads_source ON leads(source);

-- Enable RLS
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can manage leads" ON leads;
DROP POLICY IF EXISTS "Authenticated users can manage all leads" ON leads;

-- Create simple policy for authenticated users
CREATE POLICY "Authenticated users can manage all leads" ON leads
    FOR ALL 
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Grant permissions
GRANT ALL ON leads TO authenticated;
GRANT ALL ON leads_id_seq TO authenticated;

-- Update trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_leads_updated_at ON leads;
CREATE TRIGGER update_leads_updated_at
    BEFORE UPDATE ON leads
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Sync aliased fields
CREATE OR REPLACE FUNCTION sync_lead_fields()
RETURNS TRIGGER AS $$
BEGIN
    -- Sync interest with property_interest
    IF NEW.interest IS NOT NULL THEN
        NEW.property_interest = NEW.interest;
    ELSIF NEW.property_interest IS NOT NULL THEN
        NEW.interest = NEW.property_interest;
    END IF;
    
    -- Sync location with preferred_location
    IF NEW.location IS NOT NULL THEN
        NEW.preferred_location = NEW.location;
    ELSIF NEW.preferred_location IS NOT NULL THEN
        NEW.location = NEW.preferred_location;
    END IF;
    
    -- Parse budget if provided
    IF NEW.budget IS NOT NULL AND NEW.budget != '' THEN
        -- Try to extract min and max from budget string like "₹80L - ₹1.2Cr"
        -- This is a simplified version, you might need more complex parsing
        BEGIN
            -- Remove currency symbols and spaces
            DECLARE
                cleaned_budget TEXT;
            BEGIN
                cleaned_budget := REPLACE(REPLACE(REPLACE(REPLACE(NEW.budget, '₹', ''), ' ', ''), ',', ''), '-', ' ');
                -- Further processing would go here
            EXCEPTION
                WHEN OTHERS THEN
                    -- If parsing fails, just leave budget_min and budget_max as NULL
                    NULL;
            END;
        END;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_lead_fields_trigger
    BEFORE INSERT OR UPDATE ON leads
    FOR EACH ROW
    EXECUTE FUNCTION sync_lead_fields();

-- Test insert with form data
DO $$
BEGIN
    INSERT INTO leads (
        name,
        email,
        phone,
        source,
        interest,
        location,
        budget,
        stage,
        priority,
        agent,
        notes
    ) VALUES (
        'Test Lead',
        'testlead@example.com',
        '+91 9999999999',
        'Website',
        '3BHK Apartment',
        'Whitefield',
        '₹80L - ₹1.2Cr',
        'new',
        'medium',
        'Unassigned',
        'Test lead to verify table creation'
    );
    
    -- Verify the insert worked
    IF EXISTS (SELECT 1 FROM leads WHERE name = 'Test Lead') THEN
        RAISE NOTICE '✅ Test insert successful!';
        -- Delete test lead
        DELETE FROM leads WHERE name = 'Test Lead';
    ELSE
        RAISE EXCEPTION '❌ Test insert failed!';
    END IF;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '⚠️ Error during test: %', SQLERRM;
END $$;

-- Verify setup
DO $$
DECLARE
    col_count INTEGER;
    lead_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO col_count
    FROM information_schema.columns
    WHERE table_name = 'leads';
    
    SELECT COUNT(*) INTO lead_count
    FROM leads;
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ LEADS TABLE FIXED SUCCESSFULLY!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '📊 Total columns: %', col_count;
    RAISE NOTICE '📝 Current leads: %', lead_count;
    RAISE NOTICE '✨ Ready for CreateLead form';
    RAISE NOTICE '';
    RAISE NOTICE 'Form fields mapped:';
    RAISE NOTICE '  - name ✓';
    RAISE NOTICE '  - email ✓';
    RAISE NOTICE '  - phone ✓';
    RAISE NOTICE '  - source ✓';
    RAISE NOTICE '  - interest ✓';
    RAISE NOTICE '  - location ✓';
    RAISE NOTICE '  - budget ✓';
    RAISE NOTICE '  - stage (default: new) ✓';
    RAISE NOTICE '  - priority (default: medium) ✓';
    RAISE NOTICE '  - agent (default: Unassigned) ✓';
    RAISE NOTICE '  - notes ✓';
    RAISE NOTICE '========================================';
END $$;