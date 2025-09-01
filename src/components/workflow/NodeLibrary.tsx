import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  MessageCircle, 
  Clock, 
  Webhook,
  Mail,
  Database,
  GitBranch,
  Repeat,
  Timer,
  ExternalLink,
  FileText,
  Bot,
  Mic,
  Shield,
  Star,
  LucideIcon,
  Calendar,
  Hash,
  Filter,
  Shuffle
} from 'lucide-react';

interface NodeType {
  id: string;
  label: string;
  type: 'trigger' | 'action' | 'logic' | 'integration';
  subtype: string;
  icon: LucideIcon;
  color: string;
  description: string;
}

const nodeCategories = {
  triggers: {
    label: 'Triggers',
    color: 'from-green-500 to-green-600',
    nodes: [
      {
        id: 'manual-trigger',
        label: 'Manual Trigger',
        type: 'trigger' as const,
        subtype: 'manual',
        icon: Clock,
        color: 'bg-green-500',
        description: 'Start workflow manually',
      },
      {
        id: 'webhook-trigger',
        label: 'Webhook',
        type: 'trigger' as const,
        subtype: 'webhook',
        icon: Webhook,
        color: 'bg-green-500',
        description: 'Trigger via webhook',
      },
      {
        id: 'schedule-trigger',
        label: 'Schedule',
        type: 'trigger' as const,
        subtype: 'schedule',
        icon: Calendar,
        color: 'bg-green-500',
        description: 'Run on schedule',
      },
    ],
  },
  actions: {
    label: 'AI Actions',
    color: 'from-blue-500 to-blue-600',
    nodes: [
      {
        id: 'whatsapp-send',
        label: 'WhatsApp Message',
        type: 'action' as const,
        subtype: 'whatsapp',
        icon: MessageCircle,
        color: 'bg-blue-500',
        description: 'Send WhatsApp message',
      },
      {
        id: 'lead-score',
        label: 'Score Lead',
        type: 'action' as const,
        subtype: 'scoring',
        icon: Star,
        color: 'bg-blue-500',
        description: 'Calculate lead score',
      },
      {
        id: 'voice-transcribe',
        label: 'Transcribe Voice',
        type: 'action' as const,
        subtype: 'transcription',
        icon: Mic,
        color: 'bg-blue-500',
        description: 'Convert voice to text',
      },
      {
        id: 'generate-doc',
        label: 'Generate Document',
        type: 'action' as const,
        subtype: 'document',
        icon: FileText,
        color: 'bg-blue-500',
        description: 'Create PDF document',
      },
      {
        id: 'summarize-text',
        label: 'Summarize Text',
        type: 'action' as const,
        subtype: 'nlp',
        icon: Bot,
        color: 'bg-blue-500',
        description: 'AI text summarization',
      },
      {
        id: 'verify-identity',
        label: 'Verify Identity',
        type: 'action' as const,
        subtype: 'verification',
        icon: Shield,
        color: 'bg-blue-500',
        description: 'Document verification',
      },
    ],
  },
  logic: {
    label: 'Logic',
    color: 'from-amber-500 to-amber-600',
    nodes: [
      {
        id: 'condition',
        label: 'Condition',
        type: 'logic' as const,
        subtype: 'condition',
        icon: GitBranch,
        color: 'bg-amber-500',
        description: 'If/then branching',
      },
      {
        id: 'loop',
        label: 'Loop',
        type: 'logic' as const,
        subtype: 'loop',
        icon: Repeat,
        color: 'bg-amber-500',
        description: 'Repeat actions',
      },
      {
        id: 'delay',
        label: 'Delay',
        type: 'logic' as const,
        subtype: 'delay',
        icon: Timer,
        color: 'bg-amber-500',
        description: 'Wait before continuing',
      },
      {
        id: 'filter',
        label: 'Filter',
        type: 'logic' as const,
        subtype: 'filter',
        icon: Filter,
        color: 'bg-amber-500',
        description: 'Filter data',
      },
      {
        id: 'router',
        label: 'Router',
        type: 'logic' as const,
        subtype: 'router',
        icon: Shuffle,
        color: 'bg-amber-500',
        description: 'Route to multiple paths',
      },
    ],
  },
  integrations: {
    label: 'Integrations',
    color: 'from-purple-500 to-purple-600',
    nodes: [
      {
        id: 'api-call',
        label: 'API Call',
        type: 'integration' as const,
        subtype: 'api',
        icon: ExternalLink,
        color: 'bg-purple-500',
        description: 'External API request',
      },
      {
        id: 'database',
        label: 'Database',
        type: 'integration' as const,
        subtype: 'database',
        icon: Database,
        color: 'bg-purple-500',
        description: 'Database operations',
      },
      {
        id: 'email',
        label: 'Send Email',
        type: 'integration' as const,
        subtype: 'email',
        icon: Mail,
        color: 'bg-purple-500',
        description: 'Send email notification',
      },
    ],
  },
};

function NodeItem({ node }: { node: NodeType }) {
  const Icon = node.icon;
  
  const onDragStart = (event: React.DragEvent, nodeData: NodeType) => {
    event.dataTransfer.setData(
      'application/reactflow',
      JSON.stringify({
        nodeType: node.type,
        label: nodeData.label,
        type: nodeData.type,
        subtype: nodeData.subtype,
        description: nodeData.description,
        icon: nodeData.icon.name,
        color: nodeData.color,
        config: {},
      })
    );
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, node)}
      className="cursor-move"
    >
      <Card className="p-3 hover:shadow-md transition-shadow border-border hover:border-primary/50">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg ${node.color} text-white`}>
            <Icon className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium truncate">{node.label}</h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              {node.description}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default function NodeLibrary() {
  return (
    <div className="h-full flex flex-col bg-card border-r">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold">Node Library</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Drag nodes to canvas
        </p>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {Object.entries(nodeCategories).map(([key, category]) => (
            <div key={key}>
              <div className="flex items-center gap-2 mb-3">
                <Badge 
                  variant="secondary"
                  className={`bg-gradient-to-r ${category.color} text-white border-0`}
                >
                  {category.label}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {category.nodes.length} nodes
                </span>
              </div>
              <div className="space-y-2">
                {category.nodes.map((node) => (
                  <NodeItem key={node.id} node={node} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}