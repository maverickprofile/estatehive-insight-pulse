-- =============================================
-- VOICE-TO-CRM COMPLETE DATABASE SCHEMA
-- =============================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- 1. CLIENT COMMUNICATIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.client_communications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    client_id INTEGER REFERENCES public.clients(id) ON DELETE SET NULL,
    
    -- Communication Details
    communication_type TEXT CHECK (communication_type IN ('voice', 'text', 'email', 'call', 'meeting', 'note')),
    direction TEXT CHECK (direction IN ('incoming', 'outgoing')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    
    -- Content Fields
    subject TEXT,
    raw_content TEXT,
    processed_content TEXT,
    transcription TEXT,
    transcription_language TEXT,
    
    -- Voice Specific Fields
    audio_file_id TEXT,
    audio_file_url TEXT,
    duration_seconds INTEGER,
    confidence_score DECIMAL(3,2),
    
    -- Channel Information
    channel TEXT CHECK (channel IN ('telegram', 'whatsapp', 'email', 'phone', 'direct')),
    channel_id TEXT,
    channel_metadata JSONB DEFAULT '{}',
    
    -- AI Processing Results
    sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative', 'mixed')),
    key_points TEXT[],
    action_items TEXT[],
    entities JSONB DEFAULT '{}',
    tags TEXT[],
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    communication_date TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_client_communications_organization_id ON public.client_communications(organization_id);
CREATE INDEX IF NOT EXISTS idx_client_communications_client_id ON public.client_communications(client_id);
CREATE INDEX IF NOT EXISTS idx_client_communications_type ON public.client_communications(communication_type);
CREATE INDEX IF NOT EXISTS idx_client_communications_status ON public.client_communications(status);
CREATE INDEX IF NOT EXISTS idx_client_communications_date ON public.client_communications(communication_date DESC);
CREATE INDEX IF NOT EXISTS idx_client_communications_channel ON public.client_communications(channel);

-- =============================================
-- 2. TELEGRAM BOT CONFIGURATIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.telegram_bot_configs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Bot Information
    bot_token TEXT NOT NULL UNIQUE,
    bot_username TEXT,
    bot_name TEXT,
    
    -- Configuration
    allowed_chat_ids TEXT[] DEFAULT '{}',
    allowed_usernames TEXT[] DEFAULT '{}',
    chat_client_mapping JSONB DEFAULT '{}',
    
    -- Settings
    settings JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_telegram_bot_configs_organization_id ON public.telegram_bot_configs(organization_id);
CREATE INDEX IF NOT EXISTS idx_telegram_bot_configs_is_active ON public.telegram_bot_configs(is_active);

-- =============================================
-- 3. VOICE PROCESSING JOBS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.voice_processing_jobs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    communication_id UUID REFERENCES public.client_communications(id) ON DELETE CASCADE,
    
    -- Job Details
    status TEXT DEFAULT 'queued' CHECK (status IN ('queued', 'downloading', 'transcribing', 'summarizing', 'completed', 'failed')),
    current_step TEXT,
    progress_percentage INTEGER DEFAULT 0,
    
    -- Source Information
    source_type TEXT CHECK (source_type IN ('telegram', 'whatsapp', 'upload')),
    source_message_id TEXT,
    source_file_id TEXT,
    
    -- Error Handling
    retry_count INTEGER DEFAULT 0,
    error_message TEXT,
    error_details JSONB,
    
    -- Timestamps
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_voice_processing_jobs_communication_id ON public.voice_processing_jobs(communication_id);
CREATE INDEX IF NOT EXISTS idx_voice_processing_jobs_status ON public.voice_processing_jobs(status);

-- =============================================
-- 4. AI WORKFLOWS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.ai_workflows (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Workflow Information
    tool_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    
    -- Workflow Data
    nodes JSONB DEFAULT '[]',
    edges JSONB DEFAULT '[]',
    settings JSONB DEFAULT '{}',
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    is_template BOOLEAN DEFAULT false,
    
    -- Versioning
    version INTEGER DEFAULT 1,
    published_version INTEGER,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_run_at TIMESTAMPTZ
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_ai_workflows_user_id ON public.ai_workflows(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_workflows_tool_id ON public.ai_workflows(tool_id);
CREATE INDEX IF NOT EXISTS idx_ai_workflows_is_active ON public.ai_workflows(is_active);
CREATE INDEX IF NOT EXISTS idx_ai_workflows_is_template ON public.ai_workflows(is_template);

-- =============================================
-- 5. WORKFLOW EXECUTIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.workflow_executions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    workflow_id UUID REFERENCES public.ai_workflows(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Execution Details
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
    trigger_type TEXT,
    trigger_data JSONB DEFAULT '{}',
    
    -- Results
    output_data JSONB DEFAULT '{}',
    execution_logs JSONB DEFAULT '[]',
    error_message TEXT,
    
    -- Metrics
    duration_ms INTEGER,
    nodes_executed INTEGER DEFAULT 0,
    
    -- Timestamps
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_workflow_executions_workflow_id ON public.workflow_executions(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_user_id ON public.workflow_executions(user_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_status ON public.workflow_executions(status);

-- =============================================
-- 6. COMMUNICATION TEMPLATES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.communication_templates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Template Information
    name TEXT NOT NULL,
    description TEXT,
    template_type TEXT CHECK (template_type IN ('welcome', 'follow_up', 'notification', 'confirmation', 'reminder')),
    
    -- Template Content
    content TEXT NOT NULL,
    variables JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    
    -- Settings
    is_active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_communication_templates_organization_id ON public.communication_templates(organization_id);
CREATE INDEX IF NOT EXISTS idx_communication_templates_type ON public.communication_templates(template_type);

-- =============================================
-- 7. COMMUNICATION ANALYTICS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.communication_analytics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Metrics
    date DATE NOT NULL,
    total_communications INTEGER DEFAULT 0,
    total_voice_messages INTEGER DEFAULT 0,
    total_transcriptions INTEGER DEFAULT 0,
    total_duration_seconds INTEGER DEFAULT 0,
    
    -- Breakdown by Type
    communications_by_type JSONB DEFAULT '{}',
    communications_by_channel JSONB DEFAULT '{}',
    communications_by_status JSONB DEFAULT '{}',
    
    -- Sentiment Analysis
    sentiment_breakdown JSONB DEFAULT '{}',
    
    -- Performance Metrics
    average_processing_time_ms INTEGER,
    success_rate DECIMAL(5,2),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(organization_id, date)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_communication_analytics_organization_id ON public.communication_analytics(organization_id);
CREATE INDEX IF NOT EXISTS idx_communication_analytics_date ON public.communication_analytics(date DESC);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS on all tables
ALTER TABLE public.client_communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telegram_bot_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voice_processing_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communication_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communication_analytics ENABLE ROW LEVEL SECURITY;

-- Client Communications Policies
CREATE POLICY "Users can view their own communications" ON public.client_communications
    FOR SELECT USING (auth.uid() = organization_id);

CREATE POLICY "Users can insert their own communications" ON public.client_communications
    FOR INSERT WITH CHECK (auth.uid() = organization_id);

CREATE POLICY "Users can update their own communications" ON public.client_communications
    FOR UPDATE USING (auth.uid() = organization_id);

CREATE POLICY "Users can delete their own communications" ON public.client_communications
    FOR DELETE USING (auth.uid() = organization_id);

-- Telegram Bot Configs Policies
CREATE POLICY "Users can view their own bot configs" ON public.telegram_bot_configs
    FOR SELECT USING (auth.uid() = organization_id);

CREATE POLICY "Users can insert their own bot configs" ON public.telegram_bot_configs
    FOR INSERT WITH CHECK (auth.uid() = organization_id);

CREATE POLICY "Users can update their own bot configs" ON public.telegram_bot_configs
    FOR UPDATE USING (auth.uid() = organization_id);

CREATE POLICY "Users can delete their own bot configs" ON public.telegram_bot_configs
    FOR DELETE USING (auth.uid() = organization_id);

-- Voice Processing Jobs Policies
CREATE POLICY "Users can view their own processing jobs" ON public.voice_processing_jobs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.client_communications cc
            WHERE cc.id = voice_processing_jobs.communication_id
            AND cc.organization_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert their own processing jobs" ON public.voice_processing_jobs
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.client_communications cc
            WHERE cc.id = voice_processing_jobs.communication_id
            AND cc.organization_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own processing jobs" ON public.voice_processing_jobs
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.client_communications cc
            WHERE cc.id = voice_processing_jobs.communication_id
            AND cc.organization_id = auth.uid()
        )
    );

-- AI Workflows Policies
CREATE POLICY "Users can view their own workflows" ON public.ai_workflows
    FOR SELECT USING (auth.uid() = user_id OR is_template = true);

CREATE POLICY "Users can insert their own workflows" ON public.ai_workflows
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own workflows" ON public.ai_workflows
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own workflows" ON public.ai_workflows
    FOR DELETE USING (auth.uid() = user_id);

-- Workflow Executions Policies
CREATE POLICY "Users can view their own executions" ON public.workflow_executions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own executions" ON public.workflow_executions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own executions" ON public.workflow_executions
    FOR UPDATE USING (auth.uid() = user_id);

-- Communication Templates Policies
CREATE POLICY "Users can view their own templates" ON public.communication_templates
    FOR SELECT USING (auth.uid() = organization_id);

CREATE POLICY "Users can insert their own templates" ON public.communication_templates
    FOR INSERT WITH CHECK (auth.uid() = organization_id);

CREATE POLICY "Users can update their own templates" ON public.communication_templates
    FOR UPDATE USING (auth.uid() = organization_id);

CREATE POLICY "Users can delete their own templates" ON public.communication_templates
    FOR DELETE USING (auth.uid() = organization_id);

-- Communication Analytics Policies
CREATE POLICY "Users can view their own analytics" ON public.communication_analytics
    FOR SELECT USING (auth.uid() = organization_id);

CREATE POLICY "Users can insert their own analytics" ON public.communication_analytics
    FOR INSERT WITH CHECK (auth.uid() = organization_id);

CREATE POLICY "Users can update their own analytics" ON public.communication_analytics
    FOR UPDATE USING (auth.uid() = organization_id);

-- =============================================
-- TRIGGERS FOR UPDATED_AT
-- =============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for all tables with updated_at
CREATE TRIGGER update_client_communications_updated_at BEFORE UPDATE ON public.client_communications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_telegram_bot_configs_updated_at BEFORE UPDATE ON public.telegram_bot_configs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_voice_processing_jobs_updated_at BEFORE UPDATE ON public.voice_processing_jobs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_workflows_updated_at BEFORE UPDATE ON public.ai_workflows
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_communication_templates_updated_at BEFORE UPDATE ON public.communication_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_communication_analytics_updated_at BEFORE UPDATE ON public.communication_analytics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- GRANT PERMISSIONS
-- =============================================

GRANT ALL ON public.client_communications TO authenticated;
GRANT ALL ON public.telegram_bot_configs TO authenticated;
GRANT ALL ON public.voice_processing_jobs TO authenticated;
GRANT ALL ON public.ai_workflows TO authenticated;
GRANT ALL ON public.workflow_executions TO authenticated;
GRANT ALL ON public.communication_templates TO authenticated;
GRANT ALL ON public.communication_analytics TO authenticated;