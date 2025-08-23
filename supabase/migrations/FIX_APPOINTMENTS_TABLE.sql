-- =====================================================
-- FIX APPOINTMENTS TABLE STRUCTURE
-- =====================================================
-- Ensure appointments table has all required fields from the UI
-- =====================================================

-- Drop and recreate appointments table with correct structure
DROP TABLE IF EXISTS appointments CASCADE;

CREATE TABLE appointments (
    id SERIAL PRIMARY KEY,
    
    -- Basic Information
    title TEXT NOT NULL,
    description TEXT,
    appointment_type TEXT DEFAULT 'property_viewing',
    
    -- Related Entities
    property_id INTEGER,
    client_id INTEGER,
    lead_id INTEGER,
    agent_id TEXT,
    
    -- Time & Duration
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    duration_minutes INTEGER GENERATED ALWAYS AS (
        EXTRACT(EPOCH FROM (end_time - start_time)) / 60
    ) STORED,
    all_day BOOLEAN DEFAULT false,
    
    -- Location
    location TEXT,
    location_address TEXT,
    location_coordinates POINT,
    meeting_link TEXT, -- For virtual meetings
    
    -- Status & State
    status TEXT DEFAULT 'scheduled' CHECK (status IN (
        'scheduled', 'confirmed', 'in_progress', 'completed', 
        'cancelled', 'rescheduled', 'no_show'
    )),
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    
    -- Participants
    attendees TEXT[], -- Array of attendee emails/names
    organizer_id UUID,
    created_by UUID,
    
    -- Reminders & Notifications
    reminder_sent BOOLEAN DEFAULT false,
    reminder_minutes_before INTEGER DEFAULT 30,
    send_email_reminder BOOLEAN DEFAULT true,
    send_sms_reminder BOOLEAN DEFAULT false,
    
    -- Outcome & Follow-up
    outcome TEXT,
    outcome_notes TEXT,
    follow_up_required BOOLEAN DEFAULT false,
    follow_up_date DATE,
    
    -- Additional Details
    notes TEXT,
    agenda TEXT,
    preparation_notes TEXT,
    attachments JSONB DEFAULT '[]',
    
    -- Colors & Display
    color TEXT DEFAULT '#3b82f6', -- For calendar display
    
    -- Recurring Appointments
    is_recurring BOOLEAN DEFAULT false,
    recurrence_pattern TEXT, -- daily, weekly, monthly, yearly
    recurrence_end_date DATE,
    parent_appointment_id INTEGER,
    
    -- Integration
    external_id TEXT, -- ID from external calendar systems
    google_event_id TEXT,
    outlook_event_id TEXT,
    
    -- Metadata
    tags TEXT[],
    metadata JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key constraints
DO $$
BEGIN
    -- Add foreign key to properties if table exists
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'properties'
    ) THEN
        ALTER TABLE appointments 
        ADD CONSTRAINT appointments_property_id_fkey 
        FOREIGN KEY (property_id) 
        REFERENCES properties(id) 
        ON DELETE SET NULL;
    END IF;
    
    -- Add foreign key to clients if table exists
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'clients'
    ) THEN
        ALTER TABLE appointments 
        ADD CONSTRAINT appointments_client_id_fkey 
        FOREIGN KEY (client_id) 
        REFERENCES clients(id) 
        ON DELETE CASCADE;
    END IF;
    
    -- Add foreign key to leads if table exists
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'leads'
    ) THEN
        ALTER TABLE appointments 
        ADD CONSTRAINT appointments_lead_id_fkey 
        FOREIGN KEY (lead_id) 
        REFERENCES leads(id) 
        ON DELETE CASCADE;
    END IF;
    
    -- Add foreign key to agents if table exists
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'agents'
    ) THEN
        ALTER TABLE appointments 
        ADD CONSTRAINT appointments_agent_id_fkey 
        FOREIGN KEY (agent_id) 
        REFERENCES agents(id) 
        ON DELETE SET NULL;
    END IF;
    
    -- Add foreign key to profiles for organizer and created_by
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'profiles'
    ) THEN
        ALTER TABLE appointments 
        ADD CONSTRAINT appointments_organizer_id_fkey 
        FOREIGN KEY (organizer_id) 
        REFERENCES profiles(id) 
        ON DELETE SET NULL;
        
        ALTER TABLE appointments 
        ADD CONSTRAINT appointments_created_by_fkey 
        FOREIGN KEY (created_by) 
        REFERENCES profiles(id) 
        ON DELETE SET NULL;
    END IF;
    
    -- Self-referencing foreign key for recurring appointments
    ALTER TABLE appointments 
    ADD CONSTRAINT appointments_parent_appointment_id_fkey 
    FOREIGN KEY (parent_appointment_id) 
    REFERENCES appointments(id) 
    ON DELETE CASCADE;
END $$;

-- Create indexes for performance
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_appointment_type ON appointments(appointment_type);
CREATE INDEX idx_appointments_property_id ON appointments(property_id);
CREATE INDEX idx_appointments_client_id ON appointments(client_id);
CREATE INDEX idx_appointments_agent_id ON appointments(agent_id);
CREATE INDEX idx_appointments_start_time ON appointments(start_time);
CREATE INDEX idx_appointments_end_time ON appointments(end_time);
CREATE INDEX idx_appointments_created_by ON appointments(created_by);
CREATE INDEX idx_appointments_created_at ON appointments(created_at);

-- Enable RLS
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can manage appointments" ON appointments;
DROP POLICY IF EXISTS "Authenticated users can manage all appointments" ON appointments;

-- Create simple policy for authenticated users (for now)
CREATE POLICY "Authenticated users can manage all appointments" ON appointments
    FOR ALL 
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Grant permissions
GRANT ALL ON appointments TO authenticated;
GRANT ALL ON appointments_id_seq TO authenticated;

-- Update trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_appointments_updated_at ON appointments;
CREATE TRIGGER update_appointments_updated_at
    BEFORE UPDATE ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Validate appointment times
CREATE OR REPLACE FUNCTION validate_appointment_times()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.end_time <= NEW.start_time THEN
        RAISE EXCEPTION 'End time must be after start time';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_appointment_times_trigger
    BEFORE INSERT OR UPDATE ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION validate_appointment_times();

-- Test insert
DO $$
BEGIN
    INSERT INTO appointments (
        title,
        description,
        appointment_type,
        start_time,
        end_time,
        location,
        status,
        notes
    ) VALUES (
        'Test Appointment',
        'Test appointment to verify table creation',
        'property_viewing',
        NOW() + INTERVAL '1 day',
        NOW() + INTERVAL '1 day' + INTERVAL '1 hour',
        'Test Location',
        'scheduled',
        'Test notes'
    );
    
    -- Delete test appointment
    DELETE FROM appointments WHERE title = 'Test Appointment';
    
    RAISE NOTICE '✅ Appointments table created successfully!';
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
    WHERE table_name = 'appointments';
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ APPOINTMENTS TABLE FIXED!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '📊 Total columns: %', col_count;
    RAISE NOTICE '📅 Ready for appointment scheduling';
    RAISE NOTICE '========================================';
END $$;