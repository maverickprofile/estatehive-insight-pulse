import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useWorkflowStore } from '@/stores/workflowStore';
import { Trash2, Settings, Info, Code } from 'lucide-react';

export default function NodeEditor() {
  const { selectedNode, selectedEdge, updateNode, deleteNode, deleteEdge } = useWorkflowStore();
  const [config, setConfig] = useState<Record<string, any>>({});

  useEffect(() => {
    if (selectedNode) {
      setConfig(selectedNode.data.config || {});
    }
  }, [selectedNode]);

  const handleConfigChange = (key: string, value: any) => {
    const newConfig = { ...config, [key]: value };
    setConfig(newConfig);
    if (selectedNode) {
      updateNode(selectedNode.id, { config: newConfig });
    }
  };

  const handleDelete = () => {
    if (selectedNode) {
      deleteNode(selectedNode.id);
    } else if (selectedEdge) {
      deleteEdge(selectedEdge.id);
    }
  };

  if (!selectedNode && !selectedEdge) {
    return (
      <div className="h-full flex flex-col bg-card border-l">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Node Editor</h2>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center text-muted-foreground">
            <Info className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">Select a node or edge to edit</p>
          </div>
        </div>
      </div>
    );
  }

  if (selectedEdge) {
    return (
      <div className="h-full flex flex-col bg-card border-l">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Edge Configuration</h2>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Connection Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-xs">Connection ID</Label>
                  <p className="text-sm font-mono mt-1">{selectedEdge.id}</p>
                </div>
                <div>
                  <Label className="text-xs">Source → Target</Label>
                  <p className="text-sm mt-1">
                    {selectedEdge.source} → {selectedEdge.target}
                  </p>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDelete}
                  className="w-full"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Connection
                </Button>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      </div>
    );
  }

  const renderNodeConfig = () => {
    if (!selectedNode) return null;

    switch (selectedNode.data.subtype) {
      case 'webhook':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="webhook-url">Webhook URL</Label>
              <Input
                id="webhook-url"
                value={config.webhookUrl || ''}
                onChange={(e) => handleConfigChange('webhookUrl', e.target.value)}
                placeholder="https://your-domain.com/webhook"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="webhook-secret">Secret Key</Label>
              <Input
                id="webhook-secret"
                type="password"
                value={config.secretKey || ''}
                onChange={(e) => handleConfigChange('secretKey', e.target.value)}
                placeholder="Optional secret for validation"
              />
            </div>
          </>
        );

      case 'schedule':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="cron">Cron Expression</Label>
              <Input
                id="cron"
                value={config.cronExpression || ''}
                onChange={(e) => handleConfigChange('cronExpression', e.target.value)}
                placeholder="0 0 * * *"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Select
                value={config.timezone || 'UTC'}
                onValueChange={(value) => handleConfigChange('timezone', value)}
              >
                <SelectTrigger id="timezone">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UTC">UTC</SelectItem>
                  <SelectItem value="Asia/Kolkata">Asia/Kolkata</SelectItem>
                  <SelectItem value="America/New_York">America/New_York</SelectItem>
                  <SelectItem value="Europe/London">Europe/London</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        );

      case 'whatsapp':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={config.phoneNumber || ''}
                onChange={(e) => handleConfigChange('phoneNumber', e.target.value)}
                placeholder="+91XXXXXXXXXX"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Message Template</Label>
              <Textarea
                id="message"
                value={config.messageTemplate || ''}
                onChange={(e) => handleConfigChange('messageTemplate', e.target.value)}
                placeholder="Hello {{name}}, your property inquiry..."
                rows={4}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="multi-lang"
                checked={config.multiLanguage || false}
                onCheckedChange={(checked) => handleConfigChange('multiLanguage', checked)}
              />
              <Label htmlFor="multi-lang">Enable Multi-language</Label>
            </div>
          </>
        );

      case 'scoring':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="score-model">Scoring Model</Label>
              <Select
                value={config.model || 'default'}
                onValueChange={(value) => handleConfigChange('model', value)}
              >
                <SelectTrigger id="score-model">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default Model</SelectItem>
                  <SelectItem value="advanced">Advanced ML Model</SelectItem>
                  <SelectItem value="custom">Custom Rules</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="threshold">Score Threshold</Label>
              <Input
                id="threshold"
                type="number"
                value={config.threshold || 70}
                onChange={(e) => handleConfigChange('threshold', parseInt(e.target.value))}
                min="0"
                max="100"
              />
            </div>
          </>
        );

      case 'condition':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="condition-field">Field to Check</Label>
              <Input
                id="condition-field"
                value={config.field || ''}
                onChange={(e) => handleConfigChange('field', e.target.value)}
                placeholder="lead.score"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="operator">Operator</Label>
              <Select
                value={config.operator || 'equals'}
                onValueChange={(value) => handleConfigChange('operator', value)}
              >
                <SelectTrigger id="operator">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="equals">Equals</SelectItem>
                  <SelectItem value="not_equals">Not Equals</SelectItem>
                  <SelectItem value="greater_than">Greater Than</SelectItem>
                  <SelectItem value="less_than">Less Than</SelectItem>
                  <SelectItem value="contains">Contains</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="condition-value">Value</Label>
              <Input
                id="condition-value"
                value={config.value || ''}
                onChange={(e) => handleConfigChange('value', e.target.value)}
                placeholder="Enter value"
              />
            </div>
          </>
        );

      case 'delay':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="delay-amount">Delay Amount</Label>
              <Input
                id="delay-amount"
                type="number"
                value={config.amount || 1}
                onChange={(e) => handleConfigChange('amount', parseInt(e.target.value))}
                min="1"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="delay-unit">Unit</Label>
              <Select
                value={config.unit || 'minutes'}
                onValueChange={(value) => handleConfigChange('unit', value)}
              >
                <SelectTrigger id="delay-unit">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="seconds">Seconds</SelectItem>
                  <SelectItem value="minutes">Minutes</SelectItem>
                  <SelectItem value="hours">Hours</SelectItem>
                  <SelectItem value="days">Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        );

      default:
        return (
          <div className="text-sm text-muted-foreground">
            No configuration options available for this node type.
          </div>
        );
    }
  };

  return (
    <div className="h-full flex flex-col bg-card border-l">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold">Node Configuration</h2>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-4">
          <Tabs defaultValue="settings" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="settings">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </TabsTrigger>
              <TabsTrigger value="info">
                <Info className="w-4 h-4 mr-2" />
                Info
              </TabsTrigger>
              <TabsTrigger value="code">
                <Code className="w-4 h-4 mr-2" />
                Code
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="settings" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Basic Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="node-label">Node Label</Label>
                    <Input
                      id="node-label"
                      value={selectedNode?.data.label || ''}
                      onChange={(e) => updateNode(selectedNode!.id, { label: e.target.value })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="node-description">Description</Label>
                    <Textarea
                      id="node-description"
                      value={selectedNode?.data.description || ''}
                      onChange={(e) => updateNode(selectedNode!.id, { description: e.target.value })}
                      placeholder="Optional description"
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Node Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {renderNodeConfig()}
                </CardContent>
              </Card>
              
              <Button
                variant="destructive"
                onClick={handleDelete}
                className="w-full"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Node
              </Button>
            </TabsContent>
            
            <TabsContent value="info" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Node Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-xs">Node ID</Label>
                    <p className="text-sm font-mono mt-1">{selectedNode?.id}</p>
                  </div>
                  <div>
                    <Label className="text-xs">Type</Label>
                    <div className="flex gap-2 mt-1">
                      <Badge variant="secondary">{selectedNode?.data.type}</Badge>
                      <Badge variant="outline">{selectedNode?.data.subtype}</Badge>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Position</Label>
                    <p className="text-sm mt-1">
                      X: {Math.round(selectedNode?.position.x || 0)}, 
                      Y: {Math.round(selectedNode?.position.y || 0)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="code" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">JSON Configuration</CardTitle>
                  <CardDescription>
                    Raw configuration data for advanced users
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={JSON.stringify(config, null, 2)}
                    onChange={(e) => {
                      try {
                        const parsed = JSON.parse(e.target.value);
                        setConfig(parsed);
                        if (selectedNode) {
                          updateNode(selectedNode.id, { config: parsed });
                        }
                      } catch (error) {
                        // Invalid JSON, ignore
                      }
                    }}
                    className="font-mono text-xs"
                    rows={15}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </ScrollArea>
    </div>
  );
}