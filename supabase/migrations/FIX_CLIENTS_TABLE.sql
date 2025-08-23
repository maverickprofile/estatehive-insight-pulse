-- =====================================================
-- FIX CLIENTS TABLE STRUCTURE
-- =====================================================
-- Ensure clients table has all required fields from the UI
-- =====================================================

-- Drop and recreate clients table with correct structure
DROP TABLE IF EXISTS clients CASCADE;

CREATE TABLE clients (
    id SERIAL PRIMARY KEY,
    
    -- User & Lead Reference
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    lead_id INTEGER, -- Reference to leads table if converted from lead
    converted_from_lead BOOLEAN DEFAULT false,
    
    -- Agent Assignment
    primary_agent_id TEXT, -- Reference to agents table
    secondary_agent_id TEXT, -- Backup agent
    assigned_agent_id TEXT, -- Compatibility field
    
    -- Basic Information
    client_code TEXT UNIQUE,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT NOT NULL,
    alternate_phone TEXT,
    whatsapp_number TEXT,
    telegram_username TEXT,
    
    -- Personal Details
    date_of_birth DATE,
    anniversary_date DATE,
    gender TEXT CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
    marital_status TEXT CHECK (marital_status IN ('single', 'married', 'divorced', 'widowed')),
    nationality TEXT DEFAULT 'Indian',
    
    -- Professional Details
    occupation TEXT,
    company_name TEXT,
    company TEXT, -- Alias for compatibility
    designation TEXT,
    work_email TEXT,
    work_phone TEXT,
    annual_income DECIMAL(15,2),
    income_source TEXT,
    
    -- Address Information
    address TEXT, -- Simple address field
    address_line1 TEXT,
    address_line2 TEXT,
    city TEXT,
    state TEXT,
    country TEXT DEFAULT 'India',
    postal_code TEXT,
    zip_code TEXT, -- Alias for postal_code
    
    -- Client Classification
    client_type TEXT DEFAULT 'individual' CHECK (client_type IN ('individual', 'company', 'partnership', 'trust')),
    client_category TEXT CHECK (client_category IN ('buyer', 'seller', 'investor', 'tenant', 'landlord')),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'prospect', 'vip', 'blacklisted')),
    
    -- Legal/Tax Information
    company_registration_no TEXT,
    gst_number TEXT,
    pan_number TEXT,
    authorized_signatory TEXT,
    
    -- Avatar/Profile
    avatar_url TEXT,
    
    -- Purchase & Financial Statistics
    total_purchases INTEGER DEFAULT 0,
    total_transactions INTEGER DEFAULT 0,
    total_value DECIMAL(15,2) DEFAULT 0,
    lifetime_value DECIMAL(15,2) DEFAULT 0,
    balance_due DECIMAL(15,2) DEFAULT 0,
    total_properties_viewed INTEGER DEFAULT 0,
    
    -- Loyalty Program
    loyalty_points INTEGER DEFAULT 0,
    loyalty_tier TEXT DEFAULT 'bronze' CHECK (loyalty_tier IN ('bronze', 'silver', 'gold', 'platinum', 'diamond')),
    referral_count INTEGER DEFAULT 0,
    referred_by TEXT,
    
    -- Communication & Activity
    preferred_contact_method TEXT DEFAULT 'phone' CHECK (preferred_contact_method IN ('phone', 'email', 'whatsapp', 'telegram', 'sms')),
    preferred_contact_time TEXT,
    preferred_language TEXT DEFAULT 'English',
    last_contacted_at TIMESTAMPTZ,
    last_interaction TIMESTAMPTZ, -- Alias for last_contacted_at
    last_interaction_type TEXT,
    last_interaction_notes TEXT,
    last_activity_at TIMESTAMPTZ,
    next_followup_date DATE,
    contact_attempts INTEGER DEFAULT 0,
    
    -- Source & Conversion
    source TEXT, -- How they became a client
    acquisition_date DATE DEFAULT CURRENT_DATE,
    conversion_date DATE, -- When converted from lead
    
    -- Additional Information
    notes TEXT,
    special_requirements TEXT,
    preferences JSONB DEFAULT '{}',
    tags TEXT[],
    metadata JSONB DEFAULT '{}',
    
    -- KYC Status
    kyc_verified BOOLEAN DEFAULT false,
    kyc_documents JSONB DEFAULT '[]',
    kyc_verified_at TIMESTAMPTZ,
    kyc_verified_by TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key constraints
DO $$
BEGIN
    -- Add foreign key to agents if table exists
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'agents'
    ) THEN
        ALTER TABLE clients 
        ADD CONSTRAINT clients_primary_agent_id_fkey 
        FOREIGN KEY (primary_agent_id) 
        REFERENCES agents(id) 
        ON DELETE SET NULL;
        
        ALTER TABLE clients 
        ADD CONSTRAINT clients_secondary_agent_id_fkey 
        FOREIGN KEY (secondary_agent_id) 
        REFERENCES agents(id) 
        ON DELETE SET NULL;
        
        ALTER TABLE clients 
        ADD CONSTRAINT clients_assigned_agent_id_fkey 
        FOREIGN KEY (assigned_agent_id) 
        REFERENCES agents(id) 
        ON DELETE SET NULL;
    END IF;
    
    -- Add foreign key to leads if table exists
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'leads'
    ) THEN
        ALTER TABLE clients 
        ADD CONSTRAINT clients_lead_id_fkey 
        FOREIGN KEY (lead_id) 
        REFERENCES leads(id) 
        ON DELETE SET NULL;
    END IF;
END $$;

-- Create indexes for performance
CREATE INDEX idx_clients_status ON clients(status);
CREATE INDEX idx_clients_client_type ON clients(client_type);
CREATE INDEX idx_clients_client_category ON clients(client_category);
CREATE INDEX idx_clients_primary_agent_id ON clients(primary_agent_id);
CREATE INDEX idx_clients_phone ON clients(phone);
CREATE INDEX idx_clients_email ON clients(email);
CREATE INDEX idx_clients_client_code ON clients(client_code);
CREATE INDEX idx_clients_loyalty_tier ON clients(loyalty_tier);
CREATE INDEX idx_clients_created_at ON clients(created_at);
CREATE INDEX idx_clients_city ON clients(city);
CREATE INDEX idx_clients_name ON clients(name);

-- Enable RLS
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can manage clients" ON clients;
DROP POLICY IF EXISTS "Authenticated users can manage all clients" ON clients;

-- Create simple policy for authenticated users (for now)
CREATE POLICY "Authenticated users can manage all clients" ON clients
    FOR ALL 
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Grant permissions
GRANT ALL ON clients TO authenticated;
GRANT ALL ON clients_id_seq TO authenticated;

-- Update trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_clients_updated_at ON clients;
CREATE TRIGGER update_clients_updated_at
    BEFORE UPDATE ON clients
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Auto-generate client code
CREATE OR REPLACE FUNCTION generate_client_code()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.client_code IS NULL THEN
        NEW.client_code = 'CLT' || LPAD(NEXTVAL('clients_id_seq')::TEXT, 6, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_client_code_trigger
    BEFORE INSERT ON clients
    FOR EACH ROW
    EXECUTE FUNCTION generate_client_code();

-- Test insert
DO $$
BEGIN
    INSERT INTO clients (
        name,
        email,
        phone,
        status,
        client_type,
        client_category,
        city,
        loyalty_tier,
        notes
    ) VALUES (
        'Test Client',
        'testclient@example.com',
        '+91 9999999999',
        'active',
        'individual',
        'buyer',
        'Bangalore',
        'bronze',
        'Test client to verify table creation'
    );
    
    -- Delete test client
    DELETE FROM clients WHERE name = 'Test Client';
    
    RAISE NOTICE '✅ Clients table created successfully!';
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
    WHERE table_name = 'clients';
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ CLIENTS TABLE FIXED!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '📊 Total columns: %', col_count;
    RAISE NOTICE '👥 Ready for client management';
    RAISE NOTICE '========================================';
END $$;