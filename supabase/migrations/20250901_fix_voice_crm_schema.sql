-- =============================================
-- FIX VOICE CRM SCHEMA - Add Missing Tables and Columns
-- =============================================

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

-- 2. Create organization_settings table for API keys and configuration
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

-- Enable RLS
ALTER TABLE public.organization_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for organization_settings (simplified for current schema)
CREATE POLICY "Users can view their organization settings" 
ON public.organization_settings
FOR SELECT USING (
    organization_id = auth.uid() OR
    EXISTS (
        SELECT 1 FROM public.organizations o
        WHERE o.id = organization_settings.organization_id
        AND o.owner_id = auth.uid()
    )
);

CREATE POLICY "Organization owners can insert settings" 
ON public.organization_settings
FOR INSERT WITH CHECK (
    organization_id = auth.uid() OR
    EXISTS (
        SELECT 1 FROM public.organizations o
        WHERE o.id = organization_settings.organization_id
        AND o.owner_id = auth.uid()
    )
);

CREATE POLICY "Organization owners can update settings" 
ON public.organization_settings
FOR UPDATE USING (
    organization_id = auth.uid() OR
    EXISTS (
        SELECT 1 FROM public.organizations o
        WHERE o.id = organization_settings.organization_id
        AND o.owner_id = auth.uid()
    )
);

-- 3. Grant permissions
GRANT ALL ON public.organization_settings TO authenticated;

-- 4. Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_organization_settings_updated_at 
BEFORE UPDATE ON public.organization_settings
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 5. Insert default settings for existing organizations (if organizations table exists)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'organizations'
    ) THEN
        INSERT INTO public.organization_settings (organization_id, api_keys, voice_settings)
        SELECT 
            id as organization_id,
            '{}' as api_keys,
            '{
                "transcription_provider": "openai",
                "use_web_speech": false,
                "max_retries": 3,
                "retry_delay": 1000,
                "audio_timeout": 30000
            }' as voice_settings
        FROM public.organizations
        WHERE NOT EXISTS (
            SELECT 1 FROM public.organization_settings os 
            WHERE os.organization_id = organizations.id
        )
        ON CONFLICT (organization_id) DO NOTHING;
    END IF;
END $$;

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
-- This migration adds:
-- 1. telegram_bot_id column to voice_processing_jobs
-- 2. organization_settings table for API configuration
-- 3. Missing columns in client_communications
-- 4. All required indexes for performance
-- =============================================