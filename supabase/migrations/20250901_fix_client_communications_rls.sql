-- =============================================
-- FIX CLIENT COMMUNICATIONS RLS FOR BOT ACCESS
-- =============================================

-- Drop existing policies that are too restrictive
DROP POLICY IF EXISTS "Users can view their own communications" ON public.client_communications;
DROP POLICY IF EXISTS "Users can insert their own communications" ON public.client_communications;
DROP POLICY IF EXISTS "Users can update their own communications" ON public.client_communications;
DROP POLICY IF EXISTS "Users can delete their own communications" ON public.client_communications;

-- Create more flexible policies that work with bot operations
-- View policy: Users can view communications for their organization
CREATE POLICY "Users can view organization communications" ON public.client_communications
    FOR SELECT USING (
        organization_id = auth.uid() 
        OR organization_id IN (
            SELECT organization_id FROM public.telegram_bot_configs 
            WHERE organization_id = auth.uid()
        )
    );

-- Insert policy: Allow inserts with matching organization_id or NULL (for bot operations)
CREATE POLICY "Allow communication inserts" ON public.client_communications
    FOR INSERT WITH CHECK (
        organization_id = auth.uid() 
        OR organization_id IS NULL
        OR EXISTS (
            SELECT 1 FROM public.telegram_bot_configs 
            WHERE organization_id = auth.uid()
        )
    );

-- Update policy: Users can update their organization's communications
CREATE POLICY "Users can update organization communications" ON public.client_communications
    FOR UPDATE USING (
        organization_id = auth.uid()
        OR organization_id IN (
            SELECT organization_id FROM public.telegram_bot_configs 
            WHERE organization_id = auth.uid()
        )
    );

-- Delete policy: Users can delete their organization's communications
CREATE POLICY "Users can delete organization communications" ON public.client_communications
    FOR DELETE USING (
        organization_id = auth.uid()
        OR organization_id IN (
            SELECT organization_id FROM public.telegram_bot_configs 
            WHERE organization_id = auth.uid()
        )
    );

-- Alternative: Create a function to insert communications that bypasses RLS
CREATE OR REPLACE FUNCTION public.insert_voice_communication(
    p_organization_id UUID,
    p_client_id INTEGER,
    p_channel TEXT,
    p_channel_id TEXT,
    p_channel_metadata JSONB,
    p_audio_file_id TEXT,
    p_duration_seconds INTEGER,
    p_communication_date TIMESTAMPTZ
) RETURNS UUID AS $$
DECLARE
    v_communication_id UUID;
BEGIN
    -- Insert the communication record
    INSERT INTO public.client_communications (
        organization_id,
        client_id,
        communication_type,
        direction,
        channel,
        channel_id,
        channel_metadata,
        audio_file_id,
        duration_seconds,
        status,
        communication_date
    ) VALUES (
        p_organization_id,
        p_client_id,
        'voice',
        'incoming',
        p_channel,
        p_channel_id,
        p_channel_metadata,
        p_audio_file_id,
        p_duration_seconds,
        'pending',
        p_communication_date
    ) RETURNING id INTO v_communication_id;
    
    RETURN v_communication_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.insert_voice_communication TO authenticated;
GRANT EXECUTE ON FUNCTION public.insert_voice_communication TO anon;