import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import {
  MessageCircle,
  Send,
  Phone,
  Video,
  Search,
  Plus,
  Settings,
  Star,
  Archive,
  Trash2,
  Clock,
  CheckCheck,
  Lock,
  Sparkles,
  MessageSquare,
  Users,
  Bot,
  Mail,
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  Zap,
  Shield,
  Bell,
  Filter,
  MoreVertical,
  Paperclip,
  Smile,
  Mic,
  Image as ImageIcon,
  AtSign,
  Hash,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Mock data for demonstration
const platforms = [
  { id: 'whatsapp', name: 'WhatsApp', icon: MessageCircle, color: 'green', count: 0 },
  { id: 'telegram', name: 'Telegram', icon: Send, color: 'blue', count: 0 },
  { id: 'email', name: 'Email', icon: Mail, color: 'purple', count: 0 },
  { id: 'sms', name: 'SMS', icon: MessageSquare, color: 'orange', count: 0 },
  { id: 'facebook', name: 'Facebook', icon: Facebook, color: 'blue', count: 0 },
  { id: 'instagram', name: 'Instagram', icon: Instagram, color: 'pink', count: 0 },
];

const upcomingFeatures = [
  {
    title: 'Unified Inbox',
    description: 'All messages from every platform in one place',
    icon: MessageSquare,
    progress: 75,
    color: 'blue'
  },
  {
    title: 'Smart Replies',
    description: 'AI-powered suggested responses',
    icon: Bot,
    progress: 60,
    color: 'purple'
  },
  {
    title: 'Auto-Translation',
    description: 'Real-time message translation',
    icon: AtSign,
    progress: 45,
    color: 'green'
  },
  {
    title: 'Voice & Video Calls',
    description: 'Integrated calling features',
    icon: Phone,
    progress: 30,
    color: 'orange'
  },
  {
    title: 'Team Collaboration',
    description: 'Internal notes and mentions',
    icon: Users,
    progress: 50,
    color: 'pink'
  },
  {
    title: 'Message Templates',
    description: 'Quick response templates',
    icon: Hash,
    progress: 65,
    color: 'indigo'
  }
];

export default function MessagesNew() {
  const [selectedPlatform, setSelectedPlatform] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Mobile Coming Soon View
  if (isMobile) {
    return (
      <div className="w-full h-full flex items-center justify-center p-4 overflow-y-auto">
        <div className="text-center max-w-sm mx-auto">
          {/* Icon */}
          <div className="relative mb-6">
            <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 p-1">
              <div className="w-full h-full rounded-full bg-background flex items-center justify-center">
                <MessageCircle className="h-10 w-10 text-blue-600" />
              </div>
            </div>
            <Sparkles className="absolute -top-1 -right-1 h-6 w-6 text-yellow-500 animate-pulse" />
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold mb-2 text-black dark:text-white">
            Messages
          </h2>
          <p className="text-base text-muted-foreground mb-1">Coming Soon</p>
          <p className="text-sm text-muted-foreground/80 mb-6">
            Unified messaging hub for all your communications
          </p>

          {/* Features */}
          <div className="space-y-3 mb-6">
            {[
              { icon: MessageSquare, title: 'Unified Inbox', color: 'text-blue-500' },
              { icon: Bot, title: 'AI Smart Replies', color: 'text-purple-500' },
              { icon: Users, title: 'Team Collaboration', color: 'text-green-500' }
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <feature.icon className={cn("h-5 w-5", feature.color)} />
                <span className="text-sm font-medium text-left">{feature.title}</span>
              </div>
            ))}
          </div>

          {/* CTA */}
          <Button disabled className="w-full">
            <Clock className="h-4 w-4 mr-2" />
            In Development
          </Button>
        </div>
      </div>
    );
  }

  // Desktop View
  return (
    <div className="w-full h-full flex flex-col relative overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-blue-50/5 dark:to-blue-950/10 pointer-events-none" />
      
      {/* Main Content */}
      <div className="relative flex-1 flex flex-col lg:flex-row h-full overflow-hidden">
        {/* Sidebar - Mobile: Full width, Desktop: 1/3 width */}
        <div className="w-full lg:w-1/3 xl:w-1/4 border-r border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex flex-col h-full overflow-hidden">
          {/* Header */}
          <div className="p-4 md:p-6 border-b border-border/50">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-black dark:text-white">
                  Messages
                </h1>
                <p className="text-sm text-muted-foreground mt-1">Unified communication hub</p>
              </div>
              <div className="flex gap-2">
                <Button size="icon" variant="outline" className="h-9 w-9">
                  <Bell className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="outline" className="h-9 w-9">
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10 h-10 bg-background"
              />
              <Button size="icon" variant="ghost" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Platform Tabs */}
          <Tabs defaultValue="all" className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="grid grid-cols-4 md:grid-cols-7 gap-1 p-1 m-4 h-auto bg-muted/50">
              <TabsTrigger value="all" className="data-[state=active]:bg-background">
                All
              </TabsTrigger>
              {platforms.map((platform) => (
                <TabsTrigger 
                  key={platform.id} 
                  value={platform.id}
                  className="data-[state=active]:bg-background relative"
                >
                  <platform.icon className="h-4 w-4" />
                  {platform.count > 0 && (
                    <Badge className="absolute -top-2 -right-2 h-4 px-1 text-[10px]">
                      {platform.count}
                    </Badge>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="all" className="flex-1 mt-0 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="p-4 space-y-2">
                  {/* Mock conversation list with coming soon overlay */}
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="relative overflow-hidden group hover:shadow-md transition-all cursor-pointer border-0 bg-muted/30">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <CardContent className="p-4 relative">
                        <div className="flex items-start gap-3">
                          <Avatar className="h-10 w-10 border-2 border-background">
                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                              U{i}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <p className="font-semibold text-sm truncate">User {i}</p>
                              <span className="text-xs text-muted-foreground">2:30 PM</span>
                            </div>
                            <p className="text-xs text-muted-foreground truncate">Last message preview...</p>
                          </div>
                          <Lock className="h-4 w-4 text-muted-foreground/50" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col h-full relative overflow-hidden">
          {/* Coming Soon Overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-background/95 via-background/98 to-background backdrop-blur-sm z-10 overflow-y-auto">
            <div className="h-full flex items-center justify-center p-4 overflow-y-auto">
              <div className="max-w-4xl w-full py-6 text-center">
              {/* Animated Icon */}
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 blur-3xl animate-pulse" />
                <div className="relative mx-auto w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 p-1">
                  <div className="w-full h-full rounded-full bg-background flex items-center justify-center">
                    <MessageCircle className="h-10 w-10 md:h-12 md:w-12 text-transparent bg-gradient-to-br from-blue-500 to-purple-600 bg-clip-text" />
                  </div>
                </div>
                <div className="absolute -top-1 -right-1 md:-top-2 md:-right-2">
                  <div className="relative">
                    <Sparkles className="h-6 w-6 md:h-8 md:w-8 text-yellow-500 animate-pulse" />
                    <div className="absolute inset-0 bg-yellow-500/50 blur-xl animate-pulse" />
                  </div>
                </div>
              </div>

              {/* Title */}
              <h2 className="text-2xl md:text-4xl font-bold mb-3 text-black dark:text-white">
                Unified Messaging Hub
              </h2>
              <p className="text-base md:text-lg text-muted-foreground mb-2">
                Coming Soon
              </p>
              <p className="text-sm md:text-base text-muted-foreground/80 max-w-2xl mx-auto mb-6">
                Connect all your communication channels in one powerful interface. WhatsApp, Telegram, Email, SMS, and social media - all managed from a single dashboard.
              </p>

              {/* Feature Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 mb-6">
                {upcomingFeatures.map((feature, index) => (
                  <Card key={index} className="relative overflow-hidden border-0 bg-gradient-to-br from-muted/50 to-muted/30 hover:shadow-xl transition-all duration-300 group">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <CardContent className="p-4 md:p-5 relative">
                      <div className="flex items-start gap-4">
                        <div className={cn(
                          "p-3 rounded-xl",
                          feature.color === 'blue' && "bg-blue-500/10 text-blue-600 dark:text-blue-400",
                          feature.color === 'purple' && "bg-purple-500/10 text-purple-600 dark:text-purple-400",
                          feature.color === 'green' && "bg-green-500/10 text-green-600 dark:text-green-400",
                          feature.color === 'orange' && "bg-orange-500/10 text-orange-600 dark:text-orange-400",
                          feature.color === 'pink' && "bg-pink-500/10 text-pink-600 dark:text-pink-400",
                          feature.color === 'indigo' && "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                        )}>
                          <feature.icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-xs md:text-sm mb-1">{feature.title}</h3>
                          <p className="text-[10px] md:text-xs text-muted-foreground mb-2">{feature.description}</p>
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[10px] md:text-xs">
                              <span className="text-muted-foreground">Progress</span>
                              <span className="font-medium">{feature.progress}%</span>
                            </div>
                            <Progress value={feature.progress} className="h-1 md:h-1.5" />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Platform Integration Preview */}
              <Card className="border-0 bg-gradient-to-br from-muted/30 to-muted/20 mb-6">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base md:text-lg flex items-center gap-2">
                    <Zap className="h-4 w-4 md:h-5 md:w-5 text-yellow-500" />
                    Supported Platforms
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex flex-wrap justify-center gap-2 md:gap-3">
                    {[
                      { name: 'WhatsApp', icon: MessageCircle, color: 'text-green-500' },
                      { name: 'Telegram', icon: Send, color: 'text-blue-500' },
                      { name: 'Email', icon: Mail, color: 'text-purple-500' },
                      { name: 'SMS', icon: MessageSquare, color: 'text-orange-500' },
                      { name: 'Facebook', icon: Facebook, color: 'text-blue-600' },
                      { name: 'Instagram', icon: Instagram, color: 'text-pink-500' },
                      { name: 'Twitter', icon: Twitter, color: 'text-sky-500' },
                      { name: 'LinkedIn', icon: Linkedin, color: 'text-blue-700' }
                    ].map((platform, i) => (
                      <div key={i} className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="p-2 md:p-2.5 rounded-full bg-background shadow-sm">
                          <platform.icon className={cn("h-4 w-4 md:h-5 md:w-5", platform.color)} />
                        </div>
                        <span className="text-[10px] md:text-xs font-medium">{platform.name}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* CTA Section */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                <Button 
                  size="default" 
                  disabled
                  className="min-w-[160px] md:min-w-[180px] bg-gradient-to-r from-gray-400 to-gray-500 text-white h-9 md:h-10"
                >
                  <Clock className="h-4 w-4 mr-2" />
                  In Development
                </Button>
                <Button 
                  size="default" 
                  variant="outline"
                  className="min-w-[160px] md:min-w-[180px] border-2 h-9 md:h-10"
                >
                  <Bell className="h-4 w-4 mr-2" />
                  Get Notified
                </Button>
              </div>

              {/* Security Badge */}
              <div className="mt-6 flex items-center justify-center gap-2 text-[10px] md:text-xs text-muted-foreground">
                <Shield className="h-3 w-3 md:h-4 md:w-4 text-green-500" />
                <span>End-to-end encrypted • GDPR compliant • SOC 2 certified</span>
              </div>
            </div>
            </div>
          </div>

          {/* Blurred Chat Preview (Behind Coming Soon) */}
          <div className="flex-1 flex flex-col blur-sm opacity-30">
            {/* Chat Header */}
            <div className="border-b border-border/50 bg-background/95 backdrop-blur p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>JD</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">John Doe</p>
                    <p className="text-xs text-muted-foreground">Online</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="icon" variant="ghost">
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost">
                    <Video className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 p-4 space-y-4 overflow-y-auto">
              <div className="flex gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>JD</AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1">
                  <div className="bg-muted rounded-lg p-3 max-w-md">
                    <p className="text-sm">Hey! I'm interested in the property listing...</p>
                  </div>
                  <span className="text-xs text-muted-foreground">2:30 PM</span>
                </div>
              </div>
            </div>

            {/* Message Input */}
            <div className="border-t border-border/50 bg-background/95 backdrop-blur p-4">
              <div className="flex items-center gap-2">
                <Button size="icon" variant="ghost">
                  <Paperclip className="h-4 w-4" />
                </Button>
                <Input placeholder="Type a message..." className="flex-1" />
                <Button size="icon" variant="ghost">
                  <Smile className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost">
                  <Mic className="h-4 w-4" />
                </Button>
                <Button size="icon">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Animated gradient background effect */}
      <style jsx>{`
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }
      `}</style>
    </div>
  );
}