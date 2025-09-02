import OpenAI from 'openai';
import { supabase } from '@/lib/supabaseClient';
import { configService } from './config.service';
import { v4 as uuidv4 } from 'uuid';
import {
  AIDecision,
  DecisionType,
  ActionType,
  DecisionStatus,
  DecisionSuggestion,
  VoiceProcessingContext,
  CreateLeadPayload,
  UpdateClientPayload,
  ScheduleAppointmentPayload,
  CreateTaskPayload,
  ActionTemplate,
  AutoApprovalRule,
} from '@/types/voice-crm.types';

class AIDecisionService {
  private openai: OpenAI | null = null;
  private actionTemplates: Map<string, ActionTemplate> = new Map();
  private autoApprovalRules: Map<DecisionType, AutoApprovalRule> = new Map();

  /**
   * Initialize the AI Decision Service
   */
  async initialize(organizationId?: string): Promise<void> {
    try {
      // Initialize config service if needed
      if (!configService.isConfigInitialized()) {
        await configService.initialize(organizationId);
      }
      
      // Initialize OpenAI
      const apiKey = configService.getOpenAIApiKey();
      if (apiKey) {
        this.openai = new OpenAI({
          apiKey,
          dangerouslyAllowBrowser: true,
        });
        console.log('AI Decision Service initialized with OpenAI');
      } else {
        console.log('AI Decision Service initialized without OpenAI (using rule-based)');
      }

      // Load action templates
      await this.loadActionTemplates();
      
      // Load auto-approval rules
      await this.loadAutoApprovalRules(organizationId);

    } catch (error) {
      console.error('Error initializing AI Decision Service:', error);
    }
  }

  /**
   * Analyze conversation and generate decision suggestions
   */
  async analyzeConversation(context: VoiceProcessingContext): Promise<DecisionSuggestion[]> {
    if (!this.openai) {
      console.warn('OpenAI not initialized, using rule-based analysis');
      return this.ruleBasedAnalysis(context);
    }

    try {
      const systemPrompt = this.buildSystemPrompt();
      const userPrompt = this.buildAnalysisPrompt(context);

      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 1000,
      });

      const content = response.choices[0].message.content || '{}';
      const suggestions = JSON.parse(content);

      return this.validateAndEnrichSuggestions(suggestions.decisions || [], context);
    } catch (error) {
      console.error('Error in AI analysis, falling back to rules:', error);
      return this.ruleBasedAnalysis(context);
    }
  }

  /**
   * Build system prompt for decision analysis
   */
  private buildSystemPrompt(): string {
    return `You are an AI assistant for a real estate CRM system. Analyze voice transcriptions and suggest appropriate CRM actions.

You must return a JSON object with the following structure:
{
  "decisions": [
    {
      "decision_type": "create_lead|update_client|schedule_appointment|create_task|update_property|send_message|change_status|assign_agent|update_budget|add_note",
      "confidence": 0.0-1.0,
      "reasoning": "Brief explanation of why this action is suggested",
      "parameters": {
        // Action-specific parameters
      },
      "requires_approval": true/false,
      "auto_approve_eligible": true/false
    }
  ]
}

Decision types and their parameters:
- create_lead: {name, phone, email, source, interested_in, budget_min, budget_max}
- update_client: {client_id, updates: {field: value}}
- schedule_appointment: {title, type, client_id, property_id, start_time, end_time, location}
- create_task: {title, description, type, priority, due_date, assigned_to}
- update_budget: {client_id, budget_min, budget_max}
- add_note: {entity_type, entity_id, note_content}

Consider:
1. Extract specific dates/times for appointments
2. Identify client names and match with existing records
3. Detect urgency from keywords like "urgent", "ASAP", "immediately"
4. Recognize property requirements and budget ranges
5. Identify follow-up actions needed
6. Only suggest actions with high confidence (>0.7) for auto-approval
7. Complex actions always require approval`;
  }

  /**
   * Build analysis prompt with context
   */
  private buildAnalysisPrompt(context: VoiceProcessingContext): string {
    return `Analyze this voice note transcription and suggest CRM actions:

Transcription: "${context.transcription}"

Summary: ${context.ai_summary}

Key Points:
${context.key_points.map(p => `- ${p}`).join('\n')}

Action Items:
${context.action_items.map(a => `- ${a}`).join('\n')}

Extracted Entities:
- People: ${context.entities.people?.join(', ') || 'None'}
- Locations: ${context.entities.locations?.join(', ') || 'None'}
- Dates: ${context.entities.dates?.join(', ') || 'None'}
- Amounts: ${context.entities.amounts?.join(', ') || 'None'}

Sentiment: ${context.sentiment}
Urgency: ${context.urgency}

${context.client_info ? `Current Client: ${context.client_info.name} (ID: ${context.client_info.id}, Type: ${context.client_info.type})` : 'No client context'}

Based on this information, suggest appropriate CRM actions with high confidence scores for clear intentions and lower scores for ambiguous ones.`;
  }

  /**
   * Rule-based analysis fallback
   */
  private ruleBasedAnalysis(context: VoiceProcessingContext): DecisionSuggestion[] {
    const suggestions: DecisionSuggestion[] = [];

    // Check for appointment scheduling keywords
    const appointmentKeywords = ['meeting', 'viewing', 'appointment', 'visit', 'show', 'see the property'];
    const hasAppointment = appointmentKeywords.some(keyword => 
      context.transcription.toLowerCase().includes(keyword)
    );

    if (hasAppointment && context.entities.dates?.length) {
      suggestions.push({
        decision_type: 'schedule_appointment',
        confidence: 0.8,
        reasoning: 'Voice note mentions scheduling a meeting/viewing with date reference',
        parameters: {
          title: 'Property Viewing',
          appointment_type: 'property_viewing',
          client_id: context.client_info?.id,
          start_time: this.parseDateEntity(context.entities.dates[0]),
          duration: 60, // default 1 hour
        },
        requires_approval: true,
        auto_approve_eligible: false,
      });
    }

    // Check for follow-up tasks
    const followUpKeywords = ['follow up', 'call back', 'remind', 'check with', 'get back to'];
    const hasFollowUp = followUpKeywords.some(keyword => 
      context.transcription.toLowerCase().includes(keyword)
    );

    if (hasFollowUp) {
      suggestions.push({
        decision_type: 'create_task',
        confidence: 0.75,
        reasoning: 'Voice note mentions follow-up action needed',
        parameters: {
          title: 'Follow-up required',
          task_type: 'follow_up',
          priority: context.urgency === 'high' ? 'high' : 'normal',
          due_date: this.calculateDueDate(context.urgency),
        },
        requires_approval: true,
        auto_approve_eligible: false,
      });
    }

    // Check for budget updates
    if (context.entities.amounts?.length >= 2) {
      const amounts = context.entities.amounts.map(a => this.parseAmount(a)).sort((a, b) => a - b);
      if (context.client_info) {
        suggestions.push({
          decision_type: 'update_budget',
          confidence: 0.7,
          reasoning: 'Voice note mentions budget range',
          parameters: {
            client_id: context.client_info.id,
            budget_min: amounts[0],
            budget_max: amounts[amounts.length - 1],
          },
          requires_approval: true,
          auto_approve_eligible: false,
        });
      }
    }

    // Check for new lead creation
    const leadKeywords = ['new client', 'interested', 'looking for', 'wants to buy', 'wants to rent'];
    const hasNewLead = leadKeywords.some(keyword => 
      context.transcription.toLowerCase().includes(keyword)
    );

    if (hasNewLead && !context.client_info && context.entities.people?.length) {
      suggestions.push({
        decision_type: 'create_lead',
        confidence: 0.65,
        reasoning: 'Voice note mentions new potential client',
        parameters: {
          name: context.entities.people[0],
          source: 'voice_note',
          interested_in: this.extractPropertyType(context),
          priority: context.urgency === 'high' ? 'high' : 'normal',
        },
        requires_approval: true,
        auto_approve_eligible: false,
      });
    }

    // Always add a note for documentation
    suggestions.push({
      decision_type: 'add_note',
      confidence: 0.95,
      reasoning: 'Document voice note content in CRM',
      parameters: {
        entity_type: context.client_info ? 'client' : 'general',
        entity_id: context.client_info?.id,
        note_content: context.ai_summary,
      },
      requires_approval: false,
      auto_approve_eligible: true,
    });

    return suggestions;
  }

  /**
   * Validate and enrich AI suggestions
   */
  private validateAndEnrichSuggestions(
    suggestions: any[],
    context: VoiceProcessingContext
  ): DecisionSuggestion[] {
    return suggestions.map(suggestion => {
      // Ensure all required fields
      const validated: DecisionSuggestion = {
        decision_type: suggestion.decision_type || 'add_note',
        confidence: Math.min(1, Math.max(0, suggestion.confidence || 0.5)),
        reasoning: suggestion.reasoning || 'AI suggested action',
        parameters: suggestion.parameters || {},
        requires_approval: suggestion.requires_approval !== false,
        auto_approve_eligible: suggestion.auto_approve_eligible === true && suggestion.confidence > 0.8,
      };

      // Add context-specific enrichments
      if (validated.decision_type === 'schedule_appointment' && !validated.parameters.client_id) {
        validated.parameters.client_id = context.client_info?.id;
      }

      if (validated.decision_type === 'create_task' && !validated.parameters.priority) {
        validated.parameters.priority = context.urgency === 'high' ? 'high' : 'normal';
      }

      return validated;
    });
  }

  /**
   * Create AI decisions from suggestions
   */
  async createDecisions(
    suggestions: DecisionSuggestion[],
    communicationId: string,
    organizationId: string
  ): Promise<AIDecision[]> {
    const decisions: AIDecision[] = [];

    for (const suggestion of suggestions) {
      const decision: AIDecision = {
        id: uuidv4(),
        communication_id: communicationId,
        decision_type: suggestion.decision_type,
        action_type: this.getActionType(suggestion.decision_type),
        confidence_score: suggestion.confidence,
        priority: this.calculatePriority(suggestion),
        status: 'pending',
        parameters: suggestion.parameters,
        suggested_at: new Date(),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      };

      // Check auto-approval eligibility
      if (suggestion.auto_approve_eligible && await this.canAutoApprove(decision, organizationId)) {
        decision.status = 'approved';
        decision.approved_at = new Date();
        decision.approved_by = 'auto_approval';
      }

      decisions.push(decision);
    }

    // Save decisions to database
    await this.saveDecisions(decisions);

    return decisions;
  }

  /**
   * Check if decision can be auto-approved
   */
  private async canAutoApprove(decision: AIDecision, organizationId?: string): Promise<boolean> {
    const rule = this.autoApprovalRules.get(decision.decision_type);
    if (!rule || !rule.is_active) return false;

    // Check confidence threshold
    if (decision.confidence_score < (rule.conditions.min_confidence || 0.8)) {
      return false;
    }

    // Check time window
    if (rule.conditions.time_window) {
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      if (currentTime < rule.conditions.time_window.start || currentTime > rule.conditions.time_window.end) {
        return false;
      }
    }

    // Check daily approval limit
    if (rule.conditions.max_daily_approvals) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { count } = await supabase
        .from('ai_decisions')
        .select('id', { count: 'exact' })
        .eq('decision_type', decision.decision_type)
        .eq('status', 'approved')
        .eq('approved_by', 'auto_approval')
        .gte('approved_at', today.toISOString())
        .single();

      if ((count || 0) >= rule.conditions.max_daily_approvals) {
        return false;
      }
    }

    return true;
  }

  /**
   * Save decisions to database
   */
  private async saveDecisions(decisions: AIDecision[]): Promise<void> {
    try {
      const { error } = await supabase
        .from('ai_decisions')
        .insert(decisions.map(d => ({
          ...d,
          suggested_at: d.suggested_at.toISOString(),
          expires_at: d.expires_at?.toISOString(),
          approved_at: d.approved_at?.toISOString(),
          executed_at: d.executed_at?.toISOString(),
        })));

      if (error) throw error;
    } catch (error) {
      console.error('Error saving decisions:', error);
    }
  }

  /**
   * Load action templates from database or defaults
   */
  private async loadActionTemplates(): Promise<void> {
    // Default templates
    const defaultTemplates: ActionTemplate[] = [
      {
        id: 'schedule_viewing',
        name: 'Schedule Property Viewing',
        description: 'Schedule a property viewing appointment',
        trigger_keywords: ['viewing', 'show', 'visit', 'see the property'],
        decision_type: 'schedule_appointment',
        default_parameters: {
          appointment_type: 'property_viewing',
          duration: 60,
        },
        required_entities: ['dates'],
        confidence_threshold: 0.7,
      },
      {
        id: 'create_followup',
        name: 'Create Follow-up Task',
        description: 'Create a follow-up task',
        trigger_keywords: ['follow up', 'call back', 'remind me'],
        decision_type: 'create_task',
        default_parameters: {
          task_type: 'follow_up',
          priority: 'normal',
        },
        required_entities: [],
        confidence_threshold: 0.6,
      },
    ];

    defaultTemplates.forEach(template => {
      this.actionTemplates.set(template.id, template);
    });
  }

  /**
   * Load auto-approval rules
   */
  private async loadAutoApprovalRules(organizationId?: string): Promise<void> {
    // Default conservative rules
    const defaultRules: AutoApprovalRule[] = [
      {
        id: 'auto_approve_notes',
        rule_name: 'Auto-approve note additions',
        decision_type: 'add_note',
        conditions: {
          min_confidence: 0.9,
        },
        is_active: true,
      },
    ];

    defaultRules.forEach(rule => {
      this.autoApprovalRules.set(rule.decision_type, rule);
    });

    // Load custom rules from database if available
    if (organizationId) {
      try {
        const { data: customRules } = await supabase
          .from('auto_approval_rules')
          .select('*')
          .eq('organization_id', organizationId)
          .eq('is_active', true);

        if (customRules) {
          customRules.forEach(rule => {
            this.autoApprovalRules.set(rule.decision_type, rule);
          });
        }
      } catch (error) {
        console.log('No custom auto-approval rules found');
      }
    }
  }

  /**
   * Helper methods
   */
  private getActionType(decisionType: DecisionType): ActionType {
    const mapping: Record<DecisionType, ActionType> = {
      'create_lead': 'lead_action',
      'update_client': 'client_action',
      'schedule_appointment': 'appointment_action',
      'create_task': 'task_action',
      'update_property': 'property_action',
      'send_message': 'communication_action',
      'change_status': 'client_action',
      'assign_agent': 'client_action',
      'update_budget': 'client_action',
      'add_note': 'communication_action',
    };
    return mapping[decisionType] || 'client_action';
  }

  private calculatePriority(suggestion: DecisionSuggestion): 'low' | 'medium' | 'high' | 'urgent' {
    if (suggestion.parameters.priority) return suggestion.parameters.priority;
    if (suggestion.confidence > 0.9) return 'high';
    if (suggestion.confidence > 0.7) return 'medium';
    return 'low';
  }

  private parseDateEntity(dateStr: string): string {
    // Simple date parsing - in production, use a proper date parser
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (dateStr.toLowerCase().includes('tomorrow')) {
      return tomorrow.toISOString();
    }
    
    // Try to parse as date
    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }
    
    // Default to tomorrow
    return tomorrow.toISOString();
  }

  private calculateDueDate(urgency: string): string {
    const date = new Date();
    switch (urgency) {
      case 'high':
      case 'urgent':
        date.setDate(date.getDate() + 1); // Tomorrow
        break;
      case 'medium':
        date.setDate(date.getDate() + 3); // 3 days
        break;
      default:
        date.setDate(date.getDate() + 7); // 1 week
    }
    return date.toISOString();
  }

  private parseAmount(amountStr: string): number {
    // Remove currency symbols and convert to number
    const cleaned = amountStr.replace(/[^0-9.]/g, '');
    const value = parseFloat(cleaned);
    
    // Check for lakhs/crores notation
    if (amountStr.toLowerCase().includes('lakh') || amountStr.toLowerCase().includes('l')) {
      return value * 100000;
    }
    if (amountStr.toLowerCase().includes('crore') || amountStr.toLowerCase().includes('cr')) {
      return value * 10000000;
    }
    
    return value;
  }

  private extractPropertyType(context: VoiceProcessingContext): string {
    const types = context.entities.property_types || [];
    if (types.length > 0) return types[0];
    
    // Check transcription for property types
    const propertyTypes = ['apartment', 'villa', 'house', 'flat', 'plot', 'commercial', 'office'];
    for (const type of propertyTypes) {
      if (context.transcription.toLowerCase().includes(type)) {
        return type;
      }
    }
    
    return 'residential';
  }
}

// Export singleton instance
export const aiDecisionService = new AIDecisionService();