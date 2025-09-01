import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Database, Mail } from 'lucide-react';

const iconMap: { [key: string]: any } = {
  api: ExternalLink,
  database: Database,
  email: Mail,
};

function IntegrationNode({ data, selected }: NodeProps) {
  const Icon = iconMap[data.subtype] || ExternalLink;

  return (
    <Card className={`min-w-[200px] ${selected ? 'ring-2 ring-purple-500' : ''}`}>
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-purple-500 !w-3 !h-3"
      />
      <div className="p-3">
        <div className="flex items-center gap-2 mb-2">
          <div className="p-1.5 rounded bg-purple-500 text-white">
            <Icon className="w-4 h-4" />
          </div>
          <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700">
            Integration
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
        className="!bg-purple-500 !w-3 !h-3"
      />
    </Card>
  );
}

export default memo(IntegrationNode);