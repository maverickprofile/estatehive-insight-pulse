-- =====================================================
-- ESTATE HIVE CRM - COMPLETE DATABASE SETUP
-- =====================================================
-- Version: 1.0.0
-- Description: Complete database schema with authentication,
--              business entities, and security features
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- AUTHENTICATION & USER MANAGEMENT
-- =====================================================

-- User profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    phone TEXT,
    avatar_url TEXT,
    role TEXT CHECK (role IN ('admin', 'agent', 'user', 'owner', 'builder')) DEFAULT 'user',
    department TEXT,
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    phone_verified BOOLEAN DEFAULT false,
    last_login TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- OTP verification table
CREATE TABLE IF NOT EXISTS auth_otps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    phone TEXT NOT NULL,
    otp_code TEXT NOT NULL,
    purpose TEXT CHECK (purpose IN ('login', 'verification', 'password_reset')),
    expires_at TIMESTAMPTZ NOT NULL,
    used BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email verification tokens
CREATE TABLE IF NOT EXISTS email_verification_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- OAuth connections (LinkedIn, Google, etc.)
CREATE TABLE IF NOT EXISTS oauth_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    provider TEXT NOT NULL CHECK (provider IN ('linkedin', 'google', 'facebook')),
    provider_user_id TEXT NOT NULL,
    access_token TEXT,
    refresh_token TEXT,
    expires_at TIMESTAMPTZ,
    profile_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(provider, provider_user_id)
);

-- Session management
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    session_token TEXT UNIQUE NOT NULL,
    ip_address INET,
    user_agent TEXT,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- CORE BUSINESS ENTITIES
-- =====================================================

-- Create sequence for agent IDs
CREATE SEQUENCE IF NOT EXISTS agent_seq START 1;

-- Agents table
CREATE TABLE IF NOT EXISTS agents (
    id TEXT PRIMARY KEY DEFAULT 'AGT' || LPAD(NEXTVAL('agent_seq')::TEXT, 6, '0'),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT NOT NULL,
    location TEXT,
    specialization TEXT[],
    experience_years INTEGER,
    bio TEXT,
    commission_rate DECIMAL(5,2),
    rating DECIMAL(3,2),
    total_sales INTEGER DEFAULT 0,
    total_revenue DECIMAL(15,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    avatar_url TEXT,
    license_number TEXT,
    joined_date DATE DEFAULT CURRENT_DATE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Properties table with all fields from AddProperty form
CREATE TABLE IF NOT EXISTS properties (
    id SERIAL PRIMARY KEY,
    -- Basic Information
    title TEXT NOT NULL,
    description TEXT,
    property_type TEXT CHECK (property_type IN ('residential', 'commercial', 'land', 'industrial', 'agricultural', 'mixed_use')),
    status TEXT CHECK (status IN ('draft', 'active', 'pending', 'under_contract', 'sold', 'rented', 'inactive', 'expired')) DEFAULT 'draft',
    
    -- Location Details
    address TEXT,
    city TEXT,
    state TEXT,
    country TEXT DEFAULT 'India',
    zip_code TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    landmark TEXT,
    
    -- Pricing Information
    price DECIMAL(15,2),
    price_per_sqft DECIMAL(10,2),
    maintenance_charge DECIMAL(10,2),
    booking_amount DECIMAL(15,2),
    is_negotiable BOOLEAN DEFAULT false,
    
    -- Property Specifications
    area_sqft DECIMAL(10,2),
    area_sqm DECIMAL(10,2),
    plot_area DECIMAL(10,2),
    built_up_area DECIMAL(10,2),
    carpet_area DECIMAL(10,2),
    super_built_up_area DECIMAL(10,2),
    
    -- Room Details
    bedrooms INTEGER,
    bathrooms INTEGER,
    balconies INTEGER,
    total_floors INTEGER,
    floor_number INTEGER,
    parking_spaces INTEGER,
    
    -- Property Features
    furnished_status TEXT CHECK (furnished_status IN ('unfurnished', 'semi_furnished', 'fully_furnished')),
    facing_direction TEXT CHECK (facing_direction IN ('north', 'south', 'east', 'west', 'north_east', 'north_west', 'south_east', 'south_west')),
    age_of_property INTEGER,
    year_built INTEGER,
    possession_status TEXT CHECK (possession_status IN ('ready_to_move', 'under_construction', 'new_launch')),
    possession_date DATE,
    
    -- Amenities (stored as array)
    amenities TEXT[],
    
    -- Images and Documents
    images TEXT[],
    floor_plan_url TEXT,
    brochure_url TEXT,
    video_url TEXT,
    virtual_tour_url TEXT,
    
    -- Ownership and Assignment
    owner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    agent_id TEXT REFERENCES agents(id) ON DELETE SET NULL,
    builder_name TEXT,
    project_name TEXT,
    
    -- Additional Details
    property_tax DECIMAL(10,2),
    hoa_fees DECIMAL(10,2),
    utilities_included TEXT[],
    pet_friendly BOOLEAN DEFAULT false,
    
    -- RERA Details
    rera_id TEXT,
    rera_approved BOOLEAN DEFAULT false,
    
    -- SEO and Marketing
    slug TEXT UNIQUE,
    meta_title TEXT,
    meta_description TEXT,
    tags TEXT[],
    featured BOOLEAN DEFAULT false,
    views_count INTEGER DEFAULT 0,
    inquiries_count INTEGER DEFAULT 0,
    
    -- Timestamps
    listed_date DATE DEFAULT CURRENT_DATE,
    sold_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Leads table
CREATE TABLE IF NOT EXISTS leads (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT NOT NULL,
    source TEXT CHECK (source IN ('website', 'referral', 'social_media', 'cold_call', 'walk_in', 'advertisement', 'other')),
    stage TEXT CHECK (stage IN ('new', 'contacted', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost', 'on_hold')) DEFAULT 'new',
    priority TEXT CHECK (priority IN ('low', 'normal', 'high', 'urgent')) DEFAULT 'normal',
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
    client_type TEXT CHECK (client_type IN ('buyer', 'seller', 'tenant', 'landlord', 'investor')),
    status TEXT CHECK (status IN ('active', 'inactive', 'prospect', 'vip', 'blacklisted')) DEFAULT 'active',
    source TEXT,
    assigned_agent_id TEXT REFERENCES agents(id) ON DELETE SET NULL,
    total_transactions INTEGER DEFAULT 0,
    total_value DECIMAL(15,2) DEFAULT 0,
    balance_due DECIMAL(15,2) DEFAULT 0,
    preferred_contact_method TEXT CHECK (preferred_contact_method IN ('phone', 'email', 'whatsapp', 'sms')),
    notes TEXT,
    tags TEXT[],
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- COMMUNICATION & MESSAGING
-- =====================================================

-- Conversations table
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
    lead_id INTEGER REFERENCES leads(id) ON DELETE CASCADE,
    agent_id TEXT REFERENCES agents(id) ON DELETE SET NULL,
    platform TEXT CHECK (platform IN ('whatsapp', 'telegram', 'sms', 'email', 'instagram', 'facebook', 'internal')) DEFAULT 'internal',
    platform_conversation_id TEXT,
    status TEXT CHECK (status IN ('active', 'archived', 'closed')) DEFAULT 'active',
    last_message_at TIMESTAMPTZ,
    unread_count INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT conversation_participant CHECK (client_id IS NOT NULL OR lead_id IS NOT NULL)
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    sender_type TEXT CHECK (sender_type IN ('agent', 'client', 'lead', 'system')),
    sender_id TEXT,
    message_type TEXT CHECK (message_type IN ('text', 'image', 'video', 'audio', 'document', 'location', 'contact', 'template')) DEFAULT 'text',
    content TEXT,
    media_url TEXT,
    platform_message_id TEXT,
    status TEXT CHECK (status IN ('pending', 'sent', 'delivered', 'read', 'failed')) DEFAULT 'sent',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- OPERATIONS & TRANSACTIONS
-- =====================================================

-- Appointments table
CREATE TABLE IF NOT EXISTS appointments (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    appointment_type TEXT CHECK (appointment_type IN ('property_viewing', 'consultation', 'follow_up', 'closing', 'inspection', 'maintenance')),
    property_id INTEGER REFERENCES properties(id) ON DELETE SET NULL,
    client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
    lead_id INTEGER REFERENCES leads(id) ON DELETE CASCADE,
    agent_id TEXT REFERENCES agents(id) ON DELETE SET NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    duration_minutes INTEGER,
    location TEXT,
    status TEXT CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show')) DEFAULT 'scheduled',
    reminder_sent BOOLEAN DEFAULT false,
    notes TEXT,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create sequence for invoice numbers
CREATE SEQUENCE IF NOT EXISTS invoice_seq START 1;

-- Invoices table
CREATE TABLE IF NOT EXISTS invoices (
    id SERIAL PRIMARY KEY,
    invoice_number TEXT UNIQUE NOT NULL DEFAULT 'INV' || TO_CHAR(NOW(), 'YYYYMM') || LPAD(NEXTVAL('invoice_seq')::TEXT, 5, '0'),
    client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
    property_id INTEGER REFERENCES properties(id) ON DELETE SET NULL,
    agent_id TEXT REFERENCES agents(id) ON DELETE SET NULL,
    invoice_type TEXT CHECK (invoice_type IN ('booking', 'commission', 'service', 'consultation', 'maintenance', 'other')),
    issue_date DATE DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    subtotal DECIMAL(15,2) NOT NULL,
    tax_amount DECIMAL(15,2) DEFAULT 0,
    discount_amount DECIMAL(15,2) DEFAULT 0,
    total_amount DECIMAL(15,2) NOT NULL,
    paid_amount DECIMAL(15,2) DEFAULT 0,
    balance_due DECIMAL(15,2) DEFAULT 0,
    status TEXT CHECK (status IN ('draft', 'sent', 'paid', 'partial', 'overdue', 'cancelled')) DEFAULT 'draft',
    payment_method TEXT,
    payment_date DATE,
    notes TEXT,
    terms_conditions TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invoice items table
CREATE TABLE IF NOT EXISTS invoice_items (
    id SERIAL PRIMARY KEY,
    invoice_id INTEGER REFERENCES invoices(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    quantity DECIMAL(10,2) DEFAULT 1,
    unit_price DECIMAL(15,2) NOT NULL,
    amount DECIMAL(15,2),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    type TEXT CHECK (type IN ('info', 'success', 'warning', 'error', 'alert')) DEFAULT 'info',
    title TEXT NOT NULL,
    message TEXT,
    action_url TEXT,
    is_read BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- AUDIT & LOGGING
-- =====================================================

-- Audit log table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Profile indexes
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_phone ON profiles(phone);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_active ON profiles(is_active);

-- Property indexes
CREATE INDEX idx_properties_status ON properties(status);
CREATE INDEX idx_properties_type ON properties(property_type);
CREATE INDEX idx_properties_city ON properties(city);
CREATE INDEX idx_properties_price ON properties(price);
CREATE INDEX idx_properties_agent ON properties(agent_id);
CREATE INDEX idx_properties_featured ON properties(featured);
CREATE INDEX idx_properties_slug ON properties(slug);

-- Lead indexes
CREATE INDEX idx_leads_stage ON leads(stage);
CREATE INDEX idx_leads_priority ON leads(priority);
CREATE INDEX idx_leads_agent ON leads(assigned_agent_id);
CREATE INDEX idx_leads_phone ON leads(phone);

-- Client indexes
CREATE INDEX idx_clients_status ON clients(status);
CREATE INDEX idx_clients_agent ON clients(assigned_agent_id);
CREATE INDEX idx_clients_phone ON clients(phone);
CREATE INDEX idx_clients_email ON clients(email);

-- Conversation & Message indexes
CREATE INDEX idx_conversations_client ON conversations(client_id);
CREATE INDEX idx_conversations_lead ON conversations(lead_id);
CREATE INDEX idx_conversations_platform ON conversations(platform);
CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_created ON messages(created_at);

-- Appointment indexes
CREATE INDEX idx_appointments_client ON appointments(client_id);
CREATE INDEX idx_appointments_property ON appointments(property_id);
CREATE INDEX idx_appointments_agent ON appointments(agent_id);
CREATE INDEX idx_appointments_start ON appointments(start_time);
CREATE INDEX idx_appointments_status ON appointments(status);

-- Invoice indexes
CREATE INDEX idx_invoices_client ON invoices(client_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_otps ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_verification_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE oauth_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON profiles
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Properties policies
CREATE POLICY "Anyone can view active properties" ON properties
    FOR SELECT USING (status = 'active');

CREATE POLICY "Agents can manage own properties" ON properties
    FOR ALL USING (
        agent_id IN (SELECT id FROM agents WHERE user_id = auth.uid())
    );

CREATE POLICY "Admins can manage all properties" ON properties
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Leads policies
CREATE POLICY "Agents can view assigned leads" ON leads
    FOR SELECT USING (
        assigned_agent_id IN (SELECT id FROM agents WHERE user_id = auth.uid())
    );

CREATE POLICY "Agents can update assigned leads" ON leads
    FOR UPDATE USING (
        assigned_agent_id IN (SELECT id FROM agents WHERE user_id = auth.uid())
    );

CREATE POLICY "Admins can manage all leads" ON leads
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Clients policies
CREATE POLICY "Agents can view assigned clients" ON clients
    FOR SELECT USING (
        assigned_agent_id IN (SELECT id FROM agents WHERE user_id = auth.uid())
        OR user_id = auth.uid()
    );

CREATE POLICY "Admins can manage all clients" ON clients
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Conversations and Messages policies
CREATE POLICY "Users can view own conversations" ON conversations
    FOR SELECT USING (
        agent_id IN (SELECT id FROM agents WHERE user_id = auth.uid())
        OR client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can view messages in own conversations" ON messages
    FOR SELECT USING (
        conversation_id IN (
            SELECT id FROM conversations WHERE 
            agent_id IN (SELECT id FROM agents WHERE user_id = auth.uid())
            OR client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
        )
    );

-- Appointments policies
CREATE POLICY "Users can view own appointments" ON appointments
    FOR SELECT USING (
        agent_id IN (SELECT id FROM agents WHERE user_id = auth.uid())
        OR client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
        OR created_by = auth.uid()
    );

-- Invoices policies
CREATE POLICY "Users can view own invoices" ON invoices
    FOR SELECT USING (
        agent_id IN (SELECT id FROM agents WHERE user_id = auth.uid())
        OR client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
    );

-- Notifications policies
CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications" ON notifications
    FOR UPDATE USING (user_id = auth.uid());

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Calculate age_of_property and area_sqm on insert/update
CREATE OR REPLACE FUNCTION calculate_property_fields()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate age of property
    IF NEW.year_built IS NOT NULL THEN
        NEW.age_of_property = EXTRACT(YEAR FROM NOW()) - NEW.year_built;
    END IF;
    
    -- Calculate area in square meters
    IF NEW.area_sqft IS NOT NULL THEN
        NEW.area_sqm = NEW.area_sqft * 0.092903;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Calculate duration_minutes for appointments
CREATE OR REPLACE FUNCTION calculate_appointment_duration()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.start_time IS NOT NULL AND NEW.end_time IS NOT NULL THEN
        NEW.duration_minutes = EXTRACT(EPOCH FROM (NEW.end_time - NEW.start_time))/60;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Calculate balance_due for invoices
CREATE OR REPLACE FUNCTION calculate_invoice_balance()
RETURNS TRIGGER AS $$
BEGIN
    NEW.balance_due = NEW.total_amount - COALESCE(NEW.paid_amount, 0);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Calculate amount for invoice items
CREATE OR REPLACE FUNCTION calculate_invoice_item_amount()
RETURNS TRIGGER AS $$
BEGIN
    NEW.amount = COALESCE(NEW.quantity, 1) * NEW.unit_price;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all relevant tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agents_updated_at BEFORE UPDATE ON agents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON properties
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON notifications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Apply calculation triggers
CREATE TRIGGER calculate_property_fields_trigger BEFORE INSERT OR UPDATE ON properties
    FOR EACH ROW EXECUTE FUNCTION calculate_property_fields();

CREATE TRIGGER calculate_appointment_duration_trigger BEFORE INSERT OR UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION calculate_appointment_duration();

CREATE TRIGGER calculate_invoice_balance_trigger BEFORE INSERT OR UPDATE ON invoices
    FOR EACH ROW EXECUTE FUNCTION calculate_invoice_balance();

CREATE TRIGGER calculate_invoice_item_amount_trigger BEFORE INSERT OR UPDATE ON invoice_items
    FOR EACH ROW EXECUTE FUNCTION calculate_invoice_item_amount();

-- =====================================================
-- STORAGE BUCKETS
-- =====================================================

-- Create storage buckets for files
INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES 
    ('property-images', 'property-images', true, false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
    ('property-documents', 'property-documents', false, false, 10485760, ARRAY['application/pdf', 'application/msword']),
    ('agent-avatars', 'agent-avatars', true, false, 2097152, ARRAY['image/jpeg', 'image/png']),
    ('client-documents', 'client-documents', false, false, 10485760, ARRAY['application/pdf'])
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Anyone can view property images" ON storage.objects
    FOR SELECT USING (bucket_id = 'property-images');

CREATE POLICY "Authenticated users can upload property images" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'property-images' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view agent avatars" ON storage.objects
    FOR SELECT USING (bucket_id = 'agent-avatars');

CREATE POLICY "Agents can upload own avatar" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'agent-avatars' AND 
        auth.uid() IN (SELECT user_id FROM agents)
    );

-- =====================================================
-- INITIAL DATA
-- =====================================================

-- Create default admin user trigger (runs after auth user creation)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name',
        COALESCE(NEW.raw_user_meta_data->>'role', 'user')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to generate slug from title
CREATE OR REPLACE FUNCTION generate_slug(title TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN LOWER(
        REGEXP_REPLACE(
            REGEXP_REPLACE(title, '[^a-zA-Z0-9\s-]', '', 'g'),
            '\s+', '-', 'g'
        )
    ) || '-' || SUBSTR(MD5(RANDOM()::TEXT), 1, 6);
END;
$$ LANGUAGE plpgsql;

-- Function to calculate property metrics
CREATE OR REPLACE FUNCTION calculate_property_metrics()
RETURNS TRIGGER AS $$
BEGIN
    -- Update views count
    IF TG_OP = 'UPDATE' AND OLD.views_count IS DISTINCT FROM NEW.views_count THEN
        -- Log view event
        INSERT INTO audit_logs (action, entity_type, entity_id, new_values)
        VALUES ('property_viewed', 'property', NEW.id::TEXT, jsonb_build_object('views', NEW.views_count));
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER property_metrics_trigger
    AFTER UPDATE ON properties
    FOR EACH ROW EXECUTE FUNCTION calculate_property_metrics();

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Grant necessary permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Grant permissions to anon users (for public data)
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON properties TO anon;

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE 'Estate Hive CRM database setup completed successfully!';
    RAISE NOTICE 'Tables created: profiles, agents, properties, leads, clients, conversations, messages, appointments, invoices, notifications';
    RAISE NOTICE 'Security features: RLS enabled, OTP support, email verification, OAuth ready';
    RAISE NOTICE 'Storage buckets: property-images, property-documents, agent-avatars, client-documents';
END $$;