// IMPORTANT: This file must be named AiAgents.tsx for the TypeScript syntax to work correctly.
import React, { useState } from 'react';
import { Bot, MessageCircle, Star, Clock, Bell, Settings, Shield, FileText, Mic, Scale, GraduationCap, Zap, LucideIcon, Search, User, LogOut } from 'lucide-react';

// --- Type Definitions for TypeScript ---
type ActiveToggles = {
  whatsappAI: boolean;
  leadScoring: boolean;
  autoFollowup: boolean;
  nlpSummarizer: boolean;
  voiceToCRM: boolean;
  hivePassport: boolean;
  autoDocGen: boolean;
  legalCounsel: boolean;
  pitchTrainer: boolean;
};

type AITool = {
  id: keyof ActiveToggles;
  title: string;
  description: string;
  icon: LucideIcon;
  status: string;
  color: string;
  category: string;
  features: string[];
};

// --- Placeholder UI Components (assuming from shadcn/ui) ---
// In a real app, you would import these from your actual component library
const Button = ({ variant, size, className, children, ...props }: { variant?: string, size?: string, className?: string, children: React.ReactNode, [key: string]: any }) => (
    <button className={`inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none disabled:opacity-50 disabled:pointer-events-none ${className}`} {...props}>
        {children}
    </button>
);
const Badge = ({ className, children }: { className?: string, children: React.ReactNode }) => (
    <span className={`inline-flex items-center border rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors ${className}`}>
        {children}
    </span>
);
const DropdownMenu = ({ children }: { children: React.ReactNode }) => <div className="relative inline-block text-left">{children}</div>;
const DropdownMenuTrigger = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;
const DropdownMenuContent = ({ children, className, align }: { children: React.ReactNode, className?: string, align?: string }) => <div className={`origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none ${className}`}>{children}</div>;
const DropdownMenuItem = ({ children, className }: { children: React.ReactNode, className?: string }) => <a href="#" className={`flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 ${className}`}>{children}</a>;
const DropdownMenuSeparator = () => <div className="border-t border-gray-100 my-1"></div>;
// --- End of Placeholders ---

// --- Placeholder Sidebar Component ---
// In a real app, you would import this from "@/components/Sidebar"
const Sidebar = () => (
    <div className="w-64 bg-white border-r border-gray-200 flex-shrink-0 hidden lg:block">
        <div className="p-6">
            <h2 className="text-2xl font-bold text-indigo-600">Estate Hive</h2>
        </div>
        <nav className="p-4 space-y-2">
            <a href="#" className="flex items-center px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Dashboard</a>
            <a href="#" className="flex items-center px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Properties</a>
            <a href="#" className="flex items-center px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Leads</a>
            <a href="#" className="flex items-center px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Clients</a>
            <a href="#" className="flex items-center px-4 py-2 text-gray-700 font-bold bg-indigo-100 text-indigo-700 rounded-lg">AI Agents</a>
        </nav>
    </div>
);

// --- Header Component ---
// In a real app, you would import this from "@/components/Header"
const Header = () => {
  return (
    <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6 flex-shrink-0">
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search AI tools..."
            className="w-full pl-10 pr-4 py-2 bg-gray-100 border border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
          />
        </div>
      </div>
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="relative text-gray-600 hover:bg-gray-100">
          <Bell className="w-5 h-5" />
          <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500 text-white text-xs">3</Badge>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger>
            <Button variant="ghost" className="flex items-center gap-2 px-3 hover:bg-gray-100">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <div className="text-left hidden md:block">
                <p className="text-sm font-medium text-gray-800">Rahul Sharma</p>
                <p className="text-xs text-gray-500">Admin</p>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem><User className="mr-2 h-4 w-4" /> Profile</DropdownMenuItem>
            <DropdownMenuItem><Settings className="mr-2 h-4 w-4" /> Settings</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600 hover:bg-red-50"><LogOut className="mr-2 h-4 w-4" /> Logout</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}


// --- Main AI Tools Page Content ---
const AIToolsContent: React.FC = () => {
  const [activeToggles, setActiveToggles] = useState<ActiveToggles>({
    whatsappAI: false, leadScoring: true, autoFollowup: false, nlpSummarizer: true,
    voiceToCRM: true, hivePassport: false, autoDocGen: false, legalCounsel: false, pitchTrainer: false,
  });

  const toggleFeature = (feature: keyof ActiveToggles) => {
    setActiveToggles(prev => ({ ...prev, [feature]: !prev[feature] }));
  };

  const aiTools: AITool[] = [
    { id: 'whatsappAI', title: 'WhatsApp QAI Agent', description: 'AI-powered chatbot for WhatsApp Business API integration.', icon: MessageCircle, status: 'Beta Ready', color: 'bg-green-100 text-green-600', category: 'Communication', features: ['Handles initial lead inquiries 24/7', 'Qualifies leads before agent assignment', 'Multi-language support'] },
    { id: 'leadScoring', title: 'Smart Lead Scoring', description: 'AI model scoring leads based on conversion probability.', icon: Star, status: 'Active', color: 'bg-yellow-100 text-yellow-600', category: 'Analytics', features: ['Analyzes budget, location, and history', 'Real-time scoring updates', 'Helps agents prioritize high-potential leads'] },
    { id: 'autoFollowup', title: 'Auto Smart Follow-ups', description: 'Detects inactive leads and suggests personalized follow-ups.', icon: Clock, status: 'Beta Ready', color: 'bg-blue-100 text-blue-600', category: 'Automation', features: ['Monitors lead inactivity', 'Generates smart reminders for agents', 'Optimal timing suggestions'] },
    { id: 'voiceToCRM', title: 'Voice-to-CRM Logger', description: 'Record voice memos that auto-transcribe to CRM.', icon: Mic, status: 'Active', color: 'bg-purple-100 text-purple-600', category: 'Productivity', features: ['Tap to record in client profile', 'AI transcribes and summarizes conversations', 'Auto-logs entries in client history'] },
    { id: 'hivePassport', title: 'Hive Passport', description: 'Secure client identity and document verification.', icon: Shield, status: 'Coming Q2 2025', color: 'bg-red-100 text-red-600', category: 'Security', features: ['Integrates with DigiLocker', 'Verifies PAN, Aadhaar, and property records', 'Secure, encrypted document storage'] },
    { id: 'autoDocGen', title: 'Auto Document Generation', description: 'Generate ready-to-sign PDFs from templates.', icon: FileText, status: 'Beta Ready', color: 'bg-indigo-100 text-indigo-600', category: 'Documentation', features: ['Auto-populates client and property data', 'Legally compliant templates', 'Digital signature integration ready'] },
    { id: 'legalCounsel', title: 'AI Legal Counsel', description: 'Chatbot trained on Indian real estate law.', icon: Scale, status: 'Coming Q3 2025', color: 'bg-gray-100 text-gray-600', category: 'Legal', features: ['Answers compliance questions', 'Provides guidance on legal procedures', 'Updated with latest law changes'] },
    { id: 'pitchTrainer', title: 'AI Pitch Trainer', description: 'Interactive tool to practice and improve sales pitches.', icon: GraduationCap, status: 'Coming Q4 2025', color: 'bg-pink-100 text-pink-600', category: 'Training', features: ['Record and analyze pitch delivery', 'AI feedback on clarity and confidence', 'Personalized training recommendations'] },
    { id: 'nlpSummarizer', title: 'NLP Note Summarizer', description: 'Advanced summarization of client interactions.', icon: Bot, status: 'Active', color: 'bg-teal-100 text-teal-600', category: 'Analytics', features: ['Extracts key points from long notes', 'Sentiment analysis of interactions', 'Identifies action items and tasks'] }
  ];

  const getStatusColor = (status: string): string => {
    if (status === 'Active') return 'bg-green-100 text-green-800';
    if (status === 'Beta Ready') return 'bg-blue-100 text-blue-800';
    if (status.startsWith('Coming')) return 'bg-orange-100 text-orange-800';
    return 'bg-gray-100 text-gray-600';
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
        <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-xl p-6 text-white">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-semibold mb-1">Estate Hive AI Intelligence Suite</h2>
              <p className="text-gray-300 text-sm">Comprehensive AI automation for lead management, client communication, and agent training.</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {aiTools.map((tool) => {
            const Icon = tool.icon;
            const isActive = activeToggles[tool.id];
            
            return (
              <div key={tool.id} className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col justify-between hover:shadow-lg transition-shadow">
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${tool.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-gray-900">{tool.title}</h3>
                        <span className={`inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(tool.status)}`}>
                          {tool.status}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleFeature(tool.id)}
                      disabled={tool.status.includes('Coming')}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ${isActive ? 'bg-green-600' : 'bg-gray-200'} ${tool.status.includes('Coming') ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isActive ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>
                  <p className="text-gray-600 text-sm mb-4">{tool.description}</p>
                  <ul className="space-y-1.5">
                    {tool.features.map((feature, index) => (
                      <li key={index} className="text-sm text-gray-600 flex items-start">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2.5 mt-1.5 flex-shrink-0"></div>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="px-5 pb-5 mt-4">
                  <button 
                    className="w-full py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={tool.status.includes('Coming')}
                  >
                    {tool.status.includes('Coming') ? 'Join Beta Waitlist' : 'Configure Settings'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
    </div>
  );
};

// --- Main Page Wrapper ---
// This is the component you should import in your App.tsx
const AiAgents = () => {
    return (
        <div className="min-h-screen bg-gray-50 flex w-full">
            <Sidebar />
            <div className="flex-1 flex flex-col">
                <Header />
                <main className="flex-1 overflow-auto">
                    <AIToolsContent />
                </main>
            </div>
        </div>
    );
};

export default AiAgents;
