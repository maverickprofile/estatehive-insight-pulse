-- =====================================================
-- VOICE CRM DECISION SYSTEM TABLES
-- =====================================================
-- This migration adds intelligent decision-making capabilities
-- to the Voice CRM system for automated action suggestions

-- 1. AI DECISIONS TABLE
-- Stores AI-generated decisions from voice transcriptions
CREATE TABLE IF NOT EXISTS public.ai_decisions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    communication_id UUID REFERENCES public.client_communications(id) ON DELETE CASCADE,
    
    -- Decision details
    decision_type TEXT CHECK (decision_type IN (
        'create_lead', 'update_client', 'schedule_appointment', 
        'create_task', 'update_property', 'send_message', 
        'change_status', 'assign_agent', 'update_budget', 'add_note'
    )),
    action_type TEXT CHECK (action_type IN (
        'client_action', 'lead_action', 'appointment_action', 
        'task_action', 'property_action', 'communication_action'
    )),
    
    -- Confidence and priority
    confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
    priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
    
    -- Status tracking
    status TEXT CHECK (status IN (
        'pending', 'approved', 'rejected', 'expired', 
        'executing', 'completed', 'failed'
    )) DEFAULT 'pending',
    
    -- Decision parameters (JSON)
    parameters JSONB DEFAULT '{}',
    
    -- Timestamps
    suggested_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours'),
    approved_at TIMESTAMPTZ,
    executed_at TIMESTAMPTZ,
    
    -- User tracking
    approved_by TEXT,
    rejected_reason TEXT,
    
    -- Execution details
    execution_result JSONB,
    error_message TEXT,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. ACTION APPROVALS TABLE
-- Tracks user approvals/rejections of AI decisions
CREATE TABLE IF NOT EXISTS public.action_approvals (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    decision_id UUID REFERENCES public.ai_decisions(id) ON DELETE CASCADE,
    
    -- User and channel info
    user_id TEXT NOT NULL,
    chat_id TEXT,
    message_id BIGINT,
    
    -- Action taken
    action TEXT CHECK (action IN ('approve', 'reject', 'modify')) NOT NULL,
    modified_parameters JSONB,
    reason TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CRM ACTION QUEUE TABLE
-- Queue for approved actions to be executed
CREATE TABLE IF NOT EXISTS public.crm_action_queue (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    decision_id UUID REFERENCES public.ai_decisions(id) ON DELETE CASCADE,
    
    -- Action details
    action_type TEXT NOT NULL,
    entity_type TEXT CHECK (entity_type IN (
        'client', 'lead', 'appointment', 'task', 'property', 'communication'
    )),
    entity_id TEXT,
    operation TEXT CHECK (operation IN ('create', 'update', 'delete')) NOT NULL,
    
    -- Payload and status
    payload JSONB NOT NULL,
    status TEXT CHECK (status IN (
        'queued', 'processing', 'completed', 'failed', 'reversed'
    )) DEFAULT 'queued',
    
    -- Retry logic
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    
    -- Execution tracking
    scheduled_for TIMESTAMPTZ,
    executed_at TIMESTAMPTZ,
    result JSONB,
    error TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. ACTION TEMPLATES TABLE
-- Predefined templates for common CRM actions
CREATE TABLE IF NOT EXISTS public.action_templates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Template details
    name TEXT NOT NULL,
    description TEXT,
    decision_type TEXT NOT NULL,
    
    -- Template configuration
    trigger_keywords TEXT[] DEFAULT '{}',
    default_parameters JSONB DEFAULT '{}',
    required_entities TEXT[] DEFAULT '{}',
    confidence_threshold DECIMAL(3,2) DEFAULT 0.7,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. AUTO-APPROVAL RULES TABLE
-- Rules for automatic approval of certain decisions
CREATE TABLE IF NOT EXISTS public.auto_approval_rules (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Rule configuration
    rule_name TEXT NOT NULL,
    decision_type TEXT NOT NULL,
    conditions JSONB DEFAULT '{}', -- min_confidence, max_amount, allowed_users, etc.
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Usage tracking
    times_used INTEGER DEFAULT 0,
    last_used_at TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. DECISION ANALYTICS TABLE
-- Analytics and learning from decision patterns
CREATE TABLE IF NOT EXISTS public.decision_analytics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Analytics data
    decision_type TEXT NOT NULL,
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    
    -- Metrics
    total_suggested INTEGER DEFAULT 0,
    total_approved INTEGER DEFAULT 0,
    total_rejected INTEGER DEFAULT 0,
    total_executed INTEGER DEFAULT 0,
    total_failed INTEGER DEFAULT 0,
    
    -- Performance metrics
    average_confidence DECIMAL(3,2),
    average_execution_time_seconds INTEGER,
    success_rate DECIMAL(3,2),
    
    -- Insights
    common_rejection_reasons TEXT[],
    user_preferences JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- AI Decisions indexes
CREATE INDEX idx_ai_decisions_communication ON public.ai_decisions(communication_id);
CREATE INDEX idx_ai_decisions_status ON public.ai_decisions(status);
CREATE INDEX idx_ai_decisions_type ON public.ai_decisions(decision_type);
CREATE INDEX idx_ai_decisions_expires ON public.ai_decisions(expires_at);
CREATE INDEX idx_ai_decisions_created ON public.ai_decisions(created_at DESC);

-- Action approvals indexes
CREATE INDEX idx_action_approvals_decision ON public.action_approvals(decision_id);
CREATE INDEX idx_action_approvals_user ON public.action_approvals(user_id);
CREATE INDEX idx_action_approvals_created ON public.action_approvals(created_at DESC);

-- CRM action queue indexes
CREATE INDEX idx_crm_queue_decision ON public.crm_action_queue(decision_id);
CREATE INDEX idx_crm_queue_status ON public.crm_action_queue(status);
CREATE INDEX idx_crm_queue_scheduled ON public.crm_action_queue(scheduled_for);
CREATE INDEX idx_crm_queue_entity ON public.crm_action_queue(entity_type, entity_id);

-- Templates and rules indexes
CREATE INDEX idx_action_templates_org ON public.action_templates(organization_id);
CREATE INDEX idx_action_templates_type ON public.action_templates(decision_type);
CREATE INDEX idx_auto_approval_org ON public.auto_approval_rules(organization_id);
CREATE INDEX idx_auto_approval_type ON public.auto_approval_rules(decision_type);

-- Analytics indexes
CREATE INDEX idx_decision_analytics_org ON public.decision_analytics(organization_id);
CREATE INDEX idx_decision_analytics_type ON public.decision_analytics(decision_type);
CREATE INDEX idx_decision_analytics_period ON public.decision_analytics(period_start, period_end);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS on all new tables
ALTER TABLE public.ai_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.action_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_action_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.action_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auto_approval_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.decision_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for AI Decisions
CREATE POLICY "Users can view their organization's decisions" ON public.ai_decisions
    FOR SELECT TO authenticated
    USING (
        communication_id IN (
            SELECT id FROM public.client_communications 
            WHERE organization_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage their organization's decisions" ON public.ai_decisions
    FOR ALL TO authenticated
    USING (
        communication_id IN (
            SELECT id FROM public.client_communications 
            WHERE organization_id = auth.uid()
        )
    );

-- RLS Policies for Action Approvals
CREATE POLICY "Users can view approvals" ON public.action_approvals
    FOR SELECT TO authenticated
    USING (
        decision_id IN (
            SELECT d.id FROM public.ai_decisions d
            JOIN public.client_communications c ON d.communication_id = c.id
            WHERE c.organization_id = auth.uid()
        )
    );

CREATE POLICY "Users can create approvals" ON public.action_approvals
    FOR INSERT TO authenticated
    WITH CHECK (
        decision_id IN (
            SELECT d.id FROM public.ai_decisions d
            JOIN public.client_communications c ON d.communication_id = c.id
            WHERE c.organization_id = auth.uid()
        )
    );

-- RLS Policies for CRM Action Queue
CREATE POLICY "Users can view their action queue" ON public.crm_action_queue
    FOR SELECT TO authenticated
    USING (
        decision_id IN (
            SELECT d.id FROM public.ai_decisions d
            JOIN public.client_communications c ON d.communication_id = c.id
            WHERE c.organization_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage their action queue" ON public.crm_action_queue
    FOR ALL TO authenticated
    USING (
        decision_id IN (
            SELECT d.id FROM public.ai_decisions d
            JOIN public.client_communications c ON d.communication_id = c.id
            WHERE c.organization_id = auth.uid()
        )
    );

-- RLS Policies for Templates and Rules
CREATE POLICY "Users can manage their templates" ON public.action_templates
    FOR ALL TO authenticated
    USING (organization_id = auth.uid());

CREATE POLICY "Users can manage their auto-approval rules" ON public.auto_approval_rules
    FOR ALL TO authenticated
    USING (organization_id = auth.uid());

CREATE POLICY "Users can view their analytics" ON public.decision_analytics
    FOR ALL TO authenticated
    USING (organization_id = auth.uid());

-- =====================================================
-- TRIGGER FUNCTIONS
-- =====================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_ai_decisions_updated_at BEFORE UPDATE ON public.ai_decisions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_crm_action_queue_updated_at BEFORE UPDATE ON public.crm_action_queue
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_action_templates_updated_at BEFORE UPDATE ON public.action_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_auto_approval_rules_updated_at BEFORE UPDATE ON public.auto_approval_rules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_decision_analytics_updated_at BEFORE UPDATE ON public.decision_analytics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- DEFAULT DATA
-- =====================================================

-- Insert default action templates
INSERT INTO public.action_templates (name, description, decision_type, trigger_keywords, confidence_threshold)
VALUES 
    ('Schedule Viewing', 'Schedule property viewing appointment', 'schedule_appointment', 
     ARRAY['viewing', 'show', 'visit', 'see the property'], 0.7),
    ('Create Follow-up', 'Create follow-up task', 'create_task', 
     ARRAY['follow up', 'call back', 'remind me', 'check with'], 0.6),
    ('Update Budget', 'Update client budget range', 'update_budget', 
     ARRAY['budget', 'can spend', 'price range', 'afford'], 0.7),
    ('Add Note', 'Add note to CRM', 'add_note', 
     ARRAY['note', 'remember', 'important'], 0.9)
ON CONFLICT DO NOTHING;

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

GRANT ALL ON public.ai_decisions TO authenticated;
GRANT ALL ON public.action_approvals TO authenticated;
GRANT ALL ON public.crm_action_queue TO authenticated;
GRANT ALL ON public.action_templates TO authenticated;
GRANT ALL ON public.auto_approval_rules TO authenticated;
GRANT ALL ON public.decision_analytics TO authenticated;