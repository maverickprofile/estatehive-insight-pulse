import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Webhook, Calendar, Mic, FileAudio } from 'lucide-react';
import NodeMenu from './NodeMenu';

const iconMap: { [key: string]: any } = {
  manual: Clock,
  webhook: Webhook,
  schedule: Calendar,
  voice: Mic,
  audio: FileAudio,
};

function TriggerNode({ data, selected, id, xPos, yPos }: NodeProps) {
  const Icon = iconMap[data.subtype] || Clock;
  const status = data.status || 'idle'; // idle, running, success, error

  const statusColors = {
    idle: '',
    running: 'animate-pulse border-blue-500',
    success: 'border-green-500',
    error: 'border-red-500',
  };

  return (
    <Card className={`min-w-[200px] group relative ${selected ? 'ring-2 ring-green-500' : ''} ${statusColors[status]}`}>
      <NodeMenu 
        nodeId={id} 
        nodeData={data} 
        nodePosition={{ x: xPos, y: yPos }}
      />
      
      {/* Status Indicator */}
      {status !== 'idle' && (
        <div className="absolute -top-2 -right-2 z-10">
          {status === 'running' && (
            <div className="h-4 w-4 rounded-full bg-blue-500 animate-pulse" />
          )}
          {status === 'success' && (
            <div className="h-4 w-4 rounded-full bg-green-500 flex items-center justify-center">
              <span className="text-white text-xs">✓</span>
            </div>
          )}
          {status === 'error' && (
            <div className="h-4 w-4 rounded-full bg-red-500 flex items-center justify-center">
              <span className="text-white text-xs">!</span>
            </div>
          )}
        </div>
      )}
      
      {/* Input Handle - Even triggers can receive input from other nodes */}
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-green-500 !w-3 !h-3 !border-2 !border-white"
        style={{ left: '-6px' }}
      />
      
      <div className="p-3">
        <div className="flex items-center gap-2 mb-2">
          <div className="p-1.5 rounded bg-green-500 text-white">
            <Icon className="w-4 h-4" />
          </div>
          <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
            Trigger
          </Badge>
        </div>
        <h3 className="font-medium text-sm pr-6">{data.label}</h3>
        {data.description && (
          <p className="text-xs text-muted-foreground mt-1">{data.description}</p>
        )}
        
        {/* Connection Info */}
        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-green-500/50" />
            <span>In</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span>Out</span>
          </div>
        </div>
        
        {/* Data Preview */}
        {data.lastExecutionData && (
          <div className="mt-2 p-2 rounded bg-muted text-xs">
            <span className="text-muted-foreground">Output: </span>
            <span className="font-mono">
              {typeof data.lastExecutionData === 'object' 
                ? JSON.stringify(data.lastExecutionData).substring(0, 50) + '...'
                : data.lastExecutionData}
            </span>
          </div>
        )}
      </div>
      
      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        className="!bg-green-500 !w-3 !h-3 !border-2 !border-white"
        style={{ right: '-6px' }}
      />
    </Card>
  );
}

export default memo(TriggerNode);