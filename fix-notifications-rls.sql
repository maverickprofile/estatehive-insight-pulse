-- =====================================================
-- ESTATE HIVE CRM - FIX NOTIFICATIONS RLS POLICIES
-- =====================================================
-- Fix Row Level Security policies for notifications table
-- =====================================================

-- First, check if RLS is enabled on the notifications table
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can insert their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can delete their own notifications" ON notifications;
DROP POLICY IF EXISTS "Service role can manage all notifications" ON notifications;
DROP POLICY IF EXISTS "Authenticated users can create notifications" ON notifications;
DROP POLICY IF EXISTS "Service role bypass" ON notifications;

-- Create new RLS policies

-- Policy 1: Users can view their own notifications
CREATE POLICY "Users can view their own notifications" ON notifications
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy 2: Users can insert notifications for themselves
CREATE POLICY "Users can insert their own notifications" ON notifications
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy 3: Authenticated users can create notifications for any user (for system notifications)
CREATE POLICY "Authenticated users can create notifications" ON notifications
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- Policy 4: Users can update their own notifications (mark as read, etc.)
CREATE POLICY "Users can update their own notifications" ON notifications
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policy 5: Users can delete their own notifications
CREATE POLICY "Users can delete their own notifications" ON notifications
    FOR DELETE
    USING (auth.uid() = user_id);

-- Policy 6: Service role bypass (for backend operations)
CREATE POLICY "Service role bypass" ON notifications
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

-- Grant necessary permissions
GRANT ALL ON notifications TO authenticated;
GRANT SELECT ON notifications TO anon;

-- =====================================================
-- ALTERNATIVE: If you want to temporarily disable RLS
-- =====================================================
-- Uncomment the line below to disable RLS (NOT recommended for production)
-- ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- INSTRUCTIONS TO RUN THIS SCRIPT:
-- =====================================================
-- 1. Go to your Supabase Dashboard
-- 2. Navigate to SQL Editor
-- 3. Create a new query
-- 4. Copy and paste this entire script
-- 5. Click "Run" to execute
-- 
-- This will fix the RLS policies for the notifications table
-- =====================================================