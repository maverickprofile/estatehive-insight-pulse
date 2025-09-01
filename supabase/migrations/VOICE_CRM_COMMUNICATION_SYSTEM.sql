-- Voice-to-CRM Communication System
-- This migration creates tables for managing voice communications via Telegram and other channels

-- 1. Client Communications Table - Stores all communication logs
CREATE TABLE IF NOT EXISTS client_communications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Communication Details
    communication_type TEXT CHECK (communication_type IN ('voice', 'whatsapp', 'email', 'call', 'sms', 'telegram', 'meeting', 'note')) NOT NULL,
    direction TEXT CHECK (direction IN ('incoming', 'outgoing')) DEFAULT 'incoming',
    channel_id TEXT, -- Telegram chat ID, WhatsApp number, etc.
    channel_metadata JSONB DEFAULT '{}', -- Additional channel-specific data
    
    -- Content Fields
    raw_content TEXT, -- Original message/transcription
    processed_content TEXT, -- AI-processed summary
    subject TEXT, -- For emails or summarized title
    sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative', 'mixed')),
    key_points JSONB DEFAULT '[]', -- Extracted key points
    action_items JSONB DEFAULT '[]', -- Extracted action items
    entities JSONB DEFAULT '{}', -- Extracted entities (names, dates, amounts, etc.)
    
    -- Voice Specific Fields
    audio_url TEXT, -- URL to stored audio file
    audio_file_id TEXT, -- Telegram file ID or other service file reference
    transcription TEXT, -- Raw transcription
    transcription_language TEXT DEFAULT 'en',
    duration_seconds INTEGER,
    confidence_score FLOAT CHECK (confidence_score >= 0 AND confidence_score <= 1),
    
    -- Status and Processing
    status TEXT CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'archived')) DEFAULT 'pending',
    processing_errors JSONB DEFAULT '[]',
    workflow_execution_id UUID REFERENCES ai_workflow_executions(id) ON DELETE SET NULL,
    
    -- Metadata
    tags TEXT[] DEFAULT '{}',
    is_important BOOLEAN DEFAULT false,
    is_archived BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}',
    
    -- Timestamps
    communication_date TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Telegram Bot Configurations Table
CREATE TABLE IF NOT EXISTS telegram_bot_configs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Bot Configuration
    bot_token TEXT NOT NULL,
    bot_username TEXT,
    bot_id TEXT,
    webhook_url TEXT,
    webhook_secret TEXT, -- For webhook validation
    
    -- Access Control
    is_active BOOLEAN DEFAULT true,
    allowed_chat_ids TEXT[] DEFAULT '{}', -- Whitelist of allowed Telegram chat IDs
    allowed_usernames TEXT[] DEFAULT '{}', -- Whitelist of allowed Telegram usernames
    
    -- Settings
    auto_transcribe BOOLEAN DEFAULT true,
    auto_summarize BOOLEAN DEFAULT true,
    default_language TEXT DEFAULT 'en',
    send_confirmations BOOLEAN DEFAULT true,
    
    -- Client Mapping
    chat_client_mapping JSONB DEFAULT '{}', -- Map Telegram chat IDs to client IDs
    
    -- Configuration
    settings JSONB DEFAULT '{}',
    
    -- Timestamps
    last_webhook_update TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(bot_token)
);

-- 3. Voice Processing Jobs Table
CREATE TABLE IF NOT EXISTS voice_processing_jobs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    communication_id UUID REFERENCES client_communications(id) ON DELETE CASCADE,
    
    -- Source Information
    source_type TEXT CHECK (source_type IN ('telegram', 'whatsapp', 'browser', 'api')) NOT NULL,
    source_message_id TEXT, -- Telegram message ID, WhatsApp message ID, etc.
    source_file_id TEXT, -- File ID from the source service
    
    -- Processing Status
    status TEXT CHECK (status IN ('queued', 'downloading', 'transcribing', 'summarizing', 'updating_crm', 'completed', 'failed')) DEFAULT 'queued',
    current_step TEXT,
    total_steps INTEGER DEFAULT 5,
    progress_percentage INTEGER DEFAULT 0,
    
    -- Processing Details
    processing_steps JSONB DEFAULT '[]', -- Track each step of processing
    transcription_service TEXT DEFAULT 'openai-whisper',
    ai_model TEXT DEFAULT 'gpt-4',
    
    -- Error Handling
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    error_message TEXT,
    error_details JSONB,
    
    -- Timing
    queued_at TIMESTAMPTZ DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    processing_duration_ms INTEGER,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Communication Templates Table - For quick responses
CREATE TABLE IF NOT EXISTS communication_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Template Details
    name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    communication_type TEXT,
    
    -- Content
    template_content TEXT NOT NULL,
    variables JSONB DEFAULT '[]', -- List of variables that can be replaced
    
    -- Usage
    usage_count INTEGER DEFAULT 0,
    last_used_at TIMESTAMPTZ,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    is_global BOOLEAN DEFAULT false, -- Available to all users in organization
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Communication Analytics Table
CREATE TABLE IF NOT EXISTS communication_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Metrics
    date DATE NOT NULL,
    total_communications INTEGER DEFAULT 0,
    voice_messages INTEGER DEFAULT 0,
    transcribed_messages INTEGER DEFAULT 0,
    ai_processed_messages INTEGER DEFAULT 0,
    
    -- Performance
    avg_transcription_time_ms INTEGER,
    avg_processing_time_ms INTEGER,
    avg_confidence_score FLOAT,
    
    -- By Channel
    telegram_count INTEGER DEFAULT 0,
    whatsapp_count INTEGER DEFAULT 0,
    email_count INTEGER DEFAULT 0,
    
    -- By Sentiment
    positive_count INTEGER DEFAULT 0,
    neutral_count INTEGER DEFAULT 0,
    negative_count INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(organization_id, date)
);

-- Create indexes for better performance
CREATE INDEX idx_client_communications_client_id ON client_communications(client_id);
CREATE INDEX idx_client_communications_organization_id ON client_communications(organization_id);
CREATE INDEX idx_client_communications_user_id ON client_communications(user_id);
CREATE INDEX idx_client_communications_status ON client_communications(status);
CREATE INDEX idx_client_communications_communication_type ON client_communications(communication_type);
CREATE INDEX idx_client_communications_communication_date ON client_communications(communication_date DESC);
CREATE INDEX idx_client_communications_is_important ON client_communications(is_important) WHERE is_important = true;

CREATE INDEX idx_telegram_bot_configs_organization_id ON telegram_bot_configs(organization_id);
CREATE INDEX idx_telegram_bot_configs_user_id ON telegram_bot_configs(user_id);
CREATE INDEX idx_telegram_bot_configs_bot_token ON telegram_bot_configs(bot_token);

CREATE INDEX idx_voice_processing_jobs_communication_id ON voice_processing_jobs(communication_id);
CREATE INDEX idx_voice_processing_jobs_status ON voice_processing_jobs(status);
CREATE INDEX idx_voice_processing_jobs_source_type ON voice_processing_jobs(source_type);

CREATE INDEX idx_communication_templates_organization_id ON communication_templates(organization_id);
CREATE INDEX idx_communication_analytics_organization_date ON communication_analytics(organization_id, date);

-- Enable Row Level Security
ALTER TABLE client_communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE telegram_bot_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_processing_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE communication_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE communication_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for client_communications
CREATE POLICY "Users can view communications for their organization's clients" ON client_communications
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can create communications for their organization's clients" ON client_communications
    FOR INSERT WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own communications" ON client_communications
    FOR UPDATE USING (
        user_id = auth.uid() OR
        organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Users can delete their own communications" ON client_communications
    FOR DELETE USING (
        user_id = auth.uid() OR
        organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
        )
    );

-- RLS Policies for telegram_bot_configs
CREATE POLICY "Users can view their organization's bot configs" ON telegram_bot_configs
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Admins can manage bot configs" ON telegram_bot_configs
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
        )
    );

-- RLS Policies for voice_processing_jobs
CREATE POLICY "Users can view processing jobs for their communications" ON voice_processing_jobs
    FOR SELECT USING (
        communication_id IN (
            SELECT id FROM client_communications WHERE organization_id IN (
                SELECT organization_id FROM users WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "System can manage processing jobs" ON voice_processing_jobs
    FOR ALL USING (
        communication_id IN (
            SELECT id FROM client_communications WHERE organization_id IN (
                SELECT organization_id FROM users WHERE id = auth.uid()
            )
        )
    );

-- RLS Policies for communication_templates
CREATE POLICY "Users can view templates in their organization" ON communication_templates
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
        ) OR is_global = true
    );

CREATE POLICY "Users can manage their own templates" ON communication_templates
    FOR ALL USING (
        user_id = auth.uid() OR
        (organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
        ) AND is_global = true)
    );

-- RLS Policies for communication_analytics
CREATE POLICY "Users can view their organization's analytics" ON communication_analytics
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "System can manage analytics" ON communication_analytics
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
        )
    );

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_client_communications_updated_at BEFORE UPDATE ON client_communications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_telegram_bot_configs_updated_at BEFORE UPDATE ON telegram_bot_configs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_voice_processing_jobs_updated_at BEFORE UPDATE ON voice_processing_jobs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_communication_templates_updated_at BEFORE UPDATE ON communication_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_communication_analytics_updated_at BEFORE UPDATE ON communication_analytics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample communication templates
INSERT INTO communication_templates (name, description, category, communication_type, template_content, variables, is_global)
VALUES 
    ('Voice Note Received', 'Confirmation for voice note reception', 'System', 'telegram', 
     '✅ Voice note received and being processed. You will receive a confirmation once it''s logged to the CRM.', 
     '[]', true),
    
    ('Transcription Complete', 'Notification when transcription is done', 'System', 'telegram',
     '📝 Transcription complete!\n\nClient: {{client_name}}\nDuration: {{duration}}\nSummary: {{summary}}\n\n✅ Logged to CRM',
     '["client_name", "duration", "summary"]', true),
    
    ('Processing Error', 'Error notification template', 'System', 'telegram',
     '❌ Error processing voice note: {{error_message}}\n\nPlease try again or contact support.',
     '["error_message"]', true),
    
    ('Daily Summary', 'Daily communication summary', 'Report', 'email',
     'Daily Communication Summary\n\nTotal Messages: {{total}}\nVoice Notes: {{voice_count}}\nClients Contacted: {{client_count}}\n\nTop Action Items:\n{{action_items}}',
     '["total", "voice_count", "client_count", "action_items"]', true);