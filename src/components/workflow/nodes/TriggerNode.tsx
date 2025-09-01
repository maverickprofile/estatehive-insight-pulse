import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Webhook, Calendar } from 'lucide-react';

const iconMap: { [key: string]: any } = {
  manual: Clock,
  webhook: Webhook,
  schedule: Calendar,
};

function TriggerNode({ data, selected }: NodeProps) {
  const Icon = iconMap[data.subtype] || Clock;

  return (
    <Card className={`min-w-[200px] ${selected ? 'ring-2 ring-green-500' : ''}`}>
      <div className="p-3">
        <div className="flex items-center gap-2 mb-2">
          <div className="p-1.5 rounded bg-green-500 text-white">
            <Icon className="w-4 h-4" />
          </div>
          <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
            Trigger
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
        className="!bg-green-500 !w-3 !h-3"
      />
    </Card>
  );
}

export default memo(TriggerNode);