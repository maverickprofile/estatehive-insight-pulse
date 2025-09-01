-- Create AI Workflow System Tables
-- This migration creates the necessary tables for the drag-and-drop workflow builder

-- 1. AI Workflows table - stores workflow definitions
CREATE TABLE IF NOT EXISTS ai_workflows (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    tool_id TEXT NOT NULL, -- Reference to the AI tool (whatsappAI, leadScoring, etc.)
    name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT false,
    is_template BOOLEAN DEFAULT false,
    version INTEGER DEFAULT 1,
    workflow_data JSONB NOT NULL, -- Stores the complete workflow structure
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. AI Workflow Nodes table - stores individual nodes
CREATE TABLE IF NOT EXISTS ai_workflow_nodes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    workflow_id UUID REFERENCES ai_workflows(id) ON DELETE CASCADE,
    node_id TEXT NOT NULL, -- Internal node identifier
    node_type TEXT NOT NULL, -- trigger, action, logic, integration
    node_subtype TEXT NOT NULL, -- Specific node type (webhook, schedule, condition, etc.)
    position JSONB NOT NULL, -- { x: number, y: number }
    data JSONB NOT NULL, -- Node configuration data
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(workflow_id, node_id)
);

-- 3. AI Workflow Connections table - stores connections between nodes
CREATE TABLE IF NOT EXISTS ai_workflow_connections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    workflow_id UUID REFERENCES ai_workflows(id) ON DELETE CASCADE,
    source_node_id TEXT NOT NULL,
    source_handle TEXT, -- Output handle identifier
    target_node_id TEXT NOT NULL,
    target_handle TEXT, -- Input handle identifier
    data JSONB DEFAULT '{}', -- Connection metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(workflow_id, source_node_id, source_handle, target_node_id, target_handle)
);

-- 4. AI Workflow Executions table - stores execution history
CREATE TABLE IF NOT EXISTS ai_workflow_executions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    workflow_id UUID REFERENCES ai_workflows(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
    trigger_type TEXT NOT NULL, -- manual, webhook, schedule
    trigger_data JSONB DEFAULT '{}',
    execution_data JSONB DEFAULT '{}', -- Stores execution state and results
    error_message TEXT,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. AI Workflow Execution Logs table - stores detailed execution logs
CREATE TABLE IF NOT EXISTS ai_workflow_execution_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    execution_id UUID REFERENCES ai_workflow_executions(id) ON DELETE CASCADE,
    node_id TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('started', 'completed', 'failed', 'skipped')),
    input_data JSONB DEFAULT '{}',
    output_data JSONB DEFAULT '{}',
    error_message TEXT,
    duration_ms INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. AI Workflow Templates table - stores pre-built workflow templates
CREATE TABLE IF NOT EXISTS ai_workflow_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tool_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    thumbnail_url TEXT,
    workflow_data JSONB NOT NULL,
    tags TEXT[] DEFAULT '{}',
    is_featured BOOLEAN DEFAULT false,
    usage_count INTEGER DEFAULT 0,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. AI Workflow Webhooks table - stores webhook configurations
CREATE TABLE IF NOT EXISTS ai_workflow_webhooks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    workflow_id UUID REFERENCES ai_workflows(id) ON DELETE CASCADE,
    webhook_id TEXT UNIQUE NOT NULL, -- Unique webhook identifier
    name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    secret_key TEXT, -- For webhook validation
    allowed_ips TEXT[], -- IP whitelist
    last_triggered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. AI Workflow Schedules table - stores schedule configurations
CREATE TABLE IF NOT EXISTS ai_workflow_schedules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    workflow_id UUID REFERENCES ai_workflows(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    cron_expression TEXT NOT NULL, -- Cron format for scheduling
    timezone TEXT DEFAULT 'UTC',
    is_active BOOLEAN DEFAULT true,
    last_run_at TIMESTAMPTZ,
    next_run_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_ai_workflows_organization_id ON ai_workflows(organization_id);
CREATE INDEX idx_ai_workflows_user_id ON ai_workflows(user_id);
CREATE INDEX idx_ai_workflows_tool_id ON ai_workflows(tool_id);
CREATE INDEX idx_ai_workflow_nodes_workflow_id ON ai_workflow_nodes(workflow_id);
CREATE INDEX idx_ai_workflow_connections_workflow_id ON ai_workflow_connections(workflow_id);
CREATE INDEX idx_ai_workflow_executions_workflow_id ON ai_workflow_executions(workflow_id);
CREATE INDEX idx_ai_workflow_executions_status ON ai_workflow_executions(status);
CREATE INDEX idx_ai_workflow_execution_logs_execution_id ON ai_workflow_execution_logs(execution_id);
CREATE INDEX idx_ai_workflow_templates_tool_id ON ai_workflow_templates(tool_id);
CREATE INDEX idx_ai_workflow_webhooks_webhook_id ON ai_workflow_webhooks(webhook_id);

-- Enable RLS (Row Level Security)
ALTER TABLE ai_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_workflow_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_workflow_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_workflow_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_workflow_execution_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_workflow_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_workflow_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_workflow_schedules ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ai_workflows
CREATE POLICY "Users can view workflows in their organization" ON ai_workflows
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can create workflows in their organization" ON ai_workflows
    FOR INSERT WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own workflows" ON ai_workflows
    FOR UPDATE USING (
        user_id = auth.uid() OR
        organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Users can delete their own workflows" ON ai_workflows
    FOR DELETE USING (
        user_id = auth.uid() OR
        organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
        )
    );

-- RLS Policies for ai_workflow_nodes
CREATE POLICY "Users can view nodes of accessible workflows" ON ai_workflow_nodes
    FOR SELECT USING (
        workflow_id IN (
            SELECT id FROM ai_workflows WHERE organization_id IN (
                SELECT organization_id FROM users WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can manage nodes of their workflows" ON ai_workflow_nodes
    FOR ALL USING (
        workflow_id IN (
            SELECT id FROM ai_workflows WHERE user_id = auth.uid() OR
            organization_id IN (
                SELECT organization_id FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
            )
        )
    );

-- RLS Policies for ai_workflow_connections
CREATE POLICY "Users can view connections of accessible workflows" ON ai_workflow_connections
    FOR SELECT USING (
        workflow_id IN (
            SELECT id FROM ai_workflows WHERE organization_id IN (
                SELECT organization_id FROM users WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can manage connections of their workflows" ON ai_workflow_connections
    FOR ALL USING (
        workflow_id IN (
            SELECT id FROM ai_workflows WHERE user_id = auth.uid() OR
            organization_id IN (
                SELECT organization_id FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
            )
        )
    );

-- RLS Policies for ai_workflow_executions
CREATE POLICY "Users can view executions in their organization" ON ai_workflow_executions
    FOR SELECT USING (
        workflow_id IN (
            SELECT id FROM ai_workflows WHERE organization_id IN (
                SELECT organization_id FROM users WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can create executions for accessible workflows" ON ai_workflow_executions
    FOR INSERT WITH CHECK (
        workflow_id IN (
            SELECT id FROM ai_workflows WHERE organization_id IN (
                SELECT organization_id FROM users WHERE id = auth.uid()
            )
        )
    );

-- RLS Policies for ai_workflow_execution_logs
CREATE POLICY "Users can view execution logs in their organization" ON ai_workflow_execution_logs
    FOR SELECT USING (
        execution_id IN (
            SELECT id FROM ai_workflow_executions WHERE workflow_id IN (
                SELECT id FROM ai_workflows WHERE organization_id IN (
                    SELECT organization_id FROM users WHERE id = auth.uid()
                )
            )
        )
    );

-- RLS Policies for ai_workflow_templates
CREATE POLICY "Everyone can view templates" ON ai_workflow_templates
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage templates" ON ai_workflow_templates
    FOR ALL USING (
        created_by = auth.uid() OR
        EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
        )
    );

-- RLS Policies for ai_workflow_webhooks
CREATE POLICY "Users can view webhooks of accessible workflows" ON ai_workflow_webhooks
    FOR SELECT USING (
        workflow_id IN (
            SELECT id FROM ai_workflows WHERE organization_id IN (
                SELECT organization_id FROM users WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can manage webhooks of their workflows" ON ai_workflow_webhooks
    FOR ALL USING (
        workflow_id IN (
            SELECT id FROM ai_workflows WHERE user_id = auth.uid() OR
            organization_id IN (
                SELECT organization_id FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
            )
        )
    );

-- RLS Policies for ai_workflow_schedules
CREATE POLICY "Users can view schedules of accessible workflows" ON ai_workflow_schedules
    FOR SELECT USING (
        workflow_id IN (
            SELECT id FROM ai_workflows WHERE organization_id IN (
                SELECT organization_id FROM users WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can manage schedules of their workflows" ON ai_workflow_schedules
    FOR ALL USING (
        workflow_id IN (
            SELECT id FROM ai_workflows WHERE user_id = auth.uid() OR
            organization_id IN (
                SELECT organization_id FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
            )
        )
    );

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_ai_workflows_updated_at BEFORE UPDATE ON ai_workflows
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_workflow_nodes_updated_at BEFORE UPDATE ON ai_workflow_nodes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_workflow_templates_updated_at BEFORE UPDATE ON ai_workflow_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_workflow_webhooks_updated_at BEFORE UPDATE ON ai_workflow_webhooks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_workflow_schedules_updated_at BEFORE UPDATE ON ai_workflow_schedules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample workflow templates
INSERT INTO ai_workflow_templates (tool_id, name, description, category, workflow_data, tags, is_featured)
VALUES 
    ('whatsappAI', 'Lead Qualification Flow', 'Automatically qualify leads through WhatsApp conversations', 'Lead Management', 
     '{"nodes": [], "edges": []}', ARRAY['whatsapp', 'leads', 'automation'], true),
    
    ('leadScoring', 'Smart Lead Prioritization', 'Score and prioritize leads based on multiple criteria', 'Lead Management',
     '{"nodes": [], "edges": []}', ARRAY['scoring', 'leads', 'analytics'], true),
    
    ('voiceToCRM', 'Voice Note Processing', 'Transcribe and log voice notes to CRM automatically', 'Productivity',
     '{"nodes": [], "edges": []}', ARRAY['voice', 'crm', 'transcription'], false),
    
    ('autoDocGen', 'Contract Generation Pipeline', 'Generate property contracts from templates', 'Documentation',
     '{"nodes": [], "edges": []}', ARRAY['documents', 'contracts', 'automation'], true),
    
    ('nlpSummarizer', 'Meeting Notes Summarizer', 'Summarize meeting notes and extract action items', 'Productivity',
     '{"nodes": [], "edges": []}', ARRAY['nlp', 'summary', 'meetings'], false);