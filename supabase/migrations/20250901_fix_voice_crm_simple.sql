-- =============================================
-- SIMPLE FIX FOR VOICE CRM - No Dependencies
-- =============================================
-- This version works even if organizations table doesn't exist

-- 1. Add telegram_bot_id column to voice_processing_jobs if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'voice_processing_jobs' 
        AND column_name = 'telegram_bot_id'
    ) THEN
        ALTER TABLE public.voice_processing_jobs 
        ADD COLUMN telegram_bot_id UUID;
        
        -- Add index for better query performance
        CREATE INDEX idx_voice_processing_jobs_telegram_bot_id 
        ON public.voice_processing_jobs(telegram_bot_id);
    END IF;
END $$;

-- 2. Create organization_settings table (simplified without RLS)
CREATE TABLE IF NOT EXISTS public.organization_settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID NOT NULL UNIQUE,
    
    -- API Keys (encrypted in production)
    api_keys JSONB DEFAULT '{}',
    
    -- Voice Settings
    voice_settings JSONB DEFAULT '{
        "transcription_provider": "openai",
        "use_web_speech": false,
        "max_retries": 3,
        "retry_delay": 1000,
        "audio_timeout": 30000
    }',
    
    -- General Settings
    settings JSONB DEFAULT '{}',
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for organization_id
CREATE INDEX IF NOT EXISTS idx_organization_settings_org_id 
ON public.organization_settings(organization_id);

-- 3. Simple RLS policies (everyone can access their own)
ALTER TABLE public.organization_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own settings" 
ON public.organization_settings
FOR ALL USING (organization_id = auth.uid())
WITH CHECK (organization_id = auth.uid());

-- 4. Grant permissions
GRANT ALL ON public.organization_settings TO authenticated;

-- 5. Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_organization_settings_updated_at ON public.organization_settings;
CREATE TRIGGER update_organization_settings_updated_at 
BEFORE UPDATE ON public.organization_settings
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 6. Add missing columns to client_communications if they don't exist
DO $$ 
BEGIN
    -- Add channel_metadata if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'client_communications' 
        AND column_name = 'channel_metadata'
    ) THEN
        ALTER TABLE public.client_communications 
        ADD COLUMN channel_metadata JSONB DEFAULT '{}';
    END IF;
    
    -- Add audio_file_id if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'client_communications' 
        AND column_name = 'audio_file_id'
    ) THEN
        ALTER TABLE public.client_communications 
        ADD COLUMN audio_file_id TEXT;
    END IF;
END $$;

-- 7. Ensure all required indexes exist
CREATE INDEX IF NOT EXISTS idx_client_communications_organization_id 
ON public.client_communications(organization_id);

CREATE INDEX IF NOT EXISTS idx_client_communications_client_id 
ON public.client_communications(client_id);

CREATE INDEX IF NOT EXISTS idx_client_communications_channel 
ON public.client_communications(channel);

CREATE INDEX IF NOT EXISTS idx_voice_processing_jobs_status_created 
ON public.voice_processing_jobs(status, created_at);

-- =============================================
-- MIGRATION COMPLETE
-- =============================================
-- This simplified migration:
-- 1. Adds telegram_bot_id column to voice_processing_jobs
-- 2. Creates organization_settings table without complex RLS
-- 3. Adds missing columns in client_communications
-- 4. Creates all required indexes
-- =============================================

COMMENT ON TABLE public.organization_settings IS 'Stores API keys and voice settings for organizations';
COMMENT ON COLUMN public.organization_settings.api_keys IS 'Encrypted API keys for various services';
COMMENT ON COLUMN public.organization_settings.voice_settings IS 'Voice transcription and processing settings';