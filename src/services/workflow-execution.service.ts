import { WorkflowNode, WorkflowEdge } from '@/stores/workflowStore';
import { transcriptionService } from './transcription.service';
import { aiProcessingService } from './ai-processing.service';
import { supabase } from '@/lib/supabaseClient';
import { improvedWebSpeech } from './web-speech-improved.service';

export interface ExecutionContext {
  workflowId: string;
  executionId: string;
  startTime: number;
  data: Map<string, any>;
  errors: Map<string, any>;
  status: 'running' | 'completed' | 'failed';
}

export interface NodeExecutor {
  execute: (node: WorkflowNode, input: any, context: ExecutionContext) => Promise<any>;
}

// Node executors for different node types
const nodeExecutors: Record<string, NodeExecutor> = {
  voice: {
    async execute(node, input, context) {
      const config = node.data.config;
      
      // Simulate voice input capture
      if (config.source === 'microphone') {
        // In real implementation, this would capture from microphone
        return {
          audio: 'base64_audio_data',
          format: 'wav',
          duration: 5.2,
          sampleRate: 16000,
        };
      }
      
      return input;
    },
  },
  
  transcription: {
    async execute(node, input, context) {
      const config = node.data.config;
      
      if (config.provider === 'web-speech') {
        // Use Web Speech API
        const result = await improvedWebSpeech.startTranscription();
        return {
          transcription: result.transcript,
          confidence: result.confidence,
          isFinal: result.isFinal,
        };
      } else if (config.provider === 'openai') {
        // Use OpenAI Whisper
        const result = await transcriptionService.transcribe(input.audio, {
          model: config.model || 'whisper-1',
        });
        return {
          transcription: result.text,
          confidence: 0.95,
          segments: result.segments,
        };
      }
      
      return {
        transcription: 'Sample transcription text',
        confidence: 0.9,
      };
    },
  },
  
  openai: {
    async execute(node, input, context) {
      const config = node.data.config;
      
      const result = await aiProcessingService.processTranscription(
        input.transcription,
        {
          model: config.model || 'gpt-3.5-turbo',
          temperature: config.temperature || 0.7,
          systemPrompt: config.systemPrompt,
        }
      );
      
      return {
        processed: result.processed,
        extracted: result.extracted,
        summary: result.summary,
      };
    },
  },
  
  database: {
    async execute(node, input, context) {
      const config = node.data.config;
      
      // Map input data to database fields
      const mappedData = Object.entries(config.mapping || {}).reduce((acc, [key, template]) => {
        // Simple template replacement
        let value = template as string;
        if (typeof value === 'string') {
          value = value.replace(/\{\{(.+?)\}\}/g, (match, path) => {
            const keys = path.trim().split('.');
            let result = input;
            for (const key of keys) {
              result = result?.[key];
            }
            return result || match;
          });
        }
        acc[key] = value;
        return acc;
      }, {} as any);
      
      // Execute database operation
      let result;
      switch (config.action) {
        case 'insert':
          result = await supabase.from(config.table).insert(mappedData);
          break;
        case 'update':
          result = await supabase.from(config.table).update(mappedData);
          break;
        case 'upsert':
          result = await supabase.from(config.table).upsert(mappedData);
          break;
        default:
          throw new Error(`Unknown database action: ${config.action}`);
      }
      
      if (result.error) throw result.error;
      
      return {
        success: true,
        data: result.data,
        count: result.count,
      };
    },
  },
  
  condition: {
    async execute(node, input, context) {
      const config = node.data.config;
      
      // Execute condition expression
      const fn = new Function('data', 'context', config.expression || 'return true;');
      const result = fn(input, context);
      
      return {
        result,
        branch: result ? 'true' : 'false',
        input,
      };
    },
  },
  
  notification: {
    async execute(node, input, context) {
      const config = node.data.config;
      
      // Format message from template
      let message = config.template || '';
      message = message.replace(/\{\{(.+?)\}\}/g, (match, path) => {
        const keys = path.trim().split('.');
        let result = input;
        for (const key of keys) {
          result = result?.[key];
        }
        return result || match;
      });
      
      // Send notification based on channel
      switch (config.channel) {
        case 'email':
          // Send email notification
          console.log('Sending email:', message);
          break;
        case 'slack':
          // Send Slack notification
          console.log('Sending to Slack:', message);
          break;
        case 'webhook':
          // Send webhook
          console.log('Sending webhook:', message);
          break;
      }
      
      return {
        sent: true,
        message,
        channel: config.channel,
        recipients: config.recipients,
      };
    },
  },
};

export class WorkflowExecutionService {
  private executionContexts: Map<string, ExecutionContext> = new Map();
  
  async executeWorkflow(
    nodes: WorkflowNode[],
    edges: WorkflowEdge[],
    workflowId: string,
    initialData?: any
  ): Promise<ExecutionContext> {
    const executionId = crypto.randomUUID();
    const context: ExecutionContext = {
      workflowId,
      executionId,
      startTime: Date.now(),
      data: new Map(),
      errors: new Map(),
      status: 'running',
    };
    
    this.executionContexts.set(executionId, context);
    
    try {
      // Find trigger nodes
      const triggerNodes = nodes.filter(n => n.data.type === 'trigger');
      
      if (triggerNodes.length === 0) {
        throw new Error('No trigger node found in workflow');
      }
      
      // Execute workflow starting from triggers
      for (const trigger of triggerNodes) {
        await this.executeNode(trigger, initialData || {}, nodes, edges, context);
      }
      
      context.status = 'completed';
    } catch (error) {
      context.status = 'failed';
      context.errors.set('workflow', error);
      throw error;
    }
    
    return context;
  }
  
  private async executeNode(
    node: WorkflowNode,
    input: any,
    allNodes: WorkflowNode[],
    allEdges: WorkflowEdge[],
    context: ExecutionContext,
    visitedNodes: Set<string> = new Set()
  ): Promise<any> {
    // Prevent infinite loops
    if (visitedNodes.has(node.id)) {
      return context.data.get(node.id);
    }
    visitedNodes.add(node.id);
    
    try {
      // Update node status
      this.updateNodeStatus(node.id, 'running');
      
      // Get executor for node type
      const executor = nodeExecutors[node.data.subtype];
      if (!executor) {
        throw new Error(`No executor found for node type: ${node.data.subtype}`);
      }
      
      // Execute node
      const output = await executor.execute(node, input, context);
      
      // Store output in context
      context.data.set(node.id, output);
      
      // Update node with execution data
      this.updateNodeStatus(node.id, 'success', output);
      
      // Find connected nodes
      const connectedEdges = allEdges.filter(e => e.source === node.id);
      
      // Execute connected nodes
      for (const edge of connectedEdges) {
        const targetNode = allNodes.find(n => n.id === edge.target);
        if (targetNode) {
          // For condition nodes, check which branch to follow
          if (node.data.subtype === 'condition') {
            const branch = output.branch || 'true';
            if (edge.sourceHandle === branch || !edge.sourceHandle) {
              await this.executeNode(targetNode, output, allNodes, allEdges, context, visitedNodes);
            }
          } else {
            await this.executeNode(targetNode, output, allNodes, allEdges, context, visitedNodes);
          }
        }
      }
      
      return output;
    } catch (error) {
      // Update node status to error
      this.updateNodeStatus(node.id, 'error', error);
      context.errors.set(node.id, error);
      
      // Check if should continue on error
      if (!node.data.config?.continueOnError) {
        throw error;
      }
      
      return null;
    }
  }
  
  private updateNodeStatus(nodeId: string, status: string, data?: any) {
    // This would update the node in the store with status and execution data
    // For now, just log it
    console.log(`Node ${nodeId} status: ${status}`, data);
    
    // In real implementation, update the store
    // useWorkflowStore.getState().updateNode(nodeId, { 
    //   status, 
    //   lastExecutionData: data 
    // });
  }
  
  async testNode(node: WorkflowNode, testInput: any): Promise<any> {
    const executor = nodeExecutors[node.data.subtype];
    if (!executor) {
      throw new Error(`No executor found for node type: ${node.data.subtype}`);
    }
    
    const context: ExecutionContext = {
      workflowId: 'test',
      executionId: 'test-' + Date.now(),
      startTime: Date.now(),
      data: new Map(),
      errors: new Map(),
      status: 'running',
    };
    
    return executor.execute(node, testInput, context);
  }
  
  getExecutionContext(executionId: string): ExecutionContext | undefined {
    return this.executionContexts.get(executionId);
  }
  
  clearExecutionContext(executionId: string): void {
    this.executionContexts.delete(executionId);
  }
}

export const workflowExecutionService = new WorkflowExecutionService();