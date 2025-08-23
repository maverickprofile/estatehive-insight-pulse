-- =====================================================
-- FIX LEADS TABLE STRUCTURE
-- =====================================================
-- Ensure leads table has all required fields
-- =====================================================

-- Drop and recreate leads table with correct structure
DROP TABLE IF EXISTS leads CASCADE;

CREATE TABLE leads (
    id SERIAL PRIMARY KEY,
    
    -- Contact Information
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT NOT NULL,
    
    -- Lead Details
    source TEXT, -- website, referral, social_media, cold_call, walk_in, advertisement, other
    property_interest TEXT, -- What they're looking for (e.g., "3BHK Apartment")
    preferred_location TEXT, -- Preferred area/location
    budget TEXT, -- Budget range as text (e.g., "₹80L - ₹1.2Cr")
    budget_min DECIMAL(15,2), -- Minimum budget (numeric)
    budget_max DECIMAL(15,2), -- Maximum budget (numeric)
    
    -- Lead Management
    stage TEXT DEFAULT 'new', -- new, contacted, qualified, proposal, negotiation, closed_won, closed_lost, on_hold
    priority TEXT DEFAULT 'normal', -- low, normal, high, urgent
    status TEXT DEFAULT 'active', -- active, inactive, converted
    
    -- Assignment
    assigned_agent_id TEXT, -- Foreign key to agents table
    agent TEXT, -- Temporary field for compatibility (will be removed later)
    
    -- Additional Information
    notes TEXT,
    property_type_preference TEXT,
    requirements TEXT,
    
    -- Conversion Tracking
    converted_to_client_id INTEGER,
    conversion_date DATE,
    
    -- Communication
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

-- Enable RLS
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can manage leads" ON leads;
DROP POLICY IF EXISTS "Agents can view assigned leads" ON leads;
DROP POLICY IF EXISTS "Agents can update assigned leads" ON leads;
DROP POLICY IF EXISTS "Admins can manage all leads" ON leads;

-- Create simple policy for authenticated users (for now)
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

-- Test insert
DO $$
BEGIN
    INSERT INTO leads (
        name,
        email,
        phone,
        source,
        property_interest,
        preferred_location,
        budget,
        stage,
        priority,
        notes
    ) VALUES (
        'Test Lead',
        'testlead@example.com',
        '+91 9999999999',
        'website',
        '3BHK Apartment',
        'Whitefield',
        '₹80L - ₹1.2Cr',
        'new',
        'normal',
        'Test lead to verify table creation'
    );
    
    -- Delete test lead
    DELETE FROM leads WHERE name = 'Test Lead';
    
    RAISE NOTICE '✅ Leads table created successfully!';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '⚠️ Test insert failed: %', SQLERRM;
END $$;

-- Verify setup
DO $$
DECLARE
    col_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO col_count
    FROM information_schema.columns
    WHERE table_name = 'leads';
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ LEADS TABLE FIXED!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '📊 Total columns: %', col_count;
    RAISE NOTICE '🎯 Ready for lead management';
    RAISE NOTICE '========================================';
END $$;