-- =====================================================
-- ESTATE HIVE CRM - COMPLETE DATABASE FIX
-- =====================================================
-- Run this file to fix all table structures
-- Run in Supabase SQL Editor
-- =====================================================

-- Start transaction
BEGIN;

-- =====================================================
-- 1. FIX AGENTS AND RELATIONSHIPS
-- =====================================================
-- Fixing agents table and relationships...

-- Create sequence for agent IDs if not exists
CREATE SEQUENCE IF NOT EXISTS agent_seq START 1;

-- Drop and recreate agents table
DROP TABLE IF EXISTS agents CASCADE;

CREATE TABLE agents (
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

-- =====================================================
-- 2. FIX PROPERTIES TABLE
-- =====================================================
-- Fixing properties table...

-- Already handled by PROPERTIES_TABLE_COMPLETE.sql
-- Run that migration separately if needed

-- =====================================================
-- 3. FIX LEADS TABLE
-- =====================================================
-- STEP: 'Fixing leads table...'

DROP TABLE IF EXISTS leads CASCADE;

CREATE TABLE leads (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT NOT NULL,
    source TEXT,
    property_interest TEXT,
    preferred_location TEXT,
    budget TEXT,
    budget_min DECIMAL(15,2),
    budget_max DECIMAL(15,2),
    stage TEXT DEFAULT 'new',
    priority TEXT DEFAULT 'normal',
    status TEXT DEFAULT 'active',
    assigned_agent_id TEXT,
    agent TEXT, -- Temporary field for compatibility
    notes TEXT,
    property_type_preference TEXT,
    requirements TEXT,
    converted_to_client_id INTEGER,
    conversion_date DATE,
    last_contacted_at TIMESTAMPTZ,
    next_followup_date DATE,
    contact_attempts INTEGER DEFAULT 0,
    tags TEXT[],
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 4. FIX CLIENTS TABLE
-- =====================================================
-- STEP: 'Fixing clients table...'

DROP TABLE IF EXISTS clients CASCADE;

CREATE TABLE clients (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    lead_id INTEGER,
    converted_from_lead BOOLEAN DEFAULT false,
    primary_agent_id TEXT,
    secondary_agent_id TEXT,
    assigned_agent_id TEXT,
    client_code TEXT UNIQUE,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT NOT NULL,
    alternate_phone TEXT,
    whatsapp_number TEXT,
    telegram_username TEXT,
    date_of_birth DATE,
    anniversary_date DATE,
    gender TEXT CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
    marital_status TEXT CHECK (marital_status IN ('single', 'married', 'divorced', 'widowed')),
    nationality TEXT DEFAULT 'Indian',
    occupation TEXT,
    company_name TEXT,
    company TEXT,
    designation TEXT,
    work_email TEXT,
    work_phone TEXT,
    annual_income DECIMAL(15,2),
    income_source TEXT,
    address TEXT,
    address_line1 TEXT,
    address_line2 TEXT,
    city TEXT,
    state TEXT,
    country TEXT DEFAULT 'India',
    postal_code TEXT,
    zip_code TEXT,
    client_type TEXT DEFAULT 'individual',
    client_category TEXT,
    status TEXT DEFAULT 'active',
    company_registration_no TEXT,
    gst_number TEXT,
    pan_number TEXT,
    authorized_signatory TEXT,
    avatar_url TEXT,
    total_purchases INTEGER DEFAULT 0,
    total_transactions INTEGER DEFAULT 0,
    total_value DECIMAL(15,2) DEFAULT 0,
    lifetime_value DECIMAL(15,2) DEFAULT 0,
    balance_due DECIMAL(15,2) DEFAULT 0,
    total_properties_viewed INTEGER DEFAULT 0,
    loyalty_points INTEGER DEFAULT 0,
    loyalty_tier TEXT DEFAULT 'bronze',
    referral_count INTEGER DEFAULT 0,
    referred_by TEXT,
    preferred_contact_method TEXT DEFAULT 'phone',
    preferred_contact_time TEXT,
    preferred_language TEXT DEFAULT 'English',
    last_contacted_at TIMESTAMPTZ,
    last_interaction TIMESTAMPTZ,
    last_interaction_type TEXT,
    last_interaction_notes TEXT,
    last_activity_at TIMESTAMPTZ,
    next_followup_date DATE,
    contact_attempts INTEGER DEFAULT 0,
    source TEXT,
    acquisition_date DATE DEFAULT CURRENT_DATE,
    conversion_date DATE,
    notes TEXT,
    special_requirements TEXT,
    preferences JSONB DEFAULT '{}',
    tags TEXT[],
    metadata JSONB DEFAULT '{}',
    kyc_verified BOOLEAN DEFAULT false,
    kyc_documents JSONB DEFAULT '[]',
    kyc_verified_at TIMESTAMPTZ,
    kyc_verified_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 5. FIX APPOINTMENTS TABLE
-- =====================================================
-- STEP: 'Fixing appointments table...'

DROP TABLE IF EXISTS appointments CASCADE;

CREATE TABLE appointments (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    appointment_type TEXT DEFAULT 'property_viewing',
    property_id INTEGER,
    client_id INTEGER,
    lead_id INTEGER,
    agent_id TEXT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    duration_minutes INTEGER GENERATED ALWAYS AS (
        EXTRACT(EPOCH FROM (end_time - start_time)) / 60
    ) STORED,
    all_day BOOLEAN DEFAULT false,
    location TEXT,
    location_address TEXT,
    location_coordinates POINT,
    meeting_link TEXT,
    status TEXT DEFAULT 'scheduled',
    priority TEXT DEFAULT 'normal',
    attendees TEXT[],
    organizer_id UUID,
    created_by UUID,
    reminder_sent BOOLEAN DEFAULT false,
    reminder_minutes_before INTEGER DEFAULT 30,
    send_email_reminder BOOLEAN DEFAULT true,
    send_sms_reminder BOOLEAN DEFAULT false,
    outcome TEXT,
    outcome_notes TEXT,
    follow_up_required BOOLEAN DEFAULT false,
    follow_up_date DATE,
    notes TEXT,
    agenda TEXT,
    preparation_notes TEXT,
    attachments JSONB DEFAULT '[]',
    color TEXT DEFAULT '#3b82f6',
    is_recurring BOOLEAN DEFAULT false,
    recurrence_pattern TEXT,
    recurrence_end_date DATE,
    parent_appointment_id INTEGER,
    external_id TEXT,
    google_event_id TEXT,
    outlook_event_id TEXT,
    tags TEXT[],
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 6. FIX INVOICES TABLE
-- =====================================================
-- STEP: 'Fixing invoices table...'

DROP TABLE IF EXISTS invoices CASCADE;

CREATE TABLE invoices (
    id SERIAL PRIMARY KEY,
    invoice_number TEXT UNIQUE,
    invoice_code TEXT UNIQUE,
    client_id INTEGER,
    property_id INTEGER,
    agent_id TEXT,
    lead_id INTEGER,
    invoice_type TEXT DEFAULT 'sale',
    invoice_category TEXT,
    issue_date DATE DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    payment_date DATE,
    subtotal DECIMAL(15,2) NOT NULL DEFAULT 0,
    tax_amount DECIMAL(15,2) DEFAULT 0,
    tax_rate DECIMAL(5,2) DEFAULT 18.00,
    discount_amount DECIMAL(15,2) DEFAULT 0,
    discount_percentage DECIMAL(5,2) DEFAULT 0,
    total_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    paid_amount DECIMAL(15,2) DEFAULT 0,
    balance_due DECIMAL(15,2) GENERATED ALWAYS AS (total_amount - paid_amount) STORED,
    currency TEXT DEFAULT 'INR',
    exchange_rate DECIMAL(10,4) DEFAULT 1.0000,
    status TEXT DEFAULT 'draft',
    payment_method TEXT,
    payment_reference TEXT,
    payment_gateway TEXT,
    transaction_id TEXT,
    bank_name TEXT,
    account_number TEXT,
    ifsc_code TEXT,
    upi_id TEXT,
    billing_name TEXT,
    billing_address TEXT,
    billing_city TEXT,
    billing_state TEXT,
    billing_country TEXT DEFAULT 'India',
    billing_postal_code TEXT,
    shipping_name TEXT,
    shipping_address TEXT,
    shipping_city TEXT,
    shipping_state TEXT,
    shipping_country TEXT DEFAULT 'India',
    shipping_postal_code TEXT,
    items JSONB DEFAULT '[]',
    additional_charges JSONB DEFAULT '[]',
    notes TEXT,
    internal_notes TEXT,
    terms_conditions TEXT,
    signature_url TEXT,
    signed_by TEXT,
    signed_at TIMESTAMPTZ,
    requires_approval BOOLEAN DEFAULT false,
    approved_by TEXT,
    approved_at TIMESTAMPTZ,
    approval_notes TEXT,
    reminder_sent BOOLEAN DEFAULT false,
    reminder_count INTEGER DEFAULT 0,
    last_reminder_date DATE,
    next_reminder_date DATE,
    sent_to_email TEXT,
    sent_at TIMESTAMPTZ,
    viewed_at TIMESTAMPTZ,
    attachments JSONB DEFAULT '[]',
    is_recurring BOOLEAN DEFAULT false,
    recurrence_pattern TEXT,
    recurrence_end_date DATE,
    parent_invoice_id INTEGER,
    external_id TEXT,
    quickbooks_id TEXT,
    tally_id TEXT,
    tags TEXT[],
    metadata JSONB DEFAULT '{}',
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ADD ALL FOREIGN KEY CONSTRAINTS
-- =====================================================
-- STEP: 'Adding foreign key constraints...'

DO $$
BEGIN
    -- Agents foreign keys to properties
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'properties_agent_id_fkey'
    ) THEN
        ALTER TABLE properties 
        ADD CONSTRAINT properties_agent_id_fkey 
        FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE SET NULL;
    END IF;
    
    -- Leads foreign keys
    ALTER TABLE leads 
    ADD CONSTRAINT leads_assigned_agent_id_fkey 
    FOREIGN KEY (assigned_agent_id) REFERENCES agents(id) ON DELETE SET NULL;
    
    -- Clients foreign keys
    ALTER TABLE clients 
    ADD CONSTRAINT clients_primary_agent_id_fkey 
    FOREIGN KEY (primary_agent_id) REFERENCES agents(id) ON DELETE SET NULL;
    
    ALTER TABLE clients 
    ADD CONSTRAINT clients_secondary_agent_id_fkey 
    FOREIGN KEY (secondary_agent_id) REFERENCES agents(id) ON DELETE SET NULL;
    
    ALTER TABLE clients 
    ADD CONSTRAINT clients_assigned_agent_id_fkey 
    FOREIGN KEY (assigned_agent_id) REFERENCES agents(id) ON DELETE SET NULL;
    
    ALTER TABLE clients 
    ADD CONSTRAINT clients_lead_id_fkey 
    FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE SET NULL;
    
    -- Appointments foreign keys
    ALTER TABLE appointments 
    ADD CONSTRAINT appointments_property_id_fkey 
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE SET NULL;
    
    ALTER TABLE appointments 
    ADD CONSTRAINT appointments_client_id_fkey 
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;
    
    ALTER TABLE appointments 
    ADD CONSTRAINT appointments_lead_id_fkey 
    FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE;
    
    ALTER TABLE appointments 
    ADD CONSTRAINT appointments_agent_id_fkey 
    FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE SET NULL;
    
    ALTER TABLE appointments 
    ADD CONSTRAINT appointments_parent_appointment_id_fkey 
    FOREIGN KEY (parent_appointment_id) REFERENCES appointments(id) ON DELETE CASCADE;
    
    -- Invoices foreign keys
    ALTER TABLE invoices 
    ADD CONSTRAINT invoices_client_id_fkey 
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;
    
    ALTER TABLE invoices 
    ADD CONSTRAINT invoices_property_id_fkey 
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE SET NULL;
    
    ALTER TABLE invoices 
    ADD CONSTRAINT invoices_agent_id_fkey 
    FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE SET NULL;
    
    ALTER TABLE invoices 
    ADD CONSTRAINT invoices_lead_id_fkey 
    FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE SET NULL;
    
    ALTER TABLE invoices 
    ADD CONSTRAINT invoices_parent_invoice_id_fkey 
    FOREIGN KEY (parent_invoice_id) REFERENCES invoices(id) ON DELETE CASCADE;
END $$;

-- =====================================================
-- CREATE ALL INDEXES
-- =====================================================
-- STEP: 'Creating indexes...'

-- Leads indexes
CREATE INDEX idx_leads_stage ON leads(stage);
CREATE INDEX idx_leads_priority ON leads(priority);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_assigned_agent_id ON leads(assigned_agent_id);
CREATE INDEX idx_leads_phone ON leads(phone);
CREATE INDEX idx_leads_email ON leads(email);
CREATE INDEX idx_leads_created_at ON leads(created_at);

-- Clients indexes
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

-- Appointments indexes
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_appointment_type ON appointments(appointment_type);
CREATE INDEX idx_appointments_property_id ON appointments(property_id);
CREATE INDEX idx_appointments_client_id ON appointments(client_id);
CREATE INDEX idx_appointments_agent_id ON appointments(agent_id);
CREATE INDEX idx_appointments_start_time ON appointments(start_time);
CREATE INDEX idx_appointments_end_time ON appointments(end_time);
CREATE INDEX idx_appointments_created_by ON appointments(created_by);
CREATE INDEX idx_appointments_created_at ON appointments(created_at);

-- Invoices indexes
CREATE INDEX idx_invoices_invoice_number ON invoices(invoice_number);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_client_id ON invoices(client_id);
CREATE INDEX idx_invoices_property_id ON invoices(property_id);
CREATE INDEX idx_invoices_agent_id ON invoices(agent_id);
CREATE INDEX idx_invoices_invoice_type ON invoices(invoice_type);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);
CREATE INDEX idx_invoices_created_at ON invoices(created_at);
CREATE INDEX idx_invoices_created_by ON invoices(created_by);

-- =====================================================
-- ENABLE RLS AND CREATE POLICIES
-- =====================================================
-- STEP: 'Enabling RLS and creating policies...'

-- Enable RLS on all tables
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Create simple policies for authenticated users
CREATE POLICY "Authenticated users can manage agents" ON agents
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can manage all leads" ON leads
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can manage all clients" ON clients
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can manage all appointments" ON appointments
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can manage all invoices" ON invoices
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================
-- STEP: 'Granting permissions...'

-- Grant all permissions to authenticated users
GRANT ALL ON agents TO authenticated;
GRANT ALL ON leads TO authenticated;
GRANT ALL ON clients TO authenticated;
GRANT ALL ON appointments TO authenticated;
GRANT ALL ON invoices TO authenticated;

-- Grant sequence permissions
GRANT ALL ON agent_seq TO authenticated;
GRANT ALL ON leads_id_seq TO authenticated;
GRANT ALL ON clients_id_seq TO authenticated;
GRANT ALL ON appointments_id_seq TO authenticated;
GRANT ALL ON invoices_id_seq TO authenticated;

-- =====================================================
-- CREATE TRIGGERS
-- =====================================================
-- STEP: 'Creating triggers...'

-- Update trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update triggers to all tables
CREATE TRIGGER update_agents_updated_at
    BEFORE UPDATE ON agents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leads_updated_at
    BEFORE UPDATE ON leads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at
    BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at
    BEFORE UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at
    BEFORE UPDATE ON invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- INSERT TEST DATA
-- =====================================================
-- STEP: 'Inserting test data...'

-- Insert a default agent
INSERT INTO agents (name, email, phone, is_active, is_verified)
VALUES ('Default Agent', 'agent@estatehive.com', '+91 9999999999', true, true)
ON CONFLICT (email) DO NOTHING;

-- Commit transaction
COMMIT;

-- =====================================================
-- VERIFY SETUP
-- =====================================================
-- STEP: '';
-- STEP: '========================================';
-- STEP: '✅ ALL TABLES FIXED SUCCESSFULLY!';
-- STEP: '========================================';
-- STEP: 'Tables created/fixed:';
-- STEP: '  - agents';
-- STEP: '  - properties (run PROPERTIES_TABLE_COMPLETE.sql separately)';
-- STEP: '  - leads';
-- STEP: '  - clients';
-- STEP: '  - appointments';
-- STEP: '  - invoices';
-- STEP: '========================================';
-- STEP: 'Next steps:';
-- STEP: '1. Run PROPERTIES_TABLE_COMPLETE.sql if not already done';
-- STEP: '2. Test creating records in each module';
-- STEP: '3. Verify all forms work correctly';
-- STEP: '========================================';