import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { 
  MessageCircle, Star, Clock, Mic, Shield, FileText, Scale, GraduationCap, Bot, LucideIcon,
  CheckCircle2, Zap, Settings, Info, KeyRound
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";

// --- Data Definitions ---
type AITool = {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  status: 'Active' | 'Beta Ready' | 'Coming Soon';
  color: string;
  category: string;
  features: string[];
  configDetails: {
    info: string;
    apiKeyRequired: boolean;
    setupSteps: string[];
  };
};

const aiTools: AITool[] = [
    { id: 'whatsappAI', title: 'Automations', description: 'AI-powered automation workflows for business processes.', icon: MessageCircle, status: 'Beta Ready', color: 'from-green-500 to-green-500', category: 'Communication', features: ['Build custom automation workflows', 'Multi-channel integrations', 'Visual workflow builder'], configDetails: { info: "Create powerful automation workflows with our visual builder. Connect multiple services and automate repetitive tasks.", apiKeyRequired: true, setupSteps: ["Design your workflow using the visual builder.", "Configure integrations and API keys.", "Test and deploy your automation."] } },
    { id: 'voiceToCRM', title: 'Voice-to-CRM Logger', description: 'Record voice memos that auto-transcribe to CRM.', icon: Mic, status: 'Active', color: 'from-purple-500 to-purple-500', category: 'Productivity', features: ['Tap to record in client profile', 'AI transcribes and summarizes conversations', 'Auto-logs entries in client history'], configDetails: { info: "Uses advanced speech-to-text technology to transcribe your voice notes directly into client records, saving you time.", apiKeyRequired: false, setupSteps: ["Enable microphone permissions in your browser.", "Go to a client's profile page.", "Tap the microphone icon to start recording."] } },
    { id: 'nlpSummarizer', title: 'NLP Note Summarizer', description: 'Advanced summarization of client interactions.', icon: Bot, status: 'Active', color: 'from-teal-500 to-teal-500', category: 'Analytics', features: ['Extracts key points from long notes', 'Sentiment analysis of interactions', 'Identifies action items and tasks'], configDetails: { info: "Uses Natural Language Processing to summarize long text notes, identifying key points, sentiment, and action items.", apiKeyRequired: false, setupSteps: ["This feature is automatically active.", "Write detailed notes in the client interaction logs.", "A summary will be automatically generated below your note."] } },
];

// --- Supabase Functions ---
const fetchToolSettings = async (userId: string) => {
    if (!userId) return {};
    const { data, error } = await supabase.from('ai_tools_settings').select('*').eq('user_id', userId);
    if (error) throw error;
    // Convert array to a map for easy lookup
    return data.reduce((acc, setting) => {
        acc[setting.id] = setting;
        return acc;
    }, {});
};

// --- Components ---
const AIToolCard = ({
  tool,
  isEnabled,
  onToggle,
  onConfigure,
}: {
  tool: AITool;
  isEnabled: boolean;
  onToggle: (id: string, newStatus: boolean) => void;
  onConfigure: (tool: AITool) => void;
}) => {
  const Icon = tool.icon;

  return (
    <div className="relative group rounded-2xl overflow-hidden border border-border bg-card flex flex-col transition-all duration-300 hover:border-border/80 hover:shadow-xl hover:shadow-primary/20">
      <div className="p-6 flex-grow">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div
  className={cn(
    "w-16 h-16 rounded-xl flex items-center justify-center ring-1 ring-border bg-gradient-to-br",
    tool.color
  )}
>
  <Icon className="w-7 h-7 text-white drop-shadow-sm" />
</div>

            <div>
              <h3 className="text-lg font-semibold text-foreground">{tool.title}</h3>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={tool.status === "Active" ? "default" : "secondary"}>
                  {tool.status}
                </Badge>
                <span className="text-xs text-foreground">{tool.category}</span>
              </div>
            </div>
          </div>
          <Switch
            checked={isEnabled}
            onCheckedChange={(checked) => onToggle(tool.id, checked)}
            disabled={tool.status === "Coming Soon"}
          />
        </div>

        <p className="text-sm text-muted-foreground mt-4">{tool.description}</p>

        <div className="mt-4 space-y-2">
          <h4 className="text-sm font-medium text-foreground">Key Features:</h4>
          <ul className="space-y-1.5">
            {tool.features.map((feature, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-auto p-6 pt-4 border-t border-border bg-card">
        <Button
          variant="default"
          className="w-full bg-gradient-to-r from-primary to-primary/90 text-primary-foreground"
          onClick={() => onConfigure(tool)}
        >
          <Settings className="w-4 h-4 mr-2" />
          Configure Settings
        </Button>
      </div>
    </div>
  );
};


const ConfigurationModal = ({ tool, isOpen, onClose, settings, onSave }: { tool: AITool | null; isOpen: boolean; onClose: () => void; settings: any; onSave: (id: string, apiKey: string) => void; }) => {
    const [apiKey, setApiKey] = useState('');

    useEffect(() => {
        if (settings) {
            setApiKey(settings.api_key || '');
        }
    }, [settings]);

    if (!tool) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2"><tool.icon className="w-5 h-5" /> {tool.title} Configuration</DialogTitle>
                    <DialogDescription>{tool.configDetails.info}</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div>
                        <h4 className="font-semibold mb-2 flex items-center gap-2"><Info className="w-4 h-4" /> Setup Steps</h4>
                        <ul className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                            {tool.configDetails.setupSteps.map((step, i) => <li key={i}>{step}</li>)}
                        </ul>
                    </div>
                    {tool.configDetails.apiKeyRequired && (
                        <div>
                            <h4 className="font-semibold mb-2 flex items-center gap-2"><KeyRound className="w-4 h-4" /> API Key</h4>
                            <Input 
                                type="password" 
                                placeholder="Enter your API Key here"
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                            />
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button onClick={() => onSave(tool.id, apiKey)}>Save Configuration</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default function AiToolsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTool, setSelectedTool] = useState<AITool | null>(null);

  const { data: user } = useQuery({
      queryKey: ['user'],
      queryFn: async () => {
          const { data } = await supabase.auth.getUser();
          return data.user;
      }
  });

  const { data: toolSettings = {} } = useQuery({
      queryKey: ['aiToolSettings', user?.id],
      queryFn: () => fetchToolSettings(user!.id),
      enabled: !!user,
  });

  const upsertSettingsMutation = useMutation({
      mutationFn: async ({ toolId, isEnabled, apiKey }: { toolId: string; isEnabled?: boolean; apiKey?: string }) => {
          if (!user) throw new Error("User not found");
          const currentSettings = toolSettings[toolId] || {};
          const updateData = {
              id: toolId,
              user_id: user.id,
              is_enabled: isEnabled ?? currentSettings.is_enabled,
              api_key: apiKey ?? currentSettings.api_key,
          };
          const { error } = await supabase.from('ai_tools_settings').upsert(updateData);
          if (error) throw error;
      },
      onSuccess: (_, variables) => {
          queryClient.invalidateQueries({ queryKey: ['aiToolSettings', user?.id] });
          toast({ title: "Success", description: `${variables.toolId} settings have been updated.` });
          setIsModalOpen(false);
      },
      onError: (error: any) => {
          toast({ title: "Error", description: error.message, variant: "destructive" });
      }
  });

  const handleToggle = (id: string, newStatus: boolean) => {
      upsertSettingsMutation.mutate({ toolId: id, isEnabled: newStatus });
  };

  const handleConfigure = (tool: AITool) => {
      // Navigate to specific tool workflow pages for supported tools
      if (tool.id === 'whatsappAI') {
          window.location.hash = '/ai-tools/whatsapp-qai';
          return;
      }
      if (tool.id === 'voiceToCRM') {
          window.location.hash = '/ai-tools/voice-to-crm';
          return;
      }
      // For other tools, show the configuration modal
      setSelectedTool(tool);
      setIsModalOpen(true);
  };

  const handleSaveConfig = (id: string, apiKey: string) => {
      upsertSettingsMutation.mutate({ toolId: id, apiKey: apiKey });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">AI Tools</h1>
          <p className="text-muted-foreground">Advanced AI Suite for Estate Hive Agency Operations</p>
        </div>
        <Badge variant="outline"><Zap className="w-4 h-4 mr-2 text-primary" />AI-Powered CRM</Badge>
      </div>

      <div className="bg-gradient-to-r from-primary to-primary/90 text-primary-foreground rounded-lg p-6 shadow-lg">
        <div className="flex items-center gap-4 mb-4">
          <Bot className="w-8 h-8" />
          <div>
            <h2 className="text-2xl font-bold">Estate Hive AI Intelligence Suite</h2>
            <p className="text-sm opacity-90">Comprehensive AI automation for lead management, client communication, and agent training.</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
          <div>
            <h3 className="font-semibold mb-2">Active Integrations:</h3>
            <ul className="space-y-1 text-sm opacity-90">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Automation workflows configured</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> OpenAI GPT-4 integration active</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Voice transcription operational</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Coming Soon:</h3>
            <ul className="space-y-1 text-sm opacity-90">
              <li className="flex items-center gap-2"><Clock className="w-4 h-4" /> More automation templates (Q2 2025)</li>
              <li className="flex items-center gap-2"><Clock className="w-4 h-4" /> Advanced NLP models (Q3 2025)</li>
              <li className="flex items-center gap-2"><Clock className="w-4 h-4" /> Multi-language support (Q4 2025)</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {aiTools.map((tool) => (
          <AIToolCard 
            key={tool.id} 
            tool={tool} 
            isEnabled={toolSettings[tool.id]?.is_enabled || false}
            onToggle={handleToggle}
            onConfigure={handleConfigure}
          />
        ))}
      </div>

      <ConfigurationModal 
        tool={selectedTool}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        settings={selectedTool ? toolSettings[selectedTool.id] : null}
        onSave={handleSaveConfig}
      />
    </div>
  );
}
