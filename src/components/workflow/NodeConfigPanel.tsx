import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { 
  Settings, 
  Database, 
  Play, 
  X, 
  ChevronRight,
  Code,
  FileJson,
  AlertCircle,
  CheckCircle,
  Clock,
  Loader2,
  Copy,
  RefreshCw,
  Terminal
} from 'lucide-react';
import { useWorkflowStore } from '@/stores/workflowStore';
import { WorkflowNode } from '@/stores/workflowStore';
// Removed syntax highlighter for now - can be added later if needed

interface NodeConfigPanelProps {
  node: WorkflowNode | null;
  onClose: () => void;
}

// Node configuration schemas based on type
const nodeConfigs: Record<string, any> = {
  voice: {
    source: {
      label: 'Input Source',
      type: 'select',
      options: [
        { value: 'microphone', label: 'Microphone' },
        { value: 'upload', label: 'File Upload' },
        { value: 'telegram', label: 'Telegram Bot' },
        { value: 'whatsapp', label: 'WhatsApp' },
      ],
    },
    language: {
      label: 'Language',
      type: 'select',
      options: [
        { value: 'en-US', label: 'English (US)' },
        { value: 'en-GB', label: 'English (UK)' },
        { value: 'es-ES', label: 'Spanish' },
        { value: 'fr-FR', label: 'French' },
      ],
    },
    autoStart: {
      label: 'Auto Start Recording',
      type: 'switch',
      default: false,
    },
  },
  transcription: {
    provider: {
      label: 'Transcription Provider',
      type: 'select',
      options: [
        { value: 'web-speech', label: 'Web Speech API (Free)' },
        { value: 'openai', label: 'OpenAI Whisper' },
        { value: 'google', label: 'Google Speech-to-Text' },
      ],
    },
    model: {
      label: 'Model',
      type: 'select',
      options: [
        { value: 'whisper-1', label: 'Whisper v1' },
        { value: 'whisper-large', label: 'Whisper Large' },
      ],
      dependsOn: { provider: 'openai' },
    },
    punctuation: {
      label: 'Auto Punctuation',
      type: 'switch',
      default: true,
    },
    profanityFilter: {
      label: 'Profanity Filter',
      type: 'switch',
      default: false,
    },
  },
  openai: {
    model: {
      label: 'AI Model',
      type: 'select',
      options: [
        { value: 'gpt-4', label: 'GPT-4' },
        { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
        { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
      ],
    },
    temperature: {
      label: 'Temperature',
      type: 'slider',
      min: 0,
      max: 1,
      step: 0.1,
      default: 0.7,
    },
    systemPrompt: {
      label: 'System Prompt',
      type: 'textarea',
      default: 'Extract key information from the transcription and format it for CRM entry.',
    },
    maxTokens: {
      label: 'Max Tokens',
      type: 'number',
      default: 500,
    },
  },
  database: {
    table: {
      label: 'Table Name',
      type: 'select',
      options: [
        { value: 'communications', label: 'Communications' },
        { value: 'leads', label: 'Leads' },
        { value: 'clients', label: 'Clients' },
        { value: 'properties', label: 'Properties' },
      ],
    },
    action: {
      label: 'Action',
      type: 'select',
      options: [
        { value: 'insert', label: 'Insert' },
        { value: 'update', label: 'Update' },
        { value: 'upsert', label: 'Upsert' },
        { value: 'delete', label: 'Delete' },
      ],
    },
    mapping: {
      label: 'Field Mapping',
      type: 'json',
      default: {
        subject: '{{transcription.summary}}',
        content: '{{transcription.full_text}}',
        client_id: '{{extracted.client_id}}',
      },
    },
  },
  condition: {
    expression: {
      label: 'Condition Expression',
      type: 'code',
      language: 'javascript',
      default: 'return data.confidence > 0.8;',
    },
    trueLabel: {
      label: 'True Path Label',
      type: 'text',
      default: 'High Confidence',
    },
    falseLabel: {
      label: 'False Path Label',
      type: 'text',
      default: 'Low Confidence',
    },
  },
  notification: {
    channel: {
      label: 'Notification Channel',
      type: 'select',
      options: [
        { value: 'email', label: 'Email' },
        { value: 'sms', label: 'SMS' },
        { value: 'slack', label: 'Slack' },
        { value: 'webhook', label: 'Webhook' },
      ],
    },
    template: {
      label: 'Message Template',
      type: 'textarea',
      default: 'New communication from {{client.name}}: {{transcription.summary}}',
    },
    recipients: {
      label: 'Recipients',
      type: 'tags',
      default: [],
    },
  },
};

export default function NodeConfigPanel({ node, onClose }: NodeConfigPanelProps) {
  const { updateNode } = useWorkflowStore();
  const [config, setConfig] = useState<Record<string, any>>({});
  const [testOutput, setTestOutput] = useState<any>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [activeTab, setActiveTab] = useState('settings');

  useEffect(() => {
    if (node) {
      setConfig(node.data.config || {});
    }
  }, [node]);

  if (!node) return null;

  const nodeConfig = nodeConfigs[node.data.subtype] || {};

  const handleConfigChange = (key: string, value: any) => {
    const newConfig = { ...config, [key]: value };
    setConfig(newConfig);
    updateNode(node.id, { config: newConfig });
  };

  const handleTestNode = async () => {
    setIsExecuting(true);
    // Simulate node execution
    setTimeout(() => {
      setTestOutput({
        success: true,
        data: {
          input: { text: 'Sample voice input' },
          output: { 
            transcription: 'This is a test transcription',
            confidence: 0.95,
            duration: 3.5
          },
        },
        executionTime: 250,
      });
      setIsExecuting(false);
    }, 1500);
  };

  const renderConfigField = (key: string, fieldConfig: any) => {
    const value = config[key] ?? fieldConfig.default;

    // Check dependencies
    if (fieldConfig.dependsOn) {
      const [depKey, depValue] = Object.entries(fieldConfig.dependsOn)[0];
      if (config[depKey] !== depValue) return null;
    }

    switch (fieldConfig.type) {
      case 'text':
        return (
          <div className="space-y-2">
            <Label htmlFor={key}>{fieldConfig.label}</Label>
            <Input
              id={key}
              value={value || ''}
              onChange={(e) => handleConfigChange(key, e.target.value)}
              placeholder={fieldConfig.placeholder}
            />
          </div>
        );

      case 'number':
        return (
          <div className="space-y-2">
            <Label htmlFor={key}>{fieldConfig.label}</Label>
            <Input
              id={key}
              type="number"
              value={value || ''}
              onChange={(e) => handleConfigChange(key, parseInt(e.target.value))}
            />
          </div>
        );

      case 'textarea':
        return (
          <div className="space-y-2">
            <Label htmlFor={key}>{fieldConfig.label}</Label>
            <Textarea
              id={key}
              value={value || ''}
              onChange={(e) => handleConfigChange(key, e.target.value)}
              rows={4}
            />
          </div>
        );

      case 'select':
        return (
          <div className="space-y-2">
            <Label htmlFor={key}>{fieldConfig.label}</Label>
            <Select value={value} onValueChange={(v) => handleConfigChange(key, v)}>
              <SelectTrigger id={key}>
                <SelectValue placeholder="Select an option" />
              </SelectTrigger>
              <SelectContent>
                {fieldConfig.options.map((option: any) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case 'switch':
        return (
          <div className="flex items-center justify-between">
            <Label htmlFor={key}>{fieldConfig.label}</Label>
            <Switch
              id={key}
              checked={value || false}
              onCheckedChange={(checked) => handleConfigChange(key, checked)}
            />
          </div>
        );

      case 'slider':
        return (
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor={key}>{fieldConfig.label}</Label>
              <span className="text-sm text-muted-foreground">{value}</span>
            </div>
            <Input
              id={key}
              type="range"
              min={fieldConfig.min}
              max={fieldConfig.max}
              step={fieldConfig.step}
              value={value}
              onChange={(e) => handleConfigChange(key, parseFloat(e.target.value))}
              className="cursor-pointer"
            />
          </div>
        );

      case 'code':
        return (
          <div className="space-y-2">
            <Label>{fieldConfig.label}</Label>
            <Textarea
              value={value || ''}
              onChange={(e) => handleConfigChange(key, e.target.value)}
              rows={6}
              className="font-mono text-xs bg-slate-900 text-slate-100 p-3"
              placeholder={`// ${fieldConfig.language || 'javascript'} code`}
            />
          </div>
        );

      case 'json':
        return (
          <div className="space-y-2">
            <Label>{fieldConfig.label}</Label>
            <Textarea
              value={JSON.stringify(value, null, 2)}
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value);
                  handleConfigChange(key, parsed);
                } catch {}
              }}
              rows={6}
              className="font-mono text-xs"
            />
          </div>
        );

      case 'tags':
        return (
          <div className="space-y-2">
            <Label>{fieldConfig.label}</Label>
            <Input
              placeholder="Add recipients (comma separated)"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const input = e.currentTarget;
                  const values = input.value.split(',').map(v => v.trim()).filter(Boolean);
                  handleConfigChange(key, [...(value || []), ...values]);
                  input.value = '';
                }
              }}
            />
            <div className="flex flex-wrap gap-1 mt-2">
              {(value || []).map((tag: string, i: number) => (
                <Badge key={i} variant="secondary" className="text-xs">
                  {tag}
                  <button
                    onClick={() => {
                      const newTags = [...value];
                      newTags.splice(i, 1);
                      handleConfigChange(key, newTags);
                    }}
                    className="ml-1"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card className="w-full h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{node.data.label}</CardTitle>
            <CardDescription className="text-xs">
              {node.data.description}
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden p-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-4 rounded-none border-b">
            <TabsTrigger value="settings">
              <Settings className="h-4 w-4 mr-1" />
              Settings
            </TabsTrigger>
            <TabsTrigger value="input">
              <Database className="h-4 w-4 mr-1" />
              Input
            </TabsTrigger>
            <TabsTrigger value="output">
              <FileJson className="h-4 w-4 mr-1" />
              Output
            </TabsTrigger>
            <TabsTrigger value="execute">
              <Play className="h-4 w-4 mr-1" />
              Execute
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1">
            <TabsContent value="settings" className="p-4 space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Node Name</Label>
                  <Input
                    value={node.data.label}
                    onChange={(e) => updateNode(node.id, { label: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={node.data.description || ''}
                    onChange={(e) => updateNode(node.id, { description: e.target.value })}
                    rows={2}
                  />
                </div>

                <Accordion type="single" collapsible defaultValue="parameters">
                  <AccordionItem value="parameters">
                    <AccordionTrigger>Parameters</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4 pt-2">
                        {Object.entries(nodeConfig).map(([key, fieldConfig]) => (
                          <div key={key}>
                            {renderConfigField(key, fieldConfig)}
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="advanced">
                    <AccordionTrigger>Advanced Settings</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4 pt-2">
                        <div className="space-y-2">
                          <Label>Retry on Failure</Label>
                          <Select
                            value={config.retryCount?.toString() || '0'}
                            onValueChange={(v) => handleConfigChange('retryCount', parseInt(v))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="0">No Retry</SelectItem>
                              <SelectItem value="1">1 Retry</SelectItem>
                              <SelectItem value="2">2 Retries</SelectItem>
                              <SelectItem value="3">3 Retries</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Timeout (seconds)</Label>
                          <Input
                            type="number"
                            value={config.timeout || 30}
                            onChange={(e) => handleConfigChange('timeout', parseInt(e.target.value))}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <Label>Continue on Error</Label>
                          <Switch
                            checked={config.continueOnError || false}
                            onCheckedChange={(checked) => handleConfigChange('continueOnError', checked)}
                          />
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            </TabsContent>

            <TabsContent value="input" className="p-4">
              <div className="space-y-4">
                <div className="rounded-lg border p-3 bg-muted/50">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline">Input Schema</Badge>
                  </div>
                  <pre className="text-xs font-mono overflow-x-auto">
                    {JSON.stringify(
                      {
                        audio: 'base64 | url | stream',
                        format: 'wav | mp3 | m4a',
                        sampleRate: 16000,
                        channels: 1,
                      },
                      null,
                      2
                    )}
                  </pre>
                </div>

                <div className="space-y-2">
                  <Label>Input Mapping</Label>
                  <Textarea
                    value={config.inputMapping || '// Map input data\nreturn {\n  audio: input.audio,\n  format: input.format\n};'}
                    onChange={(e) => handleConfigChange('inputMapping', e.target.value)}
                    rows={6}
                    className="font-mono text-xs"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>Validate Input</Label>
                  <Switch
                    checked={config.validateInput !== false}
                    onCheckedChange={(checked) => handleConfigChange('validateInput', checked)}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="output" className="p-4">
              <div className="space-y-4">
                <div className="rounded-lg border p-3 bg-muted/50">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline">Output Schema</Badge>
                  </div>
                  <pre className="text-xs font-mono overflow-x-auto">
                    {JSON.stringify(
                      {
                        transcription: 'string',
                        confidence: 'number (0-1)',
                        duration: 'number (seconds)',
                        language: 'string',
                        segments: 'array',
                      },
                      null,
                      2
                    )}
                  </pre>
                </div>

                <div className="space-y-2">
                  <Label>Output Transformation</Label>
                  <Textarea
                    value={config.outputTransform || '// Transform output data\nreturn {\n  text: output.transcription,\n  metadata: {\n    confidence: output.confidence\n  }\n};'}
                    onChange={(e) => handleConfigChange('outputTransform', e.target.value)}
                    rows={6}
                    className="font-mono text-xs"
                  />
                </div>

                {testOutput && (
                  <div className="rounded-lg border p-3 bg-muted/50">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant={testOutput.success ? 'default' : 'destructive'}>
                        Last Execution
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {testOutput.executionTime}ms
                      </span>
                    </div>
                    <pre className="text-xs font-mono overflow-x-auto">
                      {JSON.stringify(testOutput.data, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="execute" className="p-4">
              <div className="space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Test Execution</CardTitle>
                    <CardDescription className="text-xs">
                      Run this node with sample data to test configuration
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Test Input Data</Label>
                      <Textarea
                        defaultValue={JSON.stringify({ text: 'Sample input' }, null, 2)}
                        rows={4}
                        className="font-mono text-xs"
                      />
                    </div>

                    <Button 
                      onClick={handleTestNode}
                      disabled={isExecuting}
                      className="w-full"
                    >
                      {isExecuting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Executing...
                        </>
                      ) : (
                        <>
                          <Play className="mr-2 h-4 w-4" />
                          Execute Node
                        </>
                      )}
                    </Button>

                    {testOutput && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          {testOutput.success ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-red-500" />
                          )}
                          <span className="text-sm font-medium">
                            {testOutput.success ? 'Success' : 'Failed'}
                          </span>
                          <Badge variant="outline" className="ml-auto">
                            <Clock className="mr-1 h-3 w-3" />
                            {testOutput.executionTime}ms
                          </Badge>
                        </div>

                        <div className="rounded-lg border p-3 bg-muted/50">
                          <pre className="text-xs font-mono overflow-x-auto">
                            {JSON.stringify(testOutput.data, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Execution History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center justify-between p-2 rounded-lg border">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-3 w-3 text-green-500" />
                            <span className="text-xs">Execution #{i}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            2 mins ago
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </CardContent>
    </Card>
  );
}