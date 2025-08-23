-- =====================================================
-- FIX AGENTS TABLE AND RELATIONSHIPS
-- =====================================================
-- Create agents table and fix foreign key relationships
-- =====================================================

-- Create sequence for agent IDs if not exists
CREATE SEQUENCE IF NOT EXISTS agent_seq START 1;

-- Create agents table if not exists
CREATE TABLE IF NOT EXISTS agents (
    id TEXT PRIMARY KEY DEFAULT 'AGT' || LPAD(NEXTVAL('agent_seq')::TEXT, 6, '0'),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT NOT NULL,
    avatar_url TEXT,
    location TEXT,
    specialization TEXT[],
    specialties TEXT[],
    service_areas TEXT[],
    experience_years INTEGER,
    bio TEXT,
    commission_rate DECIMAL(5,2),
    rating DECIMAL(3,2),
    total_sales INTEGER DEFAULT 0,
    total_revenue DECIMAL(15,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    license_number TEXT,
    joined_date DATE DEFAULT CURRENT_DATE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key constraint to properties table if agents table exists
DO $$
BEGIN
    -- Check if agent_id column exists in properties
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'properties' AND column_name = 'agent_id'
    ) THEN
        ALTER TABLE properties ADD COLUMN agent_id TEXT;
    END IF;
    
    -- Add foreign key constraint if not exists
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_type = 'FOREIGN KEY'
        AND table_name = 'properties'
        AND constraint_name = 'properties_agent_id_fkey'
    ) THEN
        ALTER TABLE properties 
        ADD CONSTRAINT properties_agent_id_fkey 
        FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Create other necessary tables if they don't exist

-- Leads table
CREATE TABLE IF NOT EXISTS leads (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT NOT NULL,
    source TEXT,
    stage TEXT DEFAULT 'new',
    priority TEXT DEFAULT 'normal',
    interested_in TEXT,
    budget_min DECIMAL(15,2),
    budget_max DECIMAL(15,2),
    preferred_location TEXT,
    property_type_preference TEXT,
    notes TEXT,
    assigned_agent_id TEXT REFERENCES agents(id) ON DELETE SET NULL,
    converted_to_client_id INTEGER,
    conversion_date DATE,
    last_contacted_at TIMESTAMPTZ,
    next_followup_date DATE,
    tags TEXT[],
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Clients table
CREATE TABLE IF NOT EXISTS clients (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT NOT NULL,
    alternate_phone TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    country TEXT DEFAULT 'India',
    zip_code TEXT,
    client_type TEXT,
    status TEXT DEFAULT 'active',
    source TEXT,
    assigned_agent_id TEXT REFERENCES agents(id) ON DELETE SET NULL,
    total_transactions INTEGER DEFAULT 0,
    total_value DECIMAL(15,2) DEFAULT 0,
    balance_due DECIMAL(15,2) DEFAULT 0,
    preferred_contact_method TEXT,
    notes TEXT,
    tags TEXT[],
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Appointments table
CREATE TABLE IF NOT EXISTS appointments (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    appointment_type TEXT,
    property_id INTEGER REFERENCES properties(id) ON DELETE SET NULL,
    client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
    lead_id INTEGER REFERENCES leads(id) ON DELETE CASCADE,
    agent_id TEXT REFERENCES agents(id) ON DELETE SET NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    duration_minutes INTEGER,
    location TEXT,
    status TEXT DEFAULT 'scheduled',
    reminder_sent BOOLEAN DEFAULT false,
    notes TEXT,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invoices table
CREATE TABLE IF NOT EXISTS invoices (
    id SERIAL PRIMARY KEY,
    invoice_number TEXT UNIQUE,
    client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
    property_id INTEGER REFERENCES properties(id) ON DELETE SET NULL,
    agent_id TEXT REFERENCES agents(id) ON DELETE SET NULL,
    invoice_type TEXT,
    issue_date DATE DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    subtotal DECIMAL(15,2) NOT NULL,
    tax_amount DECIMAL(15,2) DEFAULT 0,
    discount_amount DECIMAL(15,2) DEFAULT 0,
    total_amount DECIMAL(15,2) NOT NULL,
    paid_amount DECIMAL(15,2) DEFAULT 0,
    balance_due DECIMAL(15,2) DEFAULT 0,
    status TEXT DEFAULT 'draft',
    payment_method TEXT,
    payment_date DATE,
    notes TEXT,
    terms_conditions TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Simple RLS policies for testing (allow all for authenticated users)
CREATE POLICY "Authenticated users can manage agents" ON agents
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can manage leads" ON leads
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can manage clients" ON clients
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can manage appointments" ON appointments
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can manage invoices" ON invoices
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Grant permissions
GRANT ALL ON agents TO authenticated;
GRANT ALL ON leads TO authenticated;
GRANT ALL ON clients TO authenticated;
GRANT ALL ON appointments TO authenticated;
GRANT ALL ON invoices TO authenticated;

GRANT ALL ON agent_seq TO authenticated;
GRANT ALL ON leads_id_seq TO authenticated;
GRANT ALL ON clients_id_seq TO authenticated;
GRANT ALL ON appointments_id_seq TO authenticated;
GRANT ALL ON invoices_id_seq TO authenticated;

-- Insert a sample agent for testing
INSERT INTO agents (name, email, phone, is_active, is_verified)
VALUES ('Default Agent', 'agent@estatehive.com', '+91 9999999999', true, true)
ON CONFLICT (email) DO NOTHING;

-- Update trigger for agents
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_agents_updated_at ON agents;
CREATE TRIGGER update_agents_updated_at
    BEFORE UPDATE ON agents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Verify the setup
DO $$
DECLARE
    agents_count INTEGER;
    properties_count INTEGER;
    has_fk BOOLEAN;
BEGIN
    -- Count agents
    SELECT COUNT(*) INTO agents_count FROM agents;
    
    -- Count properties
    SELECT COUNT(*) INTO properties_count FROM properties;
    
    -- Check foreign key exists
    SELECT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_type = 'FOREIGN KEY'
        AND table_name = 'properties'
        AND constraint_name = 'properties_agent_id_fkey'
    ) INTO has_fk;
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ RELATIONSHIPS FIXED!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '👥 Agents table: % records', agents_count;
    RAISE NOTICE '🏠 Properties table: % records', properties_count;
    RAISE NOTICE '🔗 Foreign key exists: %', has_fk;
    RAISE NOTICE '========================================';
END $$;