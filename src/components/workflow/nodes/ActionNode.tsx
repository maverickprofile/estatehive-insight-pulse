import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Star, Mic, FileText, Bot, Shield } from 'lucide-react';

const iconMap: { [key: string]: any } = {
  whatsapp: MessageCircle,
  scoring: Star,
  transcription: Mic,
  document: FileText,
  nlp: Bot,
  verification: Shield,
};

function ActionNode({ data, selected }: NodeProps) {
  const Icon = iconMap[data.subtype] || Bot;

  return (
    <Card className={`min-w-[200px] ${selected ? 'ring-2 ring-blue-500' : ''}`}>
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-blue-500 !w-3 !h-3"
      />
      <div className="p-3">
        <div className="flex items-center gap-2 mb-2">
          <div className="p-1.5 rounded bg-blue-500 text-white">
            <Icon className="w-4 h-4" />
          </div>
          <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
            Action
          </Badge>
        </div>
        <h3 className="font-medium text-sm">{data.label}</h3>
        {data.description && (
          <p className="text-xs text-muted-foreground mt-1">{data.description}</p>
        )}
      </div>
      <Handle
        type="source"
        position={Position.Right}
        className="!bg-blue-500 !w-3 !h-3"
      />
    </Card>
  );
}

export default memo(ActionNode);