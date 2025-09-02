import { useCallback, useRef, useState, useEffect } from 'react';
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
  ReactFlowInstance,
  useKeyPress,
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

interface WorkflowCanvasContentProps {
  onLog?: (log: any) => void;
}

function WorkflowCanvasContent({ onLog }: WorkflowCanvasContentProps) {
  const { toast } = useToast();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const [selectedNodes, setSelectedNodes] = useState<string[]>([]);
  
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
    deleteNode,
    selectNode,
  } = useWorkflowStore();

  // Handle delete key press
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.key === 'Delete' || event.key === 'Backspace') && selectedNodes.length > 0) {
        selectedNodes.forEach(nodeId => deleteNode(nodeId));
        setSelectedNodes([]);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedNodes, deleteNode]);

  // Handle node selection
  const onSelectionChange = useCallback((params: any) => {
    const selectedNodeIds = params.nodes.map((node: any) => node.id);
    setSelectedNodes(selectedNodeIds);
    
    // Update the store with the selected node
    if (params.nodes.length === 1) {
      selectNode(params.nodes[0]);
    } else {
      selectNode(null);
    }
  }, [selectNode]);
  
  // Handle node click
  const onNodeClick = useCallback((event: React.MouseEvent, node: any) => {
    selectNode(node);
  }, [selectNode]);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      if (!reactFlowInstance) {
        return;
      }

      const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
      const nodeData = event.dataTransfer.getData('application/reactflow');

      if (!nodeData || !reactFlowBounds) {
        return;
      }

      const parsedData = JSON.parse(nodeData);
      
      // Use screenToFlowPosition for newer versions of ReactFlow
      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      useWorkflowStore.getState().addNode({
        position,
        type: parsedData.nodeType,
        data: parsedData,
      });
      
      onLog?.({
        type: 'info',
        message: `Added ${parsedData.label} node`,
        timestamp: new Date().toISOString(),
        details: `Type: ${parsedData.nodeType}`
      });
    },
    [reactFlowInstance, onLog]
  );

  const handleSave = async () => {
    const validation = validateWorkflow();
    if (!validation.isValid) {
      toast({
        title: 'Validation Error',
        description: validation.errors.join(', '),
        variant: 'destructive',
      });
      onLog?.({
        type: 'error',
        message: 'Workflow validation failed',
        timestamp: new Date().toISOString(),
        details: validation.errors.join(', ')
      });
      return;
    }

    try {
      await saveWorkflow();
      toast({
        title: 'Success',
        description: 'Workflow saved successfully',
      });
      onLog?.({
        type: 'success',
        message: 'Workflow saved successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save workflow',
        variant: 'destructive',
      });
      onLog?.({
        type: 'error',
        message: 'Failed to save workflow',
        timestamp: new Date().toISOString(),
        details: (error as Error).message
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
      onLog?.({
        type: 'warning',
        message: 'Workflow execution stopped',
        timestamp: new Date().toISOString()
      });
    } else {
      const validation = validateWorkflow();
      if (!validation.isValid) {
        toast({
          title: 'Validation Error',
          description: validation.errors.join(', '),
          variant: 'destructive',
        });
        onLog?.({
          type: 'error',
          message: 'Workflow validation failed',
          timestamp: new Date().toISOString(),
          details: validation.errors.join(', ')
        });
        return;
      }
      
      onLog?.({
        type: 'info',
        message: 'Starting workflow execution',
        timestamp: new Date().toISOString(),
        details: `Executing ${nodes.length} nodes`
      });
      
      startExecution();
      toast({
        title: 'Execution Started',
        description: 'Workflow is now running',
      });
    }
  };

  return (
    <div className="w-full h-full min-h-[500px]" style={{ width: '100%', height: '500px' }} ref={reactFlowWrapper}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onInit={setReactFlowInstance}
        onSelectionChange={onSelectionChange}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        deleteKeyCode={['Delete', 'Backspace']}
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

interface WorkflowCanvasProps {
  onLog?: (log: any) => void;
}

export default function WorkflowCanvas({ onLog }: WorkflowCanvasProps) {
  return (
    <div style={{ width: '100%', height: '100%', minHeight: '500px' }}>
      <ReactFlowProvider>
        <WorkflowCanvasContent onLog={onLog} />
      </ReactFlowProvider>
    </div>
  );
}