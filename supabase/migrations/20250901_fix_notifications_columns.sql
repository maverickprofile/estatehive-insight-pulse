-- =============================================
-- FIX NOTIFICATIONS TABLE - ADD MISSING COLUMNS
-- =============================================

-- Add missing columns to notifications table
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS message TEXT,
ADD COLUMN IF NOT EXISTS action_url TEXT,
ADD COLUMN IF NOT EXISTS action_type TEXT,
ADD COLUMN IF NOT EXISTS action_label TEXT,
ADD COLUMN IF NOT EXISTS action_data JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;

-- Ensure organization_id exists (for multi-tenant support)
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_notifications_deleted_at ON public.notifications(deleted_at);
CREATE INDEX IF NOT EXISTS idx_notifications_is_deleted ON public.notifications(is_deleted);
CREATE INDEX IF NOT EXISTS idx_notifications_action_url ON public.notifications(action_url);

-- Update existing RLS policies if needed
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications" ON public.notifications
    FOR SELECT USING (
        auth.uid() = user_id 
        AND (is_deleted = false OR is_deleted IS NULL)
    );

-- Ensure all columns are accessible
GRANT ALL ON public.notifications TO authenticated;