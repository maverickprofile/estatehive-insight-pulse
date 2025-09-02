import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Star, Mic, FileText, Bot, Shield, Database, Bell, Save } from 'lucide-react';
import NodeMenu from './NodeMenu';

const iconMap: { [key: string]: any } = {
  whatsapp: MessageCircle,
  scoring: Star,
  transcription: Mic,
  document: FileText,
  nlp: Bot,
  verification: Shield,
  database: Database,
  notification: Bell,
  save: Save,
};

function ActionNode({ data, selected, id, xPos, yPos }: NodeProps) {
  const Icon = iconMap[data.subtype] || Bot;

  const status = data.status || 'idle';
  const statusColors = {
    idle: '',
    running: 'animate-pulse border-blue-500',
    success: 'border-green-500',
    error: 'border-red-500',
  };

  return (
    <Card className={`min-w-[200px] group relative ${selected ? 'ring-2 ring-blue-500' : ''} ${statusColors[status]}`}>
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
      
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-blue-500 !w-3 !h-3 !border-2 !border-white"
        style={{ left: '-6px' }}
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
        <h3 className="font-medium text-sm pr-6">{data.label}</h3>
        {data.description && (
          <p className="text-xs text-muted-foreground mt-1">{data.description}</p>
        )}
        
        {/* Connection Info */}
        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-blue-500/50" />
            <span>In</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <span>Out</span>
          </div>
        </div>
        
        {/* Data Preview */}
        {data.lastExecutionData && (
          <div className="mt-2 p-2 rounded bg-muted text-xs">
            <span className="text-muted-foreground">Data: </span>
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
        className="!bg-blue-500 !w-3 !h-3 !border-2 !border-white"
        style={{ right: '-6px' }}
      />
    </Card>
  );
}

export default memo(ActionNode);