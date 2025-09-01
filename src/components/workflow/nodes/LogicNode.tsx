import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GitBranch, Repeat, Timer, Filter, Shuffle } from 'lucide-react';

const iconMap: { [key: string]: any } = {
  condition: GitBranch,
  loop: Repeat,
  delay: Timer,
  filter: Filter,
  router: Shuffle,
};

function LogicNode({ data, selected }: NodeProps) {
  const Icon = iconMap[data.subtype] || GitBranch;
  const isRouter = data.subtype === 'router' || data.subtype === 'condition';

  return (
    <Card className={`min-w-[200px] ${selected ? 'ring-2 ring-amber-500' : ''}`}>
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-amber-500 !w-3 !h-3"
      />
      <div className="p-3">
        <div className="flex items-center gap-2 mb-2">
          <div className="p-1.5 rounded bg-amber-500 text-white">
            <Icon className="w-4 h-4" />
          </div>
          <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-700">
            Logic
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
        id="true"
        className="!bg-amber-500 !w-3 !h-3"
        style={{ top: isRouter ? '35%' : '50%' }}
      />
      {isRouter && (
        <Handle
          type="source"
          position={Position.Right}
          id="false"
          className="!bg-amber-500 !w-3 !h-3"
          style={{ top: '65%' }}
        />
      )}
    </Card>
  );
}

export default memo(LogicNode);