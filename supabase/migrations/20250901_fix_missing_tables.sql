-- =============================================
-- FIX MISSING TABLES AND FUNCTIONS
-- =============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- 1. SALES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.sales (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    property_id INTEGER REFERENCES public.properties(id) ON DELETE SET NULL,
    client_id INTEGER REFERENCES public.clients(id) ON DELETE SET NULL,
    agent_id TEXT REFERENCES public.agents(id) ON DELETE SET NULL,
    organization_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Sale Details
    sale_price DECIMAL(15,2) NOT NULL,
    sale_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    commission_rate DECIMAL(5,2) DEFAULT 3.00,
    commission_amount DECIMAL(15,2),
    
    -- Transaction Details
    transaction_type TEXT CHECK (transaction_type IN ('sale', 'lease', 'rental')),
    payment_method TEXT,
    payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'partial', 'completed', 'cancelled')),
    
    -- Documentation
    contract_number TEXT,
    notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for sales table
CREATE INDEX IF NOT EXISTS idx_sales_property_id ON public.sales(property_id);
CREATE INDEX IF NOT EXISTS idx_sales_client_id ON public.sales(client_id);
CREATE INDEX IF NOT EXISTS idx_sales_agent_id ON public.sales(agent_id);
CREATE INDEX IF NOT EXISTS idx_sales_organization_id ON public.sales(organization_id);
CREATE INDEX IF NOT EXISTS idx_sales_sale_date ON public.sales(sale_date DESC);

-- =============================================
-- 2. AI TOOLS SETTINGS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.ai_tools_settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    tool_id TEXT NOT NULL,
    
    -- Configuration
    enabled BOOLEAN DEFAULT true,
    api_key TEXT,
    settings JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, tool_id)
);

-- Create indexes for ai_tools_settings table
CREATE INDEX IF NOT EXISTS idx_ai_tools_settings_user_id ON public.ai_tools_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_tools_settings_tool_id ON public.ai_tools_settings(tool_id);

-- =============================================
-- 3. FIX NOTIFICATIONS TABLE
-- =============================================
-- Drop existing table if it has wrong structure
DROP TABLE IF EXISTS public.notifications CASCADE;

-- Recreate notifications table with correct structure
CREATE TABLE public.notifications (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
    is_read BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for notifications table
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

-- =============================================
-- 4. GET TOP AGENTS RPC FUNCTION
-- =============================================
CREATE OR REPLACE FUNCTION public.get_top_agents()
RETURNS TABLE (
    agent_id TEXT,
    agent_name TEXT,
    total_sales BIGINT,
    total_revenue DECIMAL(15,2),
    total_commission DECIMAL(15,2),
    average_sale_price DECIMAL(15,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id as agent_id,
        a.name as agent_name,
        COUNT(s.id)::BIGINT as total_sales,
        COALESCE(SUM(s.sale_price), 0)::DECIMAL(15,2) as total_revenue,
        COALESCE(SUM(s.commission_amount), 0)::DECIMAL(15,2) as total_commission,
        COALESCE(AVG(s.sale_price), 0)::DECIMAL(15,2) as average_sale_price
    FROM 
        public.agents a
    LEFT JOIN 
        public.sales s ON a.id = s.agent_id
    WHERE 
        s.sale_date >= NOW() - INTERVAL '30 days'
        OR s.id IS NULL  -- Include agents with no sales
    GROUP BY 
        a.id, a.name
    ORDER BY 
        total_revenue DESC
    LIMIT 10;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 5. ROW LEVEL SECURITY
-- =============================================

-- Enable RLS on new tables
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_tools_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Sales table policies
CREATE POLICY "Users can view their own sales" ON public.sales
    FOR SELECT USING (auth.uid() = organization_id);

CREATE POLICY "Users can insert their own sales" ON public.sales
    FOR INSERT WITH CHECK (auth.uid() = organization_id);

CREATE POLICY "Users can update their own sales" ON public.sales
    FOR UPDATE USING (auth.uid() = organization_id);

CREATE POLICY "Users can delete their own sales" ON public.sales
    FOR DELETE USING (auth.uid() = organization_id);

-- AI Tools Settings policies
CREATE POLICY "Users can view their own AI settings" ON public.ai_tools_settings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own AI settings" ON public.ai_tools_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own AI settings" ON public.ai_tools_settings
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own AI settings" ON public.ai_tools_settings
    FOR DELETE USING (auth.uid() = user_id);

-- Notifications policies
CREATE POLICY "Users can view their own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notifications" ON public.notifications
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications" ON public.notifications
    FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- 6. TRIGGERS FOR UPDATED_AT
-- =============================================

-- Create or replace the update_updated_at_column function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for new tables
DROP TRIGGER IF EXISTS update_sales_updated_at ON public.sales;
CREATE TRIGGER update_sales_updated_at BEFORE UPDATE ON public.sales
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_ai_tools_settings_updated_at ON public.ai_tools_settings;
CREATE TRIGGER update_ai_tools_settings_updated_at BEFORE UPDATE ON public.ai_tools_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_notifications_updated_at ON public.notifications;
CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON public.notifications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 7. GRANT PERMISSIONS
-- =============================================

GRANT ALL ON public.sales TO authenticated;
GRANT ALL ON public.ai_tools_settings TO authenticated;
GRANT ALL ON public.notifications TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_top_agents() TO authenticated;

-- Grant sequence permissions for serial columns
GRANT USAGE, SELECT ON SEQUENCE public.notifications_id_seq TO authenticated;