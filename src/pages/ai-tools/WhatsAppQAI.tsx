import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  MessageCircle, 
  Plus, 
  Play, 
  Settings, 
  History, 
  BarChart, 
  FileText,
  ArrowLeft,
  Bot,
  Users,
  Globe,
  Zap
} from 'lucide-react';
import WorkflowCanvas from '@/components/workflow/WorkflowCanvas';
import NodeLibrary from '@/components/workflow/NodeLibrary';
import NodeEditor from '@/components/workflow/NodeEditor';
import { useWorkflowStore } from '@/stores/workflowStore';

export default function WhatsAppQAI() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('workflows');
  const { setWorkflow } = useWorkflowStore();

  const handleCreateWorkflow = () => {
    setWorkflow({
      id: null,
      name: 'New WhatsApp Workflow',
      description: 'Automated WhatsApp conversation flow',
      toolId: 'whatsappAI',
      nodes: [],
      edges: [],
    });
    setActiveTab('builder');
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/ai-tools')}
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-green-600 text-white">
                  <MessageCircle className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">WhatsApp QAI Agent</h1>
                  <p className="text-sm text-muted-foreground">
                    AI-powered chatbot for WhatsApp Business API
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-green-100 text-green-700">
                Beta Ready
              </Badge>
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                API Settings
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <div className="border-b">
          <TabsList className="h-12 px-6">
            <TabsTrigger value="workflows">Workflows</TabsTrigger>
            <TabsTrigger value="builder">Workflow Builder</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="executions">Executions</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="workflows" className="flex-1 p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Active Workflows</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">3</div>
                  <p className="text-xs text-muted-foreground">2 running now</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Messages Processed</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">1,245</div>
                  <p className="text-xs text-muted-foreground">Last 7 days</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Leads Qualified</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">87</div>
                  <p className="text-xs text-muted-foreground">68% conversion</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Response Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">1.2s</div>
                  <p className="text-xs text-muted-foreground">Avg response</p>
                </CardContent>
              </Card>
            </div>

            {/* Workflows List */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Your Workflows</CardTitle>
                    <CardDescription>
                      Create and manage WhatsApp conversation workflows
                    </CardDescription>
                  </div>
                  <Button onClick={handleCreateWorkflow}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Workflow
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Sample Workflow Items */}
                  <div className="border rounded-lg p-4 hover:bg-accent/50 transition-colors cursor-pointer">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">Lead Qualification Flow</h3>
                          <Badge variant="default" className="text-xs">Active</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Automatically qualifies leads through a series of questions
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Bot className="w-3 h-3" />
                            12 nodes
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            245 leads
                          </span>
                          <span className="flex items-center gap-1">
                            <Globe className="w-3 h-3" />
                            Hindi, English
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Play className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="border rounded-lg p-4 hover:bg-accent/50 transition-colors cursor-pointer">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">Property Inquiry Handler</h3>
                          <Badge variant="secondary" className="text-xs">Draft</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Handles property inquiries and schedules viewings
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Bot className="w-3 h-3" />
                            8 nodes
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            0 leads
                          </span>
                          <span className="flex items-center gap-1">
                            <Globe className="w-3 h-3" />
                            English
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Play className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="builder" className="flex-1 flex">
          <div className="flex flex-1">
            {/* Node Library - Left Sidebar */}
            <div className="w-80 border-r">
              <NodeLibrary />
            </div>

            {/* Canvas - Center */}
            <div className="flex-1">
              <WorkflowCanvas />
            </div>

            {/* Node Editor - Right Sidebar */}
            <div className="w-96 border-l">
              <NodeEditor />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="templates" className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <h2 className="text-2xl font-bold">Workflow Templates</h2>
              <p className="text-muted-foreground">
                Start with pre-built templates for common WhatsApp automation scenarios
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Template Cards */}
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-100 text-green-700">
                      <Zap className="w-5 h-5" />
                    </div>
                    <CardTitle className="text-base">Quick Lead Qualifier</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Basic lead qualification flow with budget and location questions
                  </p>
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary">5 nodes</Badge>
                    <Button size="sm">Use Template</Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-100 text-blue-700">
                      <FileText className="w-5 h-5" />
                    </div>
                    <CardTitle className="text-base">Property Info Bot</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Automated property information provider with FAQ handling
                  </p>
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary">8 nodes</Badge>
                    <Button size="sm">Use Template</Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-100 text-purple-700">
                      <Users className="w-5 h-5" />
                    </div>
                    <CardTitle className="text-base">Appointment Scheduler</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Schedule property viewings and manage appointment slots
                  </p>
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary">12 nodes</Badge>
                    <Button size="sm">Use Template</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="executions" className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Execution History</CardTitle>
                <CardDescription>
                  Monitor and debug your workflow executions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <div className="space-y-2">
                    {/* Sample execution logs */}
                    <div className="border rounded p-3 space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="default" className="text-xs">Success</Badge>
                          <span className="font-medium text-sm">Lead Qualification Flow</span>
                        </div>
                        <span className="text-xs text-muted-foreground">2 mins ago</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Triggered by: WhatsApp message from +91XXXXXXXXXX
                      </p>
                    </div>
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Performance Analytics</CardTitle>
                <CardDescription>
                  Track your WhatsApp automation performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center h-[400px] text-muted-foreground">
                  <div className="text-center">
                    <BarChart className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Analytics dashboard coming soon</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}