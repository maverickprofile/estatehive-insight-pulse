import { create } from 'zustand';
import { 
  Node, 
  Edge, 
  Connection, 
  NodeChange, 
  EdgeChange,
  applyNodeChanges,
  applyEdgeChanges,
  MarkerType
} from '@xyflow/react';
import { v4 as uuidv4 } from 'uuid';

export interface WorkflowNode extends Node {
  data: {
    label: string;
    type: 'trigger' | 'action' | 'logic' | 'integration';
    subtype: string;
    config: Record<string, any>;
    description?: string;
    icon?: string;
    color?: string;
  };
}

export interface WorkflowEdge extends Edge {
  data?: {
    condition?: string;
    label?: string;
  };
}

interface WorkflowState {
  // Current workflow data
  workflowId: string | null;
  workflowName: string;
  workflowDescription: string;
  toolId: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  
  // UI state
  selectedNode: WorkflowNode | null;
  selectedEdge: WorkflowEdge | null;
  isExecuting: boolean;
  executionLogs: any[];
  isDirty: boolean;
  
  // Actions
  setWorkflow: (workflow: {
    id: string | null;
    name: string;
    description: string;
    toolId: string;
    nodes: WorkflowNode[];
    edges: WorkflowEdge[];
  }) => void;
  
  // Node operations
  addNode: (node: Omit<WorkflowNode, 'id'>) => void;
  updateNode: (nodeId: string, data: Partial<WorkflowNode['data']>) => void;
  deleteNode: (nodeId: string) => void;
  onNodesChange: (changes: NodeChange[]) => void;
  
  // Edge operations
  addEdge: (connection: Connection) => void;
  updateEdge: (edgeId: string, data: Partial<WorkflowEdge['data']>) => void;
  deleteEdge: (edgeId: string) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  
  // Selection
  selectNode: (node: WorkflowNode | null) => void;
  selectEdge: (edge: WorkflowEdge | null) => void;
  
  // Execution
  startExecution: () => void;
  stopExecution: () => void;
  addExecutionLog: (log: any) => void;
  clearExecutionLogs: () => void;
  
  // Workflow management
  saveWorkflow: () => Promise<void>;
  loadWorkflow: (workflowId: string) => Promise<void>;
  clearWorkflow: () => void;
  setDirty: (isDirty: boolean) => void;
  
  // Validation
  validateWorkflow: () => { isValid: boolean; errors: string[] };
}

const defaultEdgeOptions = {
  animated: true,
  style: { strokeWidth: 2 },
  markerEnd: {
    type: MarkerType.ArrowClosed,
    width: 20,
    height: 20,
  },
};

export const useWorkflowStore = create<WorkflowState>((set, get) => ({
  // Initial state
  workflowId: null,
  workflowName: 'Untitled Workflow',
  workflowDescription: '',
  toolId: '',
  nodes: [],
  edges: [],
  selectedNode: null,
  selectedEdge: null,
  isExecuting: false,
  executionLogs: [],
  isDirty: false,

  // Set entire workflow
  setWorkflow: (workflow) => {
    set({
      workflowId: workflow.id,
      workflowName: workflow.name,
      workflowDescription: workflow.description,
      toolId: workflow.toolId,
      nodes: workflow.nodes,
      edges: workflow.edges,
      isDirty: false,
    });
  },

  // Node operations
  addNode: (nodeData) => {
    const newNode: WorkflowNode = {
      ...nodeData,
      id: uuidv4(),
    };
    set((state) => ({
      nodes: [...state.nodes, newNode],
      isDirty: true,
    }));
  },

  updateNode: (nodeId, data) => {
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, ...data } }
          : node
      ),
      isDirty: true,
    }));
  },

  deleteNode: (nodeId) => {
    set((state) => ({
      nodes: state.nodes.filter((node) => node.id !== nodeId),
      edges: state.edges.filter(
        (edge) => edge.source !== nodeId && edge.target !== nodeId
      ),
      selectedNode: state.selectedNode?.id === nodeId ? null : state.selectedNode,
      isDirty: true,
    }));
  },

  onNodesChange: (changes) => {
    set((state) => ({
      nodes: applyNodeChanges(changes, state.nodes) as WorkflowNode[],
      isDirty: true,
    }));
  },

  // Edge operations
  addEdge: (connection) => {
    if (!connection.source || !connection.target) return;
    
    const newEdge: WorkflowEdge = {
      id: `${connection.source}-${connection.target}-${uuidv4()}`,
      source: connection.source,
      target: connection.target,
      sourceHandle: connection.sourceHandle || undefined,
      targetHandle: connection.targetHandle || undefined,
      ...defaultEdgeOptions,
    };
    
    set((state) => ({
      edges: [...state.edges, newEdge],
      isDirty: true,
    }));
  },

  updateEdge: (edgeId, data) => {
    set((state) => ({
      edges: state.edges.map((edge) =>
        edge.id === edgeId
          ? { ...edge, data: { ...edge.data, ...data } }
          : edge
      ),
      isDirty: true,
    }));
  },

  deleteEdge: (edgeId) => {
    set((state) => ({
      edges: state.edges.filter((edge) => edge.id !== edgeId),
      selectedEdge: state.selectedEdge?.id === edgeId ? null : state.selectedEdge,
      isDirty: true,
    }));
  },

  onEdgesChange: (changes) => {
    set((state) => ({
      edges: applyEdgeChanges(changes, state.edges) as WorkflowEdge[],
      isDirty: true,
    }));
  },

  onConnect: (connection) => {
    get().addEdge(connection);
  },

  // Selection
  selectNode: (node) => {
    set({ selectedNode: node, selectedEdge: null });
  },

  selectEdge: (edge) => {
    set({ selectedEdge: edge, selectedNode: null });
  },

  // Execution
  startExecution: () => {
    set({ isExecuting: true, executionLogs: [] });
  },

  stopExecution: () => {
    set({ isExecuting: false });
  },

  addExecutionLog: (log) => {
    set((state) => ({
      executionLogs: [...state.executionLogs, { ...log, timestamp: new Date() }],
    }));
  },

  clearExecutionLogs: () => {
    set({ executionLogs: [] });
  },

  // Workflow management
  saveWorkflow: async () => {
    const state = get();
    
    // Here you would integrate with Supabase to save the workflow
    const workflowData = {
      id: state.workflowId,
      name: state.workflowName,
      description: state.workflowDescription,
      tool_id: state.toolId,
      workflow_data: {
        nodes: state.nodes,
        edges: state.edges,
      },
    };
    
    // TODO: Implement Supabase save logic
    console.log('Saving workflow:', workflowData);
    
    set({ isDirty: false });
  },

  loadWorkflow: async (workflowId) => {
    // TODO: Implement Supabase load logic
    console.log('Loading workflow:', workflowId);
  },

  clearWorkflow: () => {
    set({
      workflowId: null,
      workflowName: 'Untitled Workflow',
      workflowDescription: '',
      nodes: [],
      edges: [],
      selectedNode: null,
      selectedEdge: null,
      isExecuting: false,
      executionLogs: [],
      isDirty: false,
    });
  },

  setDirty: (isDirty) => {
    set({ isDirty });
  },

  // Validation
  validateWorkflow: () => {
    const state = get();
    const errors: string[] = [];
    
    // Check if workflow has at least one trigger node
    const triggerNodes = state.nodes.filter(n => n.data.type === 'trigger');
    if (triggerNodes.length === 0 && state.nodes.length > 0) {
      errors.push('Workflow must have at least one trigger node');
    }
    
    // Check for disconnected nodes only if we have more than 1 node
    if (state.nodes.length > 1) {
      const connectedNodeIds = new Set<string>();
      
      // Add trigger nodes as connected by default
      triggerNodes.forEach(node => connectedNodeIds.add(node.id));
      
      // Add all nodes that are connected via edges
      state.edges.forEach(edge => {
        connectedNodeIds.add(edge.source);
        connectedNodeIds.add(edge.target);
      });
      
      // Find disconnected nodes (exclude trigger nodes and single-node workflows)
      const disconnectedNodes = state.nodes.filter(
        node => !connectedNodeIds.has(node.id) && node.data.type !== 'trigger'
      );
      
      // Only report as error if there are non-trigger disconnected nodes
      if (disconnectedNodes.length > 0 && state.edges.length > 0) {
        console.warn(`Found ${disconnectedNodes.length} potentially disconnected node(s)`, disconnectedNodes);
        // Don't treat as error for now, just warn
      }
    }
    
    // Check for cycles (simplified check)
    // TODO: Implement proper cycle detection
    
    return {
      isValid: errors.length === 0,
      errors,
    };
  },
}));