import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Mic, 
  MicOff,
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
  Zap,
  MessageCircle,
  Brain,
  Database,
  CheckCircle,
  AlertCircle,
  Clock,
  Loader2,
  Copy,
  ExternalLink,
  Send,
  Download,
  Upload,
  RefreshCw,
  Shield,
  Key,
  Phone,
  Mail,
  Pause,
  StopCircle,
  Save,
  Wifi,
  WifiOff,
  Search,
  List,
  FileAudio
} from 'lucide-react';
import WorkflowCanvas from '@/components/workflow/WorkflowCanvas';
import NodeLibrary from '@/components/workflow/NodeLibrary';
import NodeEditor from '@/components/workflow/NodeEditor';
import NodeConfigPanel from '@/components/workflow/NodeConfigPanel';
import { useWorkflowStore } from '@/stores/workflowStore';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { improvedTelegramService as telegramService, TelegramBotConfig } from '@/services/telegram-improved.service';
import { transcriptionService } from '@/services/transcription.service';
import { improvedWebSpeech as webSpeechTranscription } from '@/services/web-speech-improved.service';
import { aiProcessingService } from '@/services/ai-processing.service';
import { voiceProcessingWorker } from '@/services/voice-processing-worker.service';
import { configService } from '@/services/config.service';
import { voiceToCRMTemplate } from '@/templates/voice-to-crm.template';
import { v4 as uuidv4 } from 'uuid';

// Default credentials (can be overridden by user)
const DEFAULT_CREDENTIALS = {
  TELEGRAM_BOT_TOKEN: import.meta.env?.VITE_TELEGRAM_BOT_TOKEN || '',
  TELEGRAM_BOT_USERNAME: import.meta.env?.VITE_TELEGRAM_BOT_USERNAME || 'estatehive_voice_bot',
  TELEGRAM_BOT_NAME: 'Estate Hive Voice Logger',
  OPENAI_API_KEY: import.meta.env?.VITE_OPENAI_API_KEY || ''
};

// Telegram Bot Setup Wizard Component
function TelegramBotSetup({ 
  onComplete,
  defaultConfig 
}: { 
  onComplete: (config: TelegramBotConfig) => void;
  defaultConfig?: Partial<TelegramBotConfig>;
}) {
  const [step, setStep] = useState(1);
  const [botToken, setBotToken] = useState(defaultConfig?.bot_token || DEFAULT_CREDENTIALS.TELEGRAM_BOT_TOKEN);
  const [botUsername, setBotUsername] = useState(defaultConfig?.bot_username || DEFAULT_CREDENTIALS.TELEGRAM_BOT_USERNAME);
  const [botName, setBotName] = useState(DEFAULT_CREDENTIALS.TELEGRAM_BOT_NAME);
  const [allowedChats, setAllowedChats] = useState('');
  const [testing, setTesting] = useState(false);
  const [botInfo, setBotInfo] = useState<any>(null);
  const { toast } = useToast();

  const handleTestBot = async () => {
    setTesting(true);
    try {
      // Get current user for organization_id
      const { data: { user } } = await supabase.auth.getUser();
      
      // Test bot connection
      const testConfig: TelegramBotConfig = {
        id: uuidv4(),
        bot_token: botToken,
        bot_username: botUsername,
        organization_id: user?.id,  // Add organization_id
        allowed_chat_ids: allowedChats.split(',').map(id => id.trim()).filter(Boolean),
        allowed_usernames: [],
        chat_client_mapping: {},
        settings: {},
      };

      await telegramService.initializeBot(testConfig);
      
      // Get bot info from Telegram API
      const response = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
      const data = await response.json();
      
      if (data.ok) {
        setBotInfo(data.result);
        setBotUsername(data.result.username);
        toast({
          title: 'Success',
          description: `Bot @${data.result.username} connected successfully!`,
        });
        setStep(3);
      } else {
        throw new Error(data.description || 'Failed to connect to bot');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to connect to bot',
        variant: 'destructive',
      });
    } finally {
      setTesting(false);
    }
  };

  const handleComplete = async () => {
    const config: TelegramBotConfig = {
      id: uuidv4(),
      bot_token: botToken,
      bot_username: botUsername,
      allowed_chat_ids: allowedChats.split(',').map(id => id.trim()).filter(Boolean),
      allowed_usernames: [],
      chat_client_mapping: {},
      settings: {
        useWebhook: false,
        botName: botName,
      },
    };

    // Save to database
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error } = await supabase
          .from('telegram_bot_configs')
          .insert({
            id: config.id,
            organization_id: user.id,
            bot_token: config.bot_token,
            bot_username: config.bot_username,
            allowed_chat_ids: config.allowed_chat_ids,
            allowed_usernames: config.allowed_usernames,
            chat_client_mapping: config.chat_client_mapping,
            settings: config.settings,
            is_active: true,
          });

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Bot configuration saved successfully!',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to save bot configuration',
        variant: 'destructive',
      });
    }

    onComplete(config);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Telegram Bot Setup</CardTitle>
        <CardDescription>
          Configure your Telegram bot for voice message processing
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {step === 1 && (
          <>
            <Alert>
              <Bot className="h-4 w-4" />
              <AlertTitle>Quick Setup Available</AlertTitle>
              <AlertDescription>
                We've pre-configured the Estate Hive Voice Logger bot for you. 
                Just click "Test Connection" to verify it's working.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="bot-name">Bot Name</Label>
                <Input
                  id="bot-name"
                  value={botName}
                  onChange={(e) => setBotName(e.target.value)}
                  placeholder="Estate Hive Voice Logger"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bot-token">Bot Token</Label>
                <div className="flex gap-2">
                  <Input
                    id="bot-token"
                    type="password"
                    value={botToken}
                    onChange={(e) => setBotToken(e.target.value)}
                    placeholder="Enter your bot token from @BotFather"
                  />
                  <Button
                    variant="outline"
                    onClick={() => navigator.clipboard.writeText(botToken)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Get this from @BotFather on Telegram
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bot-username">Bot Username</Label>
                <Input
                  id="bot-username"
                  value={botUsername}
                  onChange={(e) => setBotUsername(e.target.value)}
                  placeholder="@estatehive_voice_bot"
                />
              </div>

              <Button 
                onClick={() => setStep(2)} 
                className="w-full"
                disabled={!botToken}
              >
                Next: Test Connection
              </Button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <Alert>
              <MessageCircle className="h-4 w-4" />
              <AlertTitle>Testing Bot Connection</AlertTitle>
              <AlertDescription>
                We'll verify that your bot token is valid and the bot is accessible.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="allowed-chats">Allowed Chat IDs (Optional)</Label>
                <Textarea
                  id="allowed-chats"
                  value={allowedChats}
                  onChange={(e) => setAllowedChats(e.target.value)}
                  placeholder="Enter chat IDs separated by commas (leave empty to allow all)"
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  Restrict bot to specific chats. Leave empty to allow all chats.
                </p>
              </div>

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setStep(1)}
                  disabled={testing}
                >
                  Back
                </Button>
                <Button 
                  onClick={handleTestBot} 
                  className="flex-1"
                  disabled={testing}
                >
                  {testing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    <>
                      <Bot className="mr-2 h-4 w-4" />
                      Test Connection
                    </>
                  )}
                </Button>
              </div>
            </div>
          </>
        )}

        {step === 3 && botInfo && (
          <>
            <Alert className="border-green-500">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <AlertTitle>Bot Connected Successfully!</AlertTitle>
              <AlertDescription>
                Your bot @{botInfo.username} is ready to receive voice messages.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Bot Name:</span>
                      <span className="text-sm font-medium">{botInfo.first_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Username:</span>
                      <span className="text-sm font-medium">@{botInfo.username}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Bot ID:</span>
                      <span className="text-sm font-medium">{botInfo.id}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-2">
                <Label>Next Steps:</Label>
                <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Open Telegram and search for @{botInfo.username}</li>
                  <li>Start a chat with the bot</li>
                  <li>Send /start to initialize</li>
                  <li>Send voice messages to test transcription</li>
                </ol>
              </div>

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setStep(2)}
                >
                  Back
                </Button>
                <Button 
                  onClick={handleComplete}
                  className="flex-1"
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Complete Setup
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// Main Component
export default function VoiceToCRM() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('workflow');
  const [showBotSetup, setShowBotSetup] = useState(false);
  const [botConfig, setBotConfig] = useState<TelegramBotConfig | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recentCommunications, setRecentCommunications] = useState<any[]>([]);
  const [allVoiceNotes, setAllVoiceNotes] = useState<any[]>([]);
  const [voiceNotesFilter, setVoiceNotesFilter] = useState('');
  const [realtimeLogs, setRealtimeLogs] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalTranscriptions: 0,
    todayTranscriptions: 0,
    averageDuration: 0,
    successRate: 0,
  });
  const [openAIKey, setOpenAIKey] = useState(DEFAULT_CREDENTIALS.OPENAI_API_KEY);
  const [savedWorkflowId, setSavedWorkflowId] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedTranscription, setRecordedTranscription] = useState('');
  const [transcriptionMethod, setTranscriptionMethod] = useState<'web-speech' | 'openai'>('web-speech');
  const [isTranscribing, setIsTranscribing] = useState(false);

  const {
    nodes,
    edges,
    selectedNode,
    addNode,
    updateNode,
    deleteNode,
    selectNode,
    setWorkflow,
    clearWorkflow,
  } = useWorkflowStore();

  // Initialize services on mount
  useEffect(() => {
    // Add welcome log
    addRealtimeLog({
      type: 'success',
      message: 'Voice-to-CRM system started',
      timestamp: new Date().toISOString(),
      details: 'System ready for voice processing'
    });
    
    initializeServices();
    loadSavedConfig();
    loadRecentCommunications();
    loadAllVoiceNotes();
    loadStatistics();
    
    // Cleanup on unmount
    return () => {
      voiceProcessingWorker.stop();
    };
  }, []);

  const initializeServices = async () => {
    try {
      addRealtimeLog({
        type: 'info',
        message: 'Initializing Voice-to-CRM services...',
        timestamp: new Date().toISOString()
      });
      
      // Get current user for organization context
      const { data: { user } } = await supabase.auth.getUser();
      const organizationId = user?.id;

      // Initialize configuration service first
      await configService.initialize(organizationId);
      
      // Initialize transcription service (will use config service internally)
      await transcriptionService.initialize(organizationId);
      
      // Initialize AI processing service (will get key from config service)
      await aiProcessingService.initialize();
      
      // Start voice processing worker with organization ID
      await voiceProcessingWorker.start(botConfig ? [botConfig] : [], organizationId);
      
      addRealtimeLog({
        type: 'success',
        message: 'All services initialized successfully',
        timestamp: new Date().toISOString(),
        details: 'Voice transcription and AI processing ready'
      });
      
      toast({
        title: 'Services Initialized',
        description: 'Voice transcription and AI processing ready with improved services',
      });
    } catch (error: any) {
      console.error('Failed to initialize services:', error);
      
      addRealtimeLog({
        type: 'warning',
        message: 'Some services failed to initialize',
        timestamp: new Date().toISOString(),
        details: error.message || 'Please check API keys'
      });
      
      toast({
        title: 'Warning',
        description: 'Some services may not be available. Please check API keys.',
        variant: 'destructive',
      });
    }
  };

  const loadSavedConfig = async () => {
    try {
      addRealtimeLog({
        type: 'info',
        message: 'Loading saved configuration...',
        timestamp: new Date().toISOString()
      });
      
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.log('User not authenticated');
        addRealtimeLog({
          type: 'warning',
          message: 'User not authenticated, loading default template',
          timestamp: new Date().toISOString()
        });
        loadDefaultTemplate();
        return;
      }

      // Load saved bot config with proper error handling
      try {
        const { data: botConfigs, error: botError } = await supabase
          .from('telegram_bot_configs')
          .select('*')
          .eq('organization_id', user.id)
          .eq('is_active', true)
          .maybeSingle();

        if (!botError && botConfigs) {
          const config: TelegramBotConfig = {
            id: botConfigs.id,
            bot_token: botConfigs.bot_token,
            bot_username: botConfigs.bot_username,
            organization_id: botConfigs.organization_id || user.id,  // Add organization_id
            allowed_chat_ids: botConfigs.allowed_chat_ids || [],
            allowed_usernames: botConfigs.allowed_usernames || [],
            chat_client_mapping: botConfigs.chat_client_mapping || {},
            settings: botConfigs.settings || {},
          };
          setBotConfig(config);
          
          addRealtimeLog({
            type: 'success',
            message: 'Bot configuration loaded',
            timestamp: new Date().toISOString(),
            details: `Bot: @${config.bot_username}`
          });
          
          // Initialize bot
          await telegramService.initializeBot(config);
          
          // Start voice processing worker with bot config
          voiceProcessingWorker.setBotConfig(config);
          // Worker already started in initializeServices
          console.log('Voice processing worker configured');
          
          addRealtimeLog({
            type: 'success',
            message: 'Voice processing worker configured',
            timestamp: new Date().toISOString()
          });
        }
      } catch (botError) {
        console.log('Bot config not found or table does not exist');
      }

      // Load saved workflow with proper error handling
      try {
        const { data: workflows, error: workflowError } = await supabase
          .from('ai_workflows')
          .select('*')
          .eq('user_id', user.id)
          .eq('tool_id', 'voiceToCRM')
          .maybeSingle();

        if (!workflowError && workflows) {
          setSavedWorkflowId(workflows.id);
          setWorkflow({
            id: workflows.id,
            name: workflows.name,
            description: workflows.description || '',
            toolId: 'voiceToCRM',
            nodes: workflows.nodes || [],
            edges: workflows.edges || [],
          });
          
          addRealtimeLog({
            type: 'success',
            message: 'Workflow loaded',
            timestamp: new Date().toISOString(),
            details: `Workflow: ${workflows.name}`
          });
        } else {
          // Load default template if no saved workflow
          addRealtimeLog({
            type: 'info',
            message: 'Loading default workflow template',
            timestamp: new Date().toISOString()
          });
          loadDefaultTemplate();
        }
      } catch (workflowError) {
        console.log('Workflow not found or table does not exist');
        loadDefaultTemplate();
      }
    } catch (error) {
      console.error('Error loading saved config:', error);
      // Load default template on error
      loadDefaultTemplate();
    }
  };

  const addRealtimeLog = (log: any) => {
    setRealtimeLogs(prev => [{
      id: Date.now(),
      ...log
    }, ...prev.slice(0, 99)]); // Keep last 100 logs
  };

  const loadDefaultTemplate = () => {
    setWorkflow({
      id: null,
      name: voiceToCRMTemplate.name,
      description: voiceToCRMTemplate.description,
      toolId: 'voiceToCRM',
      nodes: voiceToCRMTemplate.nodes,
      edges: voiceToCRMTemplate.edges,
    });
    toast({
      title: 'Template Loaded',
      description: 'Voice-to-CRM workflow template loaded successfully',
    });
  };

  const loadRecentCommunications = async () => {
    try {
      addRealtimeLog({
        type: 'info',
        message: 'Loading recent voice notes...',
        timestamp: new Date().toISOString()
      });
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('client_communications')
        .select(`
          *,
          clients (
            id,
            name,
            email,
            phone
          )
        `)
        .eq('communication_type', 'voice')
        .eq('organization_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (!error && data) {
        setRecentCommunications(data);
        addRealtimeLog({
          type: 'success',
          message: `Loaded ${data.length} recent voice notes`,
          timestamp: new Date().toISOString()
        });
      } else {
        setRecentCommunications([]);
        if (error) {
          addRealtimeLog({
            type: 'error',
            message: 'Failed to load voice notes',
            timestamp: new Date().toISOString(),
            details: error.message
          });
        }
      }
      
      // Set up real-time subscription for new communications
      const channel = supabase
        .channel('voice-communications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'client_communications',
            filter: `organization_id=eq.${user.id}`,
          },
          async (payload) => {
            // Fetch the full record with client details
            const { data: newComm } = await supabase
              .from('client_communications')
              .select(`
                *,
                clients (
                  id,
                  name,
                  email,
                  phone
                )
              `)
              .eq('id', payload.new.id)
              .single();
            
            if (newComm && newComm.communication_type === 'voice') {
              setRecentCommunications(prev => [newComm, ...prev.slice(0, 9)]);
              setAllVoiceNotes(prev => [newComm, ...prev]);
              
              // Add to real-time logs
              addRealtimeLog({
                type: 'success',
                message: `New voice note from ${newComm.clients?.name || 'Unknown'}`,
                timestamp: new Date().toISOString(),
                data: newComm
              });
              
              // Update stats
              loadStatistics();
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'client_communications',
            filter: `organization_id=eq.${user.id}`,
          },
          (payload) => {
            setRecentCommunications(prev => 
              prev.map(comm => comm.id === payload.new.id ? { ...comm, ...payload.new } : comm)
            );
          }
        )
        .subscribe();
      
      // Cleanup subscription on unmount
      return () => {
        supabase.removeChannel(channel);
      };
    } catch (error) {
      console.error('Error loading communications:', error);
      setRecentCommunications([]);
      addRealtimeLog({
        type: 'error',
        message: 'Failed to load recent communications',
        timestamp: new Date().toISOString(),
        error
      });
    }
  };

  const loadStatistics = async () => {
    try {
      addRealtimeLog({
        type: 'info',
        message: 'Loading statistics...',
        timestamp: new Date().toISOString()
      });
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get today's date
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data: allComms } = await supabase
        .from('client_communications')
        .select('*')
        .eq('communication_type', 'voice')
        .eq('organization_id', user.id);

      const { data: todayComms } = await supabase
        .from('client_communications')
        .select('*')
        .eq('communication_type', 'voice')
        .eq('organization_id', user.id)
        .gte('created_at', today.toISOString());

      const totalTranscriptions = allComms?.length || 0;
      const todayTranscriptions = todayComms?.length || 0;
      
      const totalDuration = allComms?.reduce((sum, comm) => sum + (comm.duration_seconds || 0), 0) || 0;
      const averageDuration = totalTranscriptions > 0 ? totalDuration / totalTranscriptions : 0;
      
      const successful = allComms?.filter(comm => comm.status === 'completed').length || 0;
      const successRate = totalTranscriptions > 0 ? (successful / totalTranscriptions) * 100 : 0;

      setStats({
        totalTranscriptions,
        todayTranscriptions,
        averageDuration,
        successRate,
      });
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  };

  const loadAllVoiceNotes = async () => {
    try {
      addRealtimeLog({
        type: 'info',
        message: "Loading today's voice notes...",
        timestamp: new Date().toISOString()
      });
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get today's date at midnight
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('client_communications')
        .select(`
          *,
          clients (
            id,
            name,
            email,
            phone
          )
        `)
        .eq('communication_type', 'voice')
        .eq('organization_id', user.id)
        .gte('created_at', today.toISOString())
        .order('created_at', { ascending: false });

      if (!error && data) {
        setAllVoiceNotes(data);
        addRealtimeLog({
          type: 'success',
          message: `Loaded ${data.length} voice notes from today`,
          timestamp: new Date().toISOString()
        });
      } else {
        setAllVoiceNotes([]);
        if (error) {
          addRealtimeLog({
            type: 'error',
            message: 'Failed to load voice notes',
            timestamp: new Date().toISOString(),
            details: error.message
          });
        }
      }
    } catch (error) {
      console.error('Error loading voice notes:', error);
      setAllVoiceNotes([]);
      addRealtimeLog({
        type: 'error',
        message: 'Failed to load voice notes',
        timestamp: new Date().toISOString(),
        details: (error as Error).message
      });
    }
  };

  const filteredVoiceNotes = allVoiceNotes.filter(note => {
    // Apply text filter only
    if (voiceNotesFilter) {
      const searchLower = voiceNotesFilter.toLowerCase();
      const matchesSearch = 
        (note.transcription?.toLowerCase().includes(searchLower)) ||
        (note.notes?.toLowerCase().includes(searchLower)) ||
        (note.summary?.toLowerCase().includes(searchLower)) ||
        (note.clients?.name?.toLowerCase().includes(searchLower)) ||
        (note.client_name?.toLowerCase().includes(searchLower));
      
      if (!matchesSearch) return false;
    }
    
    return true;
  });

  const handleBotSetupComplete = async (config: TelegramBotConfig) => {
    setBotConfig(config);
    setShowBotSetup(false);
    
    // Start voice processing worker with the new config
    voiceProcessingWorker.setBotConfig(config);
    await voiceProcessingWorker.start([config]);
    
    toast({
      title: 'Bot Setup Complete',
      description: `Bot @${config.bot_username} is now active and processing voice messages`,
    });
  };

  const handleSaveWorkflow = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: 'Error',
          description: 'Please login to save workflows',
          variant: 'destructive',
        });
        return;
      }

      const workflowData = {
        id: savedWorkflowId || uuidv4(),
        user_id: user.id,
        tool_id: 'voiceToCRM',
        name: 'Voice-to-CRM Workflow',
        description: 'Automated voice transcription and CRM logging workflow',
        nodes: nodes,
        edges: edges,
        settings: {
          openai_api_key: openAIKey,
          bot_config_id: botConfig?.id,
        },
        is_active: true,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('ai_workflows')
        .upsert(workflowData);

      if (error) throw error;

      setSavedWorkflowId(workflowData.id);
      toast({
        title: 'Success',
        description: 'Workflow saved successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to save workflow',
        variant: 'destructive',
      });
    }
  };

  // Microphone recording functions
  const startMicrophoneRecording = async () => {
    try {
      setIsRecording(true);
      setRecordedTranscription('');
      setTranscriptionMethod('web-speech'); // Use free method by default
      
      addRealtimeLog({
        type: 'info',
        message: 'Starting microphone recording...',
        timestamp: new Date().toISOString(),
        details: 'Using Web Speech API (FREE)'
      });

      await webSpeechTranscription.startRealtimeTranscription(
        (result) => {
          if (result.isFinal) {
            setRecordedTranscription(prev => prev + result.text + ' ');
          }
        },
        { language: 'en' }
      );

      toast({
        title: "Recording Started",
        description: "Using FREE Web Speech API. Speak clearly into your microphone.",
      });
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Recording Error",
        description: (error as Error).message,
        variant: "destructive",
      });
      setIsRecording(false);
    }
  };

  const stopMicrophoneRecording = async () => {
    try {
      webSpeechTranscription.stopRealtimeTranscription();
      setIsRecording(false);
      
      addRealtimeLog({
        type: 'info',
        message: 'Recording stopped',
        timestamp: new Date().toISOString(),
        details: `Transcription length: ${recordedTranscription.length} characters`
      });

      if (recordedTranscription.trim()) {
        // Process the transcription
        await processTranscriptionToCRM(recordedTranscription.trim(), 'microphone');
      } else {
        toast({
          title: "No Speech Detected",
          description: "Please try recording again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error stopping recording:', error);
      toast({
        title: "Error",
        description: "Failed to stop recording",
        variant: "destructive",
      });
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsTranscribing(true);
      setRecordedTranscription('');
      
      addRealtimeLog({
        type: 'info',
        message: `Processing audio file: ${file.name}`,
        timestamp: new Date().toISOString(),
        details: `Size: ${(file.size / 1024).toFixed(2)} KB, Type: ${file.type}`
      });

      // Try Web Speech API first (FREE)
      try {
        setTranscriptionMethod('web-speech');
        const result = await webSpeechTranscription.transcribeAudioBlob(file, {
          language: 'en',
          onProgress: (text) => {
            setRecordedTranscription(text);
          }
        });

        setRecordedTranscription(result.text);
        await processTranscriptionToCRM(result.text, 'file-upload');
      } catch (webSpeechError) {
        console.error('Web Speech API failed, trying OpenAI:', webSpeechError);
        
        // Fallback to OpenAI
        setTranscriptionMethod('openai');
        const result = await transcriptionService.transcribeAudio(file);
        setRecordedTranscription(result.text);
        await processTranscriptionToCRM(result.text, 'file-upload');
      }
    } catch (error) {
      console.error('Error transcribing file:', error);
      toast({
        title: "Transcription Error",
        description: (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setIsTranscribing(false);
    }
  };

  const processTranscriptionToCRM = async (transcription: string, source: string = 'microphone') => {
    try {
      setIsProcessing(true);
      
      addRealtimeLog({
        type: 'info',
        message: `Processing transcription from ${source}`,
        timestamp: new Date().toISOString(),
        details: `Length: ${transcription.length} characters`
      });

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Process with AI for insights
      addRealtimeLog({
        type: 'info',
        message: 'Processing with AI...',
        timestamp: new Date().toISOString()
      });
      
      const processingResult = await aiProcessingService.processTranscription(
        transcription,
        undefined,
        {
          extractEntities: true,
          generateTitle: true,
        }
      );
      
      addRealtimeLog({
        type: 'success',
        message: 'AI processing complete',
        timestamp: new Date().toISOString(),
        data: { subject: processingResult.subject, sentiment: processingResult.sentiment }
      });

      // Save to database
      addRealtimeLog({
        type: 'info',
        message: 'Saving to CRM database...',
        timestamp: new Date().toISOString()
      });
      
      const { data: communication, error } = await supabase
        .from('client_communications')
        .insert({
          organization_id: user.id,
          communication_type: 'voice',
          channel: 'microphone',
          direction: 'inbound',
          subject: processingResult.subject,
          raw_content: transcription,
          transcription: transcription,
          processed_content: processingResult.summary,
          sentiment: processingResult.sentiment,
          key_points: processingResult.keyPoints,
          action_items: processingResult.actionItems,
          entities: processingResult.entities,
          tags: processingResult.category ? [processingResult.category] : [],
          status: 'completed',
          transcription_language: 'en',
        })
        .select()
        .single();

      if (error) throw error;

      addRealtimeLog({
        type: 'success',
        message: 'Voice note saved to CRM successfully',
        timestamp: new Date().toISOString(),
        data: { id: communication?.id, subject: communication?.subject }
      });

      toast({
        title: "Success!",
        description: "Voice note has been saved to CRM",
      });

      // Refresh recent communications
      await loadRecentCommunications();
      
      // Clear transcription
      setRecordedTranscription('');
    } catch (error) {
      console.error('Error processing transcription:', error);
      
      addRealtimeLog({
        type: 'error',
        message: 'Failed to process voice note',
        timestamp: new Date().toISOString(),
        details: (error as Error).message || 'Unknown error occurred'
      });
      
      toast({
        title: "Processing Error",
        description: (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTestWorkflow = async () => {
    if (!botConfig) {
      toast({
        title: 'Error',
        description: 'Please setup Telegram bot first',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);
    try {
      // Send test message to bot
      await telegramService.sendMessage(
        botConfig.id,
        botConfig.settings.testChatId || '@' + botConfig.bot_username,
        '🧪 Test workflow initiated. Please send a voice message to test the transcription.'
      );

      toast({
        title: 'Test Started',
        description: 'Please send a voice message to your bot to test the workflow',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to start test',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveApiKey = async () => {
    try {
      // Get current user for organization context
      const { data: { user } } = await supabase.auth.getUser();
      const organizationId = user?.id;

      // Update config service first
      await configService.initialize(organizationId);
      
      // Reinitialize services with new configuration
      await transcriptionService.initialize(organizationId);
      await aiProcessingService.initialize(openAIKey);
      
      // Save to workflow settings
      if (savedWorkflowId) {
        const { error } = await supabase
          .from('ai_workflows')
          .update({
            settings: {
              openai_api_key: openAIKey,
              bot_config_id: botConfig?.id,
            }
          })
          .eq('id', savedWorkflowId);

        if (error) throw error;
      }

      toast({
        title: 'Success',
        description: 'API key saved and improved services reinitialized',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to save API key',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b">
        <div className="flex h-16 items-center px-4 gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/ai-tools')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-semibold">Voice-to-CRM Logger</h1>
            <p className="text-sm text-muted-foreground">
              Automated voice transcription and CRM logging
            </p>
          </div>
          <div className="flex items-center gap-2">
            {botConfig && (
              <Badge variant="outline" className="gap-1">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                Bot Active
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadDefaultTemplate()}
            >
              <Upload className="h-4 w-4 mr-2" />
              Load Template
            </Button>
            <Button
              size="sm"
              onClick={handleSaveWorkflow}
              disabled={!botConfig}
            >
              <Save className="h-4 w-4 mr-2" />
              Save Workflow
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-4">
            <TabsTrigger value="workflow">Workflow</TabsTrigger>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="voice-notes">Voice Notes</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Workflow Tab */}
          <TabsContent value="workflow" className="space-y-4">
            <div className="flex gap-4">
              {/* Sidebar for Workflow */}
              <div className="w-80">
                {selectedNode ? (
                  <NodeConfigPanel
                    node={selectedNode}
                    onClose={() => selectNode(null)}
                  />
                ) : (
                  <Card>
                    <CardHeader>
                      <CardTitle>Workflow Tools</CardTitle>
                      <CardDescription>
                        Drag nodes to the canvas or click a node to configure
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                      <NodeLibrary />
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Canvas for Workflow */}
              <div className="flex-1">
                <Card className="h-[600px]">
                  <CardHeader>
                    <CardTitle>Workflow Canvas</CardTitle>
                    <CardDescription>
                      Design your voice processing workflow
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="h-[calc(100%-5rem)]">
                    <WorkflowCanvas onLog={addRealtimeLog} />
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {/* Statistics Cards */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Transcriptions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalTranscriptions}</div>
                  <p className="text-xs text-muted-foreground">All time voice notes</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Today's Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.todayTranscriptions}</div>
                  <p className="text-xs text-muted-foreground">Voice notes today</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Average Duration</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{Math.round(stats.averageDuration)}s</div>
                  <p className="text-xs text-muted-foreground">Per recording</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.successRate.toFixed(1)}%</div>
                  <p className="text-xs text-muted-foreground">Processing success</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {/* Recent Communications */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Voice Notes</CardTitle>
                  <CardDescription>Latest voice transcriptions from all channels</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-2">
                      {recentCommunications.map((comm) => (
                        <div
                          key={comm.id}
                          className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50"
                        >
                          <Mic className="h-4 w-4 mt-1 text-muted-foreground" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {comm.subject || 'Voice Note'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {comm.clients?.name || 'Unknown'} • {comm.duration_seconds}s
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {comm.processed_content || comm.transcription || 'Processing...'}
                            </p>
                          </div>
                          <Badge 
                            variant={
                              comm.status === 'completed' ? 'default' :
                              comm.status === 'processing' ? 'secondary' :
                              'outline'
                            }
                          >
                            {comm.status}
                          </Badge>
                        </div>
                      ))}
                      {recentCommunications.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No voice notes yet
                        </p>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Quick Actions and Recording */}
              <Card>
                <CardHeader>
                  <CardTitle>Voice Recording</CardTitle>
                  <CardDescription>
                    Record or upload voice notes to automatically save to CRM
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Recording Controls */}
                  <div className="flex gap-2">
                    <Button
                      size="lg"
                      variant={isRecording ? "destructive" : "default"}
                      className="flex-1"
                      onClick={isRecording ? stopMicrophoneRecording : startMicrophoneRecording}
                      disabled={isProcessing || isTranscribing}
                    >
                      {isRecording ? (
                        <>
                          <MicOff className="mr-2 h-4 w-4" />
                          Stop Recording
                        </>
                      ) : (
                        <>
                          <Mic className="mr-2 h-4 w-4" />
                          Start Recording
                        </>
                      )}
                    </Button>
                    
                    <div>
                      <input
                        type="file"
                        accept="audio/*"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="dashboard-audio-upload"
                        disabled={isProcessing || isTranscribing || isRecording}
                      />
                      <label htmlFor="dashboard-audio-upload">
                        <Button 
                          size="lg"
                          variant="outline" 
                          asChild
                          disabled={isProcessing || isTranscribing || isRecording}
                        >
                          <span>
                            {isTranscribing ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Transcribing...
                              </>
                            ) : (
                              <>
                                <Upload className="mr-2 h-4 w-4" />
                                Upload Audio
                              </>
                            )}
                          </span>
                        </Button>
                      </label>
                    </div>
                  </div>

                  {/* Show transcription progress */}
                  {(isRecording || isTranscribing || recordedTranscription) && (
                    <div className="p-3 bg-muted rounded-lg">
                      {isRecording && (
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full bg-red-500 animate-pulse" />
                          <span className="text-sm">Recording in progress...</span>
                        </div>
                      )}
                      {isTranscribing && (
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-sm">Transcribing audio...</span>
                        </div>
                      )}
                      {recordedTranscription && !isRecording && !isTranscribing && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Transcription:</span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setRecordedTranscription('')}
                            >
                              Clear
                            </Button>
                          </div>
                          <p className="text-sm text-muted-foreground">{recordedTranscription}</p>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Transcription Method:</span>
                    <Badge variant={transcriptionMethod === 'web-speech' ? 'default' : 'secondary'}>
                      {transcriptionMethod === 'web-speech' ? (
                        <>
                          <Wifi className="mr-1 h-3 w-3" />
                          FREE Web Speech API
                        </>
                      ) : (
                        <>
                          <Key className="mr-1 h-3 w-3" />
                          OpenAI Whisper
                        </>
                      )}
                    </Badge>
                  </div>

                  {/* Quick Actions */}
                  <div className="space-y-2 pt-4 border-t">
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={handleTestWorkflow}
                      disabled={!botConfig || isProcessing}
                    >
                      {isProcessing ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Play className="mr-2 h-4 w-4" />
                      )}
                      Test Workflow
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => loadRecentCommunications()}
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Refresh Data
                    </Button>
                    {botConfig && (
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => window.open('https://t.me/' + botConfig?.bot_username, '_blank')}
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Open Bot in Telegram
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Real-time Logs Section */}
            <Card className="mt-4">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Real-time Logs</CardTitle>
                    <CardDescription>Live system activity and processing logs</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="gap-1">
                      <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                      Live
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setRealtimeLogs([])}
                    >
                      Clear Logs
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px] w-full rounded-md border p-4">
                  <div className="space-y-2">
                    {realtimeLogs.length > 0 ? (
                      realtimeLogs.map((log) => (
                        <div
                          key={log.id}
                          className={`flex items-start gap-2 p-2 rounded-lg text-xs ${
                            log.type === 'error' ? 'bg-red-50 dark:bg-red-950/20' :
                            log.type === 'success' ? 'bg-green-50 dark:bg-green-950/20' :
                            log.type === 'warning' ? 'bg-yellow-50 dark:bg-yellow-950/20' :
                            'bg-muted/50'
                          }`}
                        >
                          <div className="mt-0.5">
                            {log.type === 'error' && <AlertCircle className="h-3 w-3 text-red-500" />}
                            {log.type === 'success' && <CheckCircle className="h-3 w-3 text-green-500" />}
                            {log.type === 'warning' && <AlertCircle className="h-3 w-3 text-yellow-500" />}
                            {log.type === 'info' && <Loader2 className="h-3 w-3 text-blue-500" />}
                          </div>
                          <div className="flex-1 space-y-0.5">
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{log.message}</span>
                              <span className="text-muted-foreground">
                                {new Date(log.timestamp).toLocaleTimeString()}
                              </span>
                            </div>
                            {log.details && (
                              <p className="text-muted-foreground">{log.details}</p>
                            )}
                            {log.data && (
                              <pre className="mt-1 p-1 rounded bg-muted text-xs overflow-x-auto">
                                {JSON.stringify(log.data, null, 2)}
                              </pre>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No logs yet. Activity will appear here in real-time.</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Bot Configuration */}
              <Card>
                <CardHeader>
                  <CardTitle>Telegram Bot Configuration</CardTitle>
                  <CardDescription>
                    {botConfig ? `Connected: @${botConfig.bot_username}` : 'Configure your Telegram bot for voice processing'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {botConfig ? (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Status</span>
                          <Badge variant="outline" className="gap-1">
                            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                            Active
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Username</span>
                          <span className="text-sm font-medium">@{botConfig.bot_username}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Bot ID</span>
                          <span className="text-sm font-mono">{botConfig.id.slice(0, 8)}...</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() => setShowBotSetup(true)}
                        >
                          <Settings className="mr-2 h-4 w-4" />
                          Reconfigure
                        </Button>
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() => window.open('https://t.me/' + botConfig?.bot_username, '_blank')}
                        >
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Open Bot
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      className="w-full"
                      onClick={() => setShowBotSetup(true)}
                    >
                      <Bot className="mr-2 h-4 w-4" />
                      Setup Telegram Bot
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* API Keys */}
              <Card>
                <CardHeader>
                  <CardTitle>API Configuration</CardTitle>
                  <CardDescription>
                    Configure API keys for enhanced transcription and AI processing
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="settings-openai-key">OpenAI API Key</Label>
                    <div className="flex gap-2">
                      <Input
                        id="settings-openai-key"
                        type="password"
                        placeholder="sk-..."
                        value={openAIKey}
                        onChange={(e) => setOpenAIKey(e.target.value)}
                      />
                      <Button 
                        size="icon"
                        onClick={handleSaveApiKey}
                      >
                        <Save className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Used for Whisper transcription and GPT-4 processing. Leave empty to use FREE Web Speech API.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Workflow Settings */}
              <Card>
                <CardHeader>
                  <CardTitle>Workflow Configuration</CardTitle>
                  <CardDescription>
                    Manage your voice processing workflow settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Auto-save</span>
                    <Badge variant="outline">Enabled</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Workflow ID</span>
                    <span className="text-sm font-mono">
                      {savedWorkflowId ? savedWorkflowId.slice(0, 12) + '...' : 'Not saved'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Last saved</span>
                    <span className="text-sm">
                      {savedWorkflowId ? 'A few moments ago' : 'Never'}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleSaveWorkflow}
                  >
                    <Save className="mr-2 h-4 w-4" />
                    Save Workflow
                  </Button>
                </CardContent>
              </Card>

              {/* How It Works */}
              <Card>
                <CardHeader>
                  <CardTitle>How It Works</CardTitle>
                  <CardDescription>
                    Quick guide to using Voice-to-CRM
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Recording Options</AlertTitle>
                    <AlertDescription>
                      <ul className="text-sm mt-2 space-y-1">
                        <li>• <strong>Direct Recording:</strong> Use your microphone (FREE)</li>
                        <li>• <strong>File Upload:</strong> Upload audio files for transcription</li>
                        <li>• <strong>Telegram Bot:</strong> Send voice notes to your bot</li>
                        <li>• All transcriptions are processed with AI and saved to CRM</li>
                      </ul>
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Voice Notes Tab */}
          <TabsContent value="voice-notes" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Today's Voice Notes</CardTitle>
                    <CardDescription>
                      Voice conversations recorded today
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search today's notes..."
                        className="pl-8 w-64"
                        value={voiceNotesFilter}
                        onChange={(e) => setVoiceNotesFilter(e.target.value)}
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => loadAllVoiceNotes()}
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px]">
                  <div className="space-y-4">
                    {filteredVoiceNotes.length > 0 ? (
                      filteredVoiceNotes.map((note: any) => (
                        <Card key={note.id} className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-full bg-primary/10">
                                {note.communication_type === 'voice' ? (
                                  <Mic className="h-4 w-4 text-primary" />
                                ) : (
                                  <MessageCircle className="h-4 w-4 text-primary" />
                                )}
                              </div>
                              <div>
                                <h4 className="font-semibold">
                                  {note.clients?.name || note.client_name || 'Unknown Client'}
                                </h4>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <span>{new Date(note.created_at).toLocaleString()}</span>
                                  {note.duration && (
                                    <>
                                      <span>•</span>
                                      <span>{note.duration}s</span>
                                    </>
                                  )}
                                  {note.source && (
                                    <>
                                      <span>•</span>
                                      <Badge variant="secondary" className="text-xs">
                                        {note.source}
                                      </Badge>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {note.sentiment && (
                                <Badge
                                  variant={note.sentiment === 'positive' ? 'default' : 
                                          note.sentiment === 'negative' ? 'destructive' : 'secondary'}
                                >
                                  {note.sentiment}
                                </Badge>
                              )}
                              {note.processed && (
                                <Badge variant="outline" className="text-green-600">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Processed
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          {/* Transcription */}
                          <div className="space-y-3">
                            <div className="p-3 rounded-lg bg-muted/50">
                              <h5 className="text-sm font-medium mb-1 flex items-center gap-2">
                                <FileAudio className="h-3 w-3" />
                                Transcription
                              </h5>
                              <p className="text-sm whitespace-pre-wrap">
                                {note.transcription || note.notes || 'No transcription available'}
                              </p>
                            </div>
                            
                            {/* AI Summary */}
                            {note.summary && (
                              <div className="p-3 rounded-lg bg-primary/5">
                                <h5 className="text-sm font-medium mb-1 flex items-center gap-2">
                                  <Brain className="h-3 w-3" />
                                  AI Summary
                                </h5>
                                <p className="text-sm">{note.summary}</p>
                              </div>
                            )}
                            
                            {/* Key Points */}
                            {note.key_points && note.key_points.length > 0 && (
                              <div className="p-3 rounded-lg bg-muted/30">
                                <h5 className="text-sm font-medium mb-2 flex items-center gap-2">
                                  <List className="h-3 w-3" />
                                  Key Points
                                </h5>
                                <ul className="list-disc list-inside space-y-1">
                                  {note.key_points.map((point: string, idx: number) => (
                                    <li key={idx} className="text-sm">{point}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            
                            {/* Action Items */}
                            {note.action_items && note.action_items.length > 0 && (
                              <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20">
                                <h5 className="text-sm font-medium mb-2 flex items-center gap-2 text-amber-700 dark:text-amber-400">
                                  <AlertCircle className="h-3 w-3" />
                                  Action Items
                                </h5>
                                <ul className="space-y-1">
                                  {note.action_items.map((item: string, idx: number) => (
                                    <li key={idx} className="flex items-start gap-2 text-sm">
                                      <CheckCircle className="h-3 w-3 mt-0.5 text-amber-600" />
                                      <span>{item}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            
                            {/* Metadata */}
                            {note.metadata && (
                              <div className="pt-3 border-t flex flex-wrap gap-2">
                                {Object.entries(note.metadata).map(([key, value]: [string, any]) => (
                                  <Badge key={key} variant="outline" className="text-xs">
                                    {key}: {String(value)}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </Card>
                      ))
                    ) : (
                      <div className="text-center py-12">
                        <FileAudio className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                        <p className="text-muted-foreground">
                          {voiceNotesFilter 
                            ? 'No voice notes match your search' 
                            : 'No voice notes recorded today'}
                        </p>
                        <Button
                          variant="outline"
                          className="mt-4"
                          onClick={() => setActiveTab('dashboard')}
                        >
                          Record a Voice Note
                        </Button>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Bot Setup Dialog */}
      <Dialog open={showBotSetup} onOpenChange={setShowBotSetup}>
        <DialogContent className="max-w-2xl">
          <DialogHeader className="sr-only">
            <DialogTitle>Telegram Bot Setup</DialogTitle>
            <DialogDescription>Configure your Telegram bot for voice message processing</DialogDescription>
          </DialogHeader>
          <TelegramBotSetup 
            onComplete={handleBotSetupComplete}
            defaultConfig={botConfig || undefined}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}