-- =====================================================
-- ESTATE HIVE CRM - FIX NOTIFICATIONS TABLE
-- =====================================================
-- Add missing columns to notifications table
-- =====================================================

-- Add missing columns to match the application's type definitions
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general',
ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent', 'critical')),
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS property_id INTEGER REFERENCES properties(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS lead_id INTEGER REFERENCES leads(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS appointment_id INTEGER REFERENCES appointments(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS agent_id UUID REFERENCES agents(id) ON DELETE SET NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_property_id ON notifications(property_id);
CREATE INDEX IF NOT EXISTS idx_notifications_category ON notifications(category);

-- =====================================================
-- INSTRUCTIONS TO RUN THIS SCRIPT:
-- =====================================================
-- 1. Go to your Supabase Dashboard
-- 2. Navigate to SQL Editor
-- 3. Create a new query
-- 4. Copy and paste this entire script
-- 5. Click "Run" to execute
-- 
-- This will add the missing columns without affecting existing data
-- =====================================================