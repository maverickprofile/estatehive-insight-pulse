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
  CheckCircle,
  Check
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import "./ai-tools-cards.css";

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
    link: null, // Disabled for now - no workflows created yet
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
      // Disabled for now - no workflows created yet
      toast({
        title: "Coming Soon",
        description: "Automation workflows are currently under development. Check back soon!"
      });
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
              <h1 className="text-3xl md:text-4xl font-bold text-black dark:text-white">
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

        {/* AI Tools Grid - Responsive with better mobile stacking */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
          {aiTools.map((tool) => (
            <div
              key={tool.id}
              className={cn(
                "ai-tool-card",
                tool.id === 'whatsappAI' && "tool-whatsapp",
                tool.id === 'voiceToCRM' && "tool-voice",
                tool.id === 'nlpSummarizer' && "tool-nlp"
              )}
              onClick={() => handleToolClick(tool)}
            >
              {/* Header */}
              <div className="ai-tool-header">
                <div className={cn(
                  "ai-tool-icon-wrapper",
                  tool.id === 'whatsappAI' && "bg-green-100 dark:bg-green-900/30",
                  tool.id === 'voiceToCRM' && "bg-purple-100 dark:bg-purple-900/30",
                  tool.id === 'nlpSummarizer' && "bg-blue-100 dark:bg-blue-900/30"
                )}>
                  <tool.icon className={cn(
                    "h-5 w-5",
                    tool.id === 'whatsappAI' && "text-green-600 dark:text-green-400",
                    tool.id === 'voiceToCRM' && "text-purple-600 dark:text-purple-400",
                    tool.id === 'nlpSummarizer' && "text-blue-600 dark:text-blue-400"
                  )} />
                </div>
                <span className={cn(
                  "ai-tool-badge",
                  tool.status === 'active' && "status-active",
                  tool.status === 'coming' && "status-coming",
                  tool.status === 'beta' && "status-beta"
                )}>
                  {tool.statusLabel}
                </span>
              </div>

              {/* Content Wrapper */}
              <div className="ai-tool-content">
                <h3 className="ai-tool-title">{tool.title}</h3>
                <p className="ai-tool-description">{tool.description}</p>

                {/* Features */}
                <div className="ai-tool-features">
                  {tool.features.slice(0, 2).map((feature, idx) => (
                    <div key={idx} className="ai-tool-feature">
                      <Check className="ai-tool-feature-icon" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Progress */}
                <div className="ai-tool-progress">
                  <div className="ai-tool-progress-bar">
                    <div 
                      className={cn(
                        "ai-tool-progress-fill",
                        tool.id === 'whatsappAI' && "bg-green-500",
                        tool.id === 'voiceToCRM' && "bg-purple-500",
                        tool.id === 'nlpSummarizer' && "bg-blue-500"
                      )}
                      style={{ width: `${tool.progress}%` }}
                    />
                  </div>
                  <div className="ai-tool-progress-text">
                    <span>{tool.progress}% Complete</span>
                    {tool.status === 'active' && <span className="text-green-600">Active</span>}
                    {tool.status === 'coming' && <span className="text-amber-600">Coming Soon</span>}
                    {tool.status === 'beta' && <span className="text-blue-600">Beta</span>}
                  </div>
                </div>
              </div>

              {/* Action Button - Always at bottom */}
              <div className="ai-tool-action">
                <button 
                  className={cn(
                    "ai-tool-btn",
                    tool.status === 'active' && "ai-tool-btn-active"
                  )}
                  disabled={tool.status === 'coming'}
                >
                {tool.status === 'active' && (
                  <>
                    <ArrowRight className="h-4 w-4" />
                    Open Tool
                  </>
                )}
                {tool.status === 'coming' && (
                  <>
                    <Lock className="h-4 w-4" />
                    Coming Soon
                  </>
                )}
                {tool.status === 'beta' && (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Try Beta
                  </>
                )}
                </button>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}