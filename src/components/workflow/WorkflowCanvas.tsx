import { useCallback, useRef } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  ReactFlowProvider,
  Panel,
  useReactFlow,
  NodeTypes,
  EdgeTypes,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useWorkflowStore } from '@/stores/workflowStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  Save, 
  Download, 
  Upload, 
  Undo, 
  Redo,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import TriggerNode from './nodes/TriggerNode';
import ActionNode from './nodes/ActionNode';
import LogicNode from './nodes/LogicNode';
import IntegrationNode from './nodes/IntegrationNode';

const nodeTypes: NodeTypes = {
  trigger: TriggerNode,
  action: ActionNode,
  logic: LogicNode,
  integration: IntegrationNode,
};

const edgeTypes: EdgeTypes = {};

function WorkflowCanvasContent() {
  const { toast } = useToast();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { project } = useReactFlow();
  
  const {
    nodes,
    edges,
    workflowName,
    isDirty,
    isExecuting,
    onNodesChange,
    onEdgesChange,
    onConnect,
    saveWorkflow,
    validateWorkflow,
    startExecution,
    stopExecution,
  } = useWorkflowStore();

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
      const nodeData = event.dataTransfer.getData('application/reactflow');

      if (!nodeData || !reactFlowBounds) {
        return;
      }

      const parsedData = JSON.parse(nodeData);
      const position = project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      useWorkflowStore.getState().addNode({
        position,
        type: parsedData.nodeType,
        data: parsedData,
      });
    },
    [project]
  );

  const handleSave = async () => {
    const validation = validateWorkflow();
    if (!validation.isValid) {
      toast({
        title: 'Validation Error',
        description: validation.errors.join(', '),
        variant: 'destructive',
      });
      return;
    }

    try {
      await saveWorkflow();
      toast({
        title: 'Success',
        description: 'Workflow saved successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save workflow',
        variant: 'destructive',
      });
    }
  };

  const handleExecute = () => {
    if (isExecuting) {
      stopExecution();
      toast({
        title: 'Execution Stopped',
        description: 'Workflow execution has been stopped',
      });
    } else {
      const validation = validateWorkflow();
      if (!validation.isValid) {
        toast({
          title: 'Validation Error',
          description: validation.errors.join(', '),
          variant: 'destructive',
        });
        return;
      }
      
      startExecution();
      toast({
        title: 'Execution Started',
        description: 'Workflow is now running',
      });
    }
  };

  return (
    <div className="w-full h-full" ref={reactFlowWrapper}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDragOver={onDragOver}
        onDrop={onDrop}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        proOptions={{ hideAttribution: true }}
      >
        <Background 
          variant={BackgroundVariant.Dots} 
          gap={12} 
          size={1}
          className="bg-background"
        />
        <Controls />
        <MiniMap 
          nodeColor={(node) => {
            switch (node.data?.type) {
              case 'trigger': return '#10b981';
              case 'action': return '#3b82f6';
              case 'logic': return '#f59e0b';
              case 'integration': return '#8b5cf6';
              default: return '#6b7280';
            }
          }}
          className="!bg-card !border-border"
        />
        
        <Panel position="top-left" className="flex items-center gap-2">
          <div className="bg-card/95 backdrop-blur border rounded-lg p-2 flex items-center gap-2">
            <h3 className="font-semibold text-sm">{workflowName}</h3>
            {isDirty && (
              <Badge variant="secondary" className="text-xs">
                <AlertCircle className="w-3 h-3 mr-1" />
                Unsaved
              </Badge>
            )}
            {isExecuting && (
              <Badge variant="default" className="text-xs animate-pulse">
                <CheckCircle className="w-3 h-3 mr-1" />
                Running
              </Badge>
            )}
          </div>
        </Panel>
        
        <Panel position="top-right" className="flex gap-2">
          <Button
            onClick={handleExecute}
            variant={isExecuting ? "destructive" : "default"}
            size="sm"
          >
            <Play className="w-4 h-4 mr-1" />
            {isExecuting ? 'Stop' : 'Run'}
          </Button>
          <Button
            onClick={handleSave}
            variant="outline"
            size="sm"
            disabled={!isDirty}
          >
            <Save className="w-4 h-4 mr-1" />
            Save
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-1" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <Upload className="w-4 h-4 mr-1" />
            Import
          </Button>
        </Panel>
      </ReactFlow>
    </div>
  );
}

export default function WorkflowCanvas() {
  return (
    <ReactFlowProvider>
      <WorkflowCanvasContent />
    </ReactFlowProvider>
  );
}