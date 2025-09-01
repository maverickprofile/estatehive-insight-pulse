import { WorkflowNode, WorkflowEdge } from '@/stores/workflowStore';

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  toolId: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  requiredCredentials: string[];
  tags: string[];
}

export const voiceToCRMTemplate: WorkflowTemplate = {
  id: 'voice-to-crm-default',
  name: 'Voice Note to CRM Logger',
  description: 'Automatically transcribe and log voice notes from Telegram to client records',
  category: 'Productivity',
  toolId: 'voiceToCRM',
  requiredCredentials: ['telegram_bot_token', 'openai_api_key'],
  tags: ['voice', 'transcription', 'telegram', 'crm', 'automation'],
  nodes: [
    {
      id: 'trigger-telegram',
      type: 'trigger',
      position: { x: 100, y: 200 },
      data: {
        label: 'Telegram Voice Message',
        type: 'trigger',
        subtype: 'telegram',
        description: 'Receives voice messages from Telegram',
        icon: 'MessageCircle',
        color: 'bg-green-500',
        config: {
          messageType: 'voice',
          allowedUsers: [],
          autoAcknowledge: true,
        },
      },
    },
    {
      id: 'action-download',
      type: 'action',
      position: { x: 350, y: 200 },
      data: {
        label: 'Download Audio',
        type: 'action',
        subtype: 'download',
        description: 'Download voice file from Telegram',
        icon: 'Download',
        color: 'bg-blue-500',
        config: {
          source: 'telegram',
          maxSize: 25, // MB
          timeout: 30000, // ms
        },
      },
    },
    {
      id: 'action-transcribe',
      type: 'action',
      position: { x: 600, y: 200 },
      data: {
        label: 'Transcribe Voice',
        type: 'action',
        subtype: 'transcription',
        description: 'Convert voice to text using Whisper',
        icon: 'Mic',
        color: 'bg-blue-500',
        config: {
          service: 'openai-whisper',
          model: 'whisper-1',
          language: 'auto-detect',
          temperature: 0,
          response_format: 'verbose_json',
        },
      },
    },
    {
      id: 'action-ai-process',
      type: 'action',
      position: { x: 850, y: 200 },
      data: {
        label: 'AI Summary',
        type: 'action',
        subtype: 'ai-process',
        description: 'Summarize and extract key information',
        icon: 'Brain',
        color: 'bg-blue-500',
        config: {
          model: 'gpt-4',
          prompt: 'Summarize this voice note and extract key points, action items, and sentiment',
          extractEntities: true,
          generateTitle: true,
          maxTokens: 500,
        },
      },
    },
    {
      id: 'logic-client-check',
      type: 'logic',
      position: { x: 1100, y: 200 },
      data: {
        label: 'Check Client Link',
        type: 'logic',
        subtype: 'condition',
        description: 'Check if chat is linked to a client',
        icon: 'GitBranch',
        color: 'bg-amber-500',
        config: {
          condition: 'has_client_mapping',
          field: 'chat_client_mapping',
          operator: 'exists',
        },
      },
    },
    {
      id: 'action-update-client',
      type: 'action',
      position: { x: 1350, y: 120 },
      data: {
        label: 'Update Client Record',
        type: 'action',
        subtype: 'crm-update',
        description: 'Add communication to client history',
        icon: 'Database',
        color: 'bg-blue-500',
        config: {
          updateType: 'add_communication',
          table: 'client_communications',
          fields: {
            communication_type: 'voice',
            direction: 'incoming',
            channel: 'telegram',
          },
        },
      },
    },
    {
      id: 'action-create-note',
      type: 'action',
      position: { x: 1350, y: 280 },
      data: {
        label: 'Create General Note',
        type: 'action',
        subtype: 'crm-update',
        description: 'Create note without client link',
        icon: 'FileText',
        color: 'bg-blue-500',
        config: {
          updateType: 'create_note',
          table: 'client_communications',
          fields: {
            communication_type: 'note',
            direction: 'incoming',
            channel: 'telegram',
          },
        },
      },
    },
    {
      id: 'action-notify-success',
      type: 'action',
      position: { x: 1600, y: 200 },
      data: {
        label: 'Send Confirmation',
        type: 'action',
        subtype: 'notification',
        description: 'Notify user of successful processing',
        icon: 'Send',
        color: 'bg-blue-500',
        config: {
          channel: 'telegram',
          messageTemplate: '✅ Voice note processed successfully!\n\n📝 Summary: {{summary}}\n\n{{#if client}}📋 Client: {{client.name}}{{/if}}\n\n✅ Logged to CRM',
          includeActionItems: true,
          includeKeyPoints: true,
        },
      },
    },
    {
      id: 'action-error-handler',
      type: 'action',
      position: { x: 600, y: 400 },
      data: {
        label: 'Error Handler',
        type: 'action',
        subtype: 'error-handler',
        description: 'Handle processing errors',
        icon: 'AlertCircle',
        color: 'bg-red-500',
        config: {
          retryCount: 2,
          retryDelay: 5000,
          notifyOnError: true,
          errorMessageTemplate: '❌ Error processing voice note: {{error}}\n\nPlease try again or contact support.',
        },
      },
    },
  ],
  edges: [
    {
      id: 'e1',
      source: 'trigger-telegram',
      target: 'action-download',
      animated: true,
    },
    {
      id: 'e2',
      source: 'action-download',
      target: 'action-transcribe',
      animated: true,
    },
    {
      id: 'e3',
      source: 'action-transcribe',
      target: 'action-ai-process',
      animated: true,
    },
    {
      id: 'e4',
      source: 'action-ai-process',
      target: 'logic-client-check',
      animated: true,
    },
    {
      id: 'e5',
      source: 'logic-client-check',
      sourceHandle: 'true',
      target: 'action-update-client',
      animated: true,
      data: {
        label: 'Has Client',
      },
    },
    {
      id: 'e6',
      source: 'logic-client-check',
      sourceHandle: 'false',
      target: 'action-create-note',
      animated: true,
      data: {
        label: 'No Client',
      },
    },
    {
      id: 'e7',
      source: 'action-update-client',
      target: 'action-notify-success',
      animated: true,
    },
    {
      id: 'e8',
      source: 'action-create-note',
      target: 'action-notify-success',
      animated: true,
    },
  ],
};

// Additional workflow templates for different use cases
export const voiceToCRMTemplates = {
  default: voiceToCRMTemplate,
  
  simpleTranscription: {
    id: 'voice-simple-transcription',
    name: 'Simple Voice Transcription',
    description: 'Basic voice to text conversion without AI processing',
    category: 'Basic',
    toolId: 'voiceToCRM',
    requiredCredentials: ['telegram_bot_token', 'openai_api_key'],
    tags: ['voice', 'transcription', 'simple'],
    nodes: [
      {
        id: 'trigger-1',
        type: 'trigger',
        position: { x: 100, y: 100 },
        data: {
          label: 'Telegram Voice',
          type: 'trigger',
          subtype: 'telegram',
          config: { messageType: 'voice' },
        },
      },
      {
        id: 'action-1',
        type: 'action',
        position: { x: 300, y: 100 },
        data: {
          label: 'Transcribe',
          type: 'action',
          subtype: 'transcription',
          config: { service: 'openai-whisper' },
        },
      },
      {
        id: 'action-2',
        type: 'action',
        position: { x: 500, y: 100 },
        data: {
          label: 'Save to CRM',
          type: 'action',
          subtype: 'crm-update',
          config: { updateType: 'create_note' },
        },
      },
      {
        id: 'action-3',
        type: 'action',
        position: { x: 700, y: 100 },
        data: {
          label: 'Notify',
          type: 'action',
          subtype: 'notification',
          config: { channel: 'telegram' },
        },
      },
    ],
    edges: [
      { id: 'e1', source: 'trigger-1', target: 'action-1', animated: true },
      { id: 'e2', source: 'action-1', target: 'action-2', animated: true },
      { id: 'e3', source: 'action-2', target: 'action-3', animated: true },
    ],
  },
  
  advancedProcessing: {
    id: 'voice-advanced-processing',
    name: 'Advanced Voice Processing',
    description: 'Complete voice processing with sentiment analysis, entity extraction, and multi-channel notifications',
    category: 'Advanced',
    toolId: 'voiceToCRM',
    requiredCredentials: ['telegram_bot_token', 'openai_api_key'],
    tags: ['voice', 'transcription', 'advanced', 'sentiment', 'entities'],
    nodes: [
      // ... Additional nodes for advanced processing
      // Including sentiment analysis, entity extraction, multi-language support,
      // email notifications, task creation, calendar integration, etc.
    ],
    edges: [
      // ... Connections for advanced workflow
    ],
  },
};

// Helper function to load a template into the workflow store
export function loadTemplate(templateId: string) {
  const template = templateId === 'default' 
    ? voiceToCRMTemplate 
    : voiceToCRMTemplates[templateId as keyof typeof voiceToCRMTemplates];
  
  if (!template) {
    throw new Error(`Template ${templateId} not found`);
  }
  
  return {
    id: null,
    name: template.name,
    description: template.description,
    toolId: template.toolId,
    nodes: template.nodes,
    edges: template.edges,
  };
}