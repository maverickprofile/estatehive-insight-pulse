import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  MessageCircle, 
  Mic, 
  Bot, 
  Sparkles,
  ArrowRight,
  Shield,
  Lock,
  CheckCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";

// AI Tools Data - Original 3 tools
const aiTools = [
  {
    id: 'whatsappAI',
    title: 'Automations',
    description: 'AI-powered automation workflows for business processes.',
    icon: MessageCircle,
    color: 'from-green-600 to-emerald-600',
    bgColor: 'from-green-500/10 to-emerald-500/10',
    status: 'coming',
    statusLabel: 'Coming Soon',
    progress: 45,
    features: [
      'Build custom automation workflows',
      'Multi-channel integrations',
      'Visual workflow builder'
    ],
    link: '/ai-tools/whatsapp-qai',
    configDetails: {
      info: "Create powerful automation workflows with our visual builder. Connect multiple services and automate repetitive tasks.",
      apiKeyRequired: true,
      setupSteps: [
        "Design your workflow using the visual builder.",
        "Configure integrations and API keys.",
        "Test and deploy your automation."
      ]
    }
  },
  {
    id: 'voiceToCRM',
    title: 'Voice-to-CRM Logger',
    description: 'Record voice memos that auto-transcribe to CRM.',
    icon: Mic,
    color: 'from-purple-600 to-pink-600',
    bgColor: 'from-purple-500/10 to-pink-500/10',
    status: 'active',
    statusLabel: 'Active',
    progress: 100,
    features: [
      'Tap to record in client profile',
      'AI transcribes and summarizes conversations',
      'Auto-logs entries in client history'
    ],
    link: '/ai-tools/voice-to-crm',
    configDetails: {
      info: "Uses advanced speech-to-text technology to transcribe your voice notes directly into client records, saving you time.",
      apiKeyRequired: false,
      setupSteps: [
        "Enable microphone permissions in your browser.",
        "Go to a client's profile page.",
        "Tap the microphone icon to start recording."
      ]
    }
  },
  {
    id: 'nlpSummarizer',
    title: 'NLP Note Summarizer',
    description: 'Advanced summarization of client interactions.',
    icon: Bot,
    color: 'from-teal-600 to-cyan-600',
    bgColor: 'from-teal-500/10 to-cyan-500/10',
    status: 'coming',
    statusLabel: 'Coming Soon',
    progress: 60,
    features: [
      'Extracts key points from long notes',
      'Sentiment analysis of interactions',
      'Identifies action items and tasks'
    ],
    configDetails: {
      info: "Uses Natural Language Processing to summarize long text notes, identifying key points, sentiment, and action items.",
      apiKeyRequired: false,
      setupSteps: [
        "This feature is automatically active.",
        "Write detailed notes in the client interaction logs.",
        "A summary will be automatically generated below your note."
      ]
    }
  }
];

export default function AiToolsNew() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const handleToolClick = (tool: typeof aiTools[0]) => {
    if (tool.id === 'whatsappAI') {
      navigate('/ai-tools/whatsapp-qai');
    } else if (tool.id === 'voiceToCRM') {
      navigate('/ai-tools/voice-to-crm');
    } else if (tool.status === 'active' || tool.status === 'beta') {
      // For NLP Summarizer and other active tools
      toast({
        title: tool.title,
        description: tool.configDetails.info
      });
    }
  };

  return (
    <div className="w-full h-full overflow-y-auto bg-gradient-to-br from-background via-background to-purple-50/5 dark:to-purple-950/10">
      <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto min-h-full">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-pink-600 bg-clip-text text-transparent">
                AI Tools
              </h1>
              <p className="text-muted-foreground mt-2">
                Supercharge your workflow with intelligent automation
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="px-3 py-1">
                <Sparkles className="h-3 w-3 mr-1" />
                AI-Powered
              </Badge>
              <Badge variant="outline" className="px-3 py-1">
                <Shield className="h-3 w-3 mr-1" />
                Secure
              </Badge>
            </div>
          </div>
        </div>

        {/* AI Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {aiTools.map((tool) => (
            <Card
              key={tool.id}
              className={cn(
                "relative border-0 overflow-hidden cursor-pointer transition-all duration-300",
                "hover:shadow-2xl hover:scale-[1.02]",
                tool.status !== 'coming' && "hover:ring-2 hover:ring-primary/50"
              )}
              onMouseEnter={() => setHoveredCard(tool.id)}
              onMouseLeave={() => setHoveredCard(null)}
              onClick={() => handleToolClick(tool)}
            >
              {/* Background Gradient */}
              <div className={cn(
                "absolute inset-0 bg-gradient-to-br opacity-5",
                tool.bgColor
              )} />
              
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "p-3 rounded-xl bg-gradient-to-br text-white",
                      tool.color
                    )}>
                      <tool.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{tool.title}</h3>
                      <Badge 
                        variant={tool.status === 'active' ? 'default' : tool.status === 'beta' ? 'secondary' : 'outline'}
                        className="mt-1"
                      >
                        {tool.statusLabel}
                      </Badge>
                    </div>
                  </div>
                  {tool.status !== 'coming' ? (
                    <ArrowRight className={cn(
                      "h-5 w-5 transition-transform",
                      hoveredCard === tool.id && "translate-x-1"
                    )} />
                  ) : (
                    <Lock className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {tool.description}
                </p>
                
                {/* Features */}
                <div className="space-y-2">
                  {tool.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span className="text-muted-foreground">{feature}</span>
                    </div>
                  ))}
                </div>
                
                {/* Progress Bar */}
                <div className="pt-2">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="text-muted-foreground">
                      {tool.status === 'active' ? 'Ready to use' : 
                       tool.status === 'beta' ? 'Beta testing' : 'Development'}
                    </span>
                    <span className="font-medium">{tool.progress}%</span>
                  </div>
                  <Progress value={tool.progress} className="h-2" />
                </div>
                
                {/* Action Button */}
                {tool.status !== 'coming' && (
                  <Button 
                    className="w-full mt-2"
                    variant={tool.status === 'active' ? 'default' : 'secondary'}
                  >
                    {tool.status === 'active' ? 'Open Tool' : 'Try Beta'}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

      </div>
    </div>
  );
}