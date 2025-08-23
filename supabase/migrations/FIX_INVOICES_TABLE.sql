-- =====================================================
-- FIX INVOICES TABLE STRUCTURE
-- =====================================================
-- Ensure invoices table has all required fields from the UI
-- =====================================================

-- Drop and recreate invoices table with correct structure
DROP TABLE IF EXISTS invoices CASCADE;

CREATE TABLE invoices (
    id SERIAL PRIMARY KEY,
    
    -- Invoice Identification
    invoice_number TEXT UNIQUE,
    invoice_code TEXT UNIQUE,
    
    -- Related Entities
    client_id INTEGER,
    property_id INTEGER,
    agent_id TEXT,
    lead_id INTEGER,
    
    -- Invoice Type & Category
    invoice_type TEXT DEFAULT 'sale' CHECK (invoice_type IN (
        'sale', 'rental', 'commission', 'maintenance', 'booking', 
        'advance', 'refund', 'service', 'other'
    )),
    invoice_category TEXT,
    
    -- Dates
    issue_date DATE DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    payment_date DATE,
    
    -- Financial Details
    subtotal DECIMAL(15,2) NOT NULL DEFAULT 0,
    tax_amount DECIMAL(15,2) DEFAULT 0,
    tax_rate DECIMAL(5,2) DEFAULT 18.00, -- GST rate
    discount_amount DECIMAL(15,2) DEFAULT 0,
    discount_percentage DECIMAL(5,2) DEFAULT 0,
    total_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    paid_amount DECIMAL(15,2) DEFAULT 0,
    balance_due DECIMAL(15,2) GENERATED ALWAYS AS (total_amount - paid_amount) STORED,
    
    -- Currency
    currency TEXT DEFAULT 'INR',
    exchange_rate DECIMAL(10,4) DEFAULT 1.0000,
    
    -- Status
    status TEXT DEFAULT 'draft' CHECK (status IN (
        'draft', 'sent', 'viewed', 'partial', 'paid', 
        'overdue', 'cancelled', 'refunded', 'disputed'
    )),
    
    -- Payment Information
    payment_method TEXT CHECK (payment_method IN (
        'cash', 'bank_transfer', 'credit_card', 'debit_card', 
        'cheque', 'upi', 'net_banking', 'wallet', 'other'
    )),
    payment_reference TEXT,
    payment_gateway TEXT,
    transaction_id TEXT,
    
    -- Banking Details
    bank_name TEXT,
    account_number TEXT,
    ifsc_code TEXT,
    upi_id TEXT,
    
    -- Billing & Shipping Address
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
    
    -- Line Items (stored as JSONB)
    items JSONB DEFAULT '[]',
    /* Example items structure:
    [
        {
            "description": "Booking Amount for 3BHK Apartment",
            "quantity": 1,
            "rate": 100000,
            "amount": 100000,
            "tax_rate": 18,
            "tax_amount": 18000
        }
    ]
    */
    
    -- Additional Charges
    additional_charges JSONB DEFAULT '[]',
    
    -- Terms & Notes
    notes TEXT,
    internal_notes TEXT,
    terms_conditions TEXT,
    
    -- Digital Signature
    signature_url TEXT,
    signed_by TEXT,
    signed_at TIMESTAMPTZ,
    
    -- Approval Process
    requires_approval BOOLEAN DEFAULT false,
    approved_by TEXT,
    approved_at TIMESTAMPTZ,
    approval_notes TEXT,
    
    -- Reminders
    reminder_sent BOOLEAN DEFAULT false,
    reminder_count INTEGER DEFAULT 0,
    last_reminder_date DATE,
    next_reminder_date DATE,
    
    -- Email/Communication
    sent_to_email TEXT,
    sent_at TIMESTAMPTZ,
    viewed_at TIMESTAMPTZ,
    
    -- Attachments
    attachments JSONB DEFAULT '[]',
    
    -- Recurring Invoice
    is_recurring BOOLEAN DEFAULT false,
    recurrence_pattern TEXT, -- monthly, quarterly, yearly
    recurrence_end_date DATE,
    parent_invoice_id INTEGER,
    
    -- Integration
    external_id TEXT,
    quickbooks_id TEXT,
    tally_id TEXT,
    
    -- Metadata
    tags TEXT[],
    metadata JSONB DEFAULT '{}',
    
    -- Created By
    created_by UUID,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key constraints
DO $$
BEGIN
    -- Add foreign key to clients if table exists
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'clients'
    ) THEN
        ALTER TABLE invoices 
        ADD CONSTRAINT invoices_client_id_fkey 
        FOREIGN KEY (client_id) 
        REFERENCES clients(id) 
        ON DELETE CASCADE;
    END IF;
    
    -- Add foreign key to properties if table exists
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'properties'
    ) THEN
        ALTER TABLE invoices 
        ADD CONSTRAINT invoices_property_id_fkey 
        FOREIGN KEY (property_id) 
        REFERENCES properties(id) 
        ON DELETE SET NULL;
    END IF;
    
    -- Add foreign key to agents if table exists
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'agents'
    ) THEN
        ALTER TABLE invoices 
        ADD CONSTRAINT invoices_agent_id_fkey 
        FOREIGN KEY (agent_id) 
        REFERENCES agents(id) 
        ON DELETE SET NULL;
    END IF;
    
    -- Add foreign key to leads if table exists
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'leads'
    ) THEN
        ALTER TABLE invoices 
        ADD CONSTRAINT invoices_lead_id_fkey 
        FOREIGN KEY (lead_id) 
        REFERENCES leads(id) 
        ON DELETE SET NULL;
    END IF;
    
    -- Add foreign key to profiles for created_by
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'profiles'
    ) THEN
        ALTER TABLE invoices 
        ADD CONSTRAINT invoices_created_by_fkey 
        FOREIGN KEY (created_by) 
        REFERENCES profiles(id) 
        ON DELETE SET NULL;
    END IF;
    
    -- Self-referencing foreign key for recurring invoices
    ALTER TABLE invoices 
    ADD CONSTRAINT invoices_parent_invoice_id_fkey 
    FOREIGN KEY (parent_invoice_id) 
    REFERENCES invoices(id) 
    ON DELETE CASCADE;
END $$;

-- Create indexes for performance
CREATE INDEX idx_invoices_invoice_number ON invoices(invoice_number);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_client_id ON invoices(client_id);
CREATE INDEX idx_invoices_property_id ON invoices(property_id);
CREATE INDEX idx_invoices_agent_id ON invoices(agent_id);
CREATE INDEX idx_invoices_invoice_type ON invoices(invoice_type);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);
CREATE INDEX idx_invoices_created_at ON invoices(created_at);
CREATE INDEX idx_invoices_created_by ON invoices(created_by);

-- Enable RLS
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can manage invoices" ON invoices;
DROP POLICY IF EXISTS "Authenticated users can manage all invoices" ON invoices;

-- Create simple policy for authenticated users (for now)
CREATE POLICY "Authenticated users can manage all invoices" ON invoices
    FOR ALL 
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Grant permissions
GRANT ALL ON invoices TO authenticated;
GRANT ALL ON invoices_id_seq TO authenticated;

-- Update trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_invoices_updated_at ON invoices;
CREATE TRIGGER update_invoices_updated_at
    BEFORE UPDATE ON invoices
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Auto-generate invoice number
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TRIGGER AS $$
DECLARE
    year_month TEXT;
    last_number INTEGER;
    new_number TEXT;
BEGIN
    IF NEW.invoice_number IS NULL THEN
        -- Generate format: INV-YYYYMM-XXXX
        year_month := TO_CHAR(NOW(), 'YYYYMM');
        
        -- Get the last invoice number for this month
        SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM '[0-9]+$') AS INTEGER)), 0) + 1
        INTO last_number
        FROM invoices
        WHERE invoice_number LIKE 'INV-' || year_month || '-%';
        
        NEW.invoice_number := 'INV-' || year_month || '-' || LPAD(last_number::TEXT, 4, '0');
    END IF;
    
    IF NEW.invoice_code IS NULL THEN
        NEW.invoice_code := NEW.invoice_number;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_invoice_number_trigger
    BEFORE INSERT ON invoices
    FOR EACH ROW
    EXECUTE FUNCTION generate_invoice_number();

-- Update status based on payment
CREATE OR REPLACE FUNCTION update_invoice_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Auto-update status based on payment
    IF NEW.paid_amount >= NEW.total_amount THEN
        NEW.status = 'paid';
    ELSIF NEW.paid_amount > 0 AND NEW.paid_amount < NEW.total_amount THEN
        NEW.status = 'partial';
    ELSIF NEW.due_date < CURRENT_DATE AND NEW.paid_amount = 0 AND NEW.status NOT IN ('cancelled', 'refunded') THEN
        NEW.status = 'overdue';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_invoice_status_trigger
    BEFORE UPDATE ON invoices
    FOR EACH ROW
    WHEN (OLD.paid_amount IS DISTINCT FROM NEW.paid_amount OR OLD.due_date IS DISTINCT FROM NEW.due_date)
    EXECUTE FUNCTION update_invoice_status();

-- Test insert
DO $$
BEGIN
    INSERT INTO invoices (
        invoice_type,
        due_date,
        subtotal,
        tax_amount,
        total_amount,
        status,
        notes,
        items
    ) VALUES (
        'booking',
        CURRENT_DATE + INTERVAL '30 days',
        100000,
        18000,
        118000,
        'draft',
        'Test invoice to verify table creation',
        '[{"description": "Test Item", "amount": 100000}]'::JSONB
    );
    
    -- Delete test invoice
    DELETE FROM invoices WHERE notes = 'Test invoice to verify table creation';
    
    RAISE NOTICE '✅ Invoices table created successfully!';
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
    WHERE table_name = 'invoices';
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ INVOICES TABLE FIXED!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '📊 Total columns: %', col_count;
    RAISE NOTICE '💰 Ready for invoice management';
    RAISE NOTICE '========================================';
END $$;