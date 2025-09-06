import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Megaphone,
  Target,
  TrendingUp,
  DollarSign,
  Users,
  Eye,
  MousePointer,
  BarChart3,
  Calendar,
  Settings,
  Plus,
  PlayCircle,
  PauseCircle,
  RefreshCw,
  ChevronRight,
  Sparkles,
  Zap,
  Globe,
  Facebook,
  Instagram,
  Youtube,
  Linkedin,
  Twitter,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Filter,
  Download,
  Share2,
  Lock
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Mock data for demonstration
const campaignStats = {
  totalSpend: 45678,
  totalReach: 234500,
  totalClicks: 12300,
  totalConversions: 456,
  roi: 3.2,
  activeCampaigns: 8
};

export default function AdsManager() {
  const [selectedPlatform, setSelectedPlatform] = useState('all');
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
            <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 p-1">
              <div className="w-full h-full rounded-full bg-background flex items-center justify-center">
                <Megaphone className="h-10 w-10 text-purple-600" />
              </div>
            </div>
            <Sparkles className="absolute -top-1 -right-1 h-6 w-6 text-yellow-500 animate-pulse" />
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Ads Manager
          </h2>
          <p className="text-base text-muted-foreground mb-1">Coming Soon</p>
          <p className="text-sm text-muted-foreground/80 mb-6">
            Manage all your marketing campaigns in one place
          </p>

          {/* Features */}
          <div className="space-y-3 mb-6">
            {[
              { icon: Facebook, title: 'Meta Ads', color: 'text-blue-500' },
              { icon: Globe, title: 'Google Ads', color: 'text-green-500' },
              { icon: Target, title: 'Smart Targeting', color: 'text-orange-500' }
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <feature.icon className={cn("h-5 w-5", feature.color)} />
                <span className="text-sm font-medium text-left">{feature.title}</span>
              </div>
            ))}
          </div>

          {/* Progress */}
          <div className="mb-6">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-muted-foreground">Development Progress</span>
              <span className="font-medium">35%</span>
            </div>
            <Progress value={35} className="h-2" />
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
    <div className="w-full h-full overflow-y-auto bg-gradient-to-br from-background via-background to-purple-50/5 dark:to-purple-950/10">
      <div className="p-3 md:p-4 lg:p-6 max-w-[1600px] mx-auto space-y-4 pb-8">
        {/* Header Section */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 via-blue-600/10 to-pink-600/10 blur-3xl" />
          <div className="relative">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  Ads Manager
                </h1>
                <p className="text-muted-foreground mt-1">
                  Manage all your marketing campaigns in one place
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" className="gap-2">
                  <Filter className="h-4 w-4" />
                  Filter
                </Button>
                <Button size="sm" variant="outline" className="gap-2">
                  <Download className="h-4 w-4" />
                  Export
                </Button>
                <Button size="sm" className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700">
                  <Plus className="h-4 w-4" />
                  New Campaign
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Overview - Mobile Optimized Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 lg:gap-3">
          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-purple-500/10 to-purple-600/5 dark:from-purple-500/20 dark:to-purple-600/10">
            <CardContent className="p-3 lg:p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] lg:text-xs text-muted-foreground font-medium">Total Spend</p>
                  <p className="text-lg lg:text-xl font-bold mt-1">₹{(campaignStats.totalSpend / 1000).toFixed(1)}K</p>
                  <div className="flex items-center gap-1 mt-2">
                    <ArrowUpRight className="h-3 w-3 text-green-500" />
                    <span className="text-xs text-green-500">12%</span>
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-purple-500/20">
                  <DollarSign className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-blue-500/10 to-blue-600/5 dark:from-blue-500/20 dark:to-blue-600/10">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Reach</p>
                  <p className="text-xl md:text-2xl font-bold mt-1">{(campaignStats.totalReach / 1000).toFixed(0)}K</p>
                  <div className="flex items-center gap-1 mt-2">
                    <ArrowUpRight className="h-3 w-3 text-green-500" />
                    <span className="text-xs text-green-500">23%</span>
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-blue-500/20">
                  <Eye className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-green-500/10 to-green-600/5 dark:from-green-500/20 dark:to-green-600/10">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Clicks</p>
                  <p className="text-xl md:text-2xl font-bold mt-1">{(campaignStats.totalClicks / 1000).toFixed(1)}K</p>
                  <div className="flex items-center gap-1 mt-2">
                    <ArrowUpRight className="h-3 w-3 text-green-500" />
                    <span className="text-xs text-green-500">8%</span>
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-green-500/20">
                  <MousePointer className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-orange-500/10 to-orange-600/5 dark:from-orange-500/20 dark:to-orange-600/10">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Conversions</p>
                  <p className="text-xl md:text-2xl font-bold mt-1">{campaignStats.totalConversions}</p>
                  <div className="flex items-center gap-1 mt-2">
                    <ArrowDownRight className="h-3 w-3 text-red-500" />
                    <span className="text-xs text-red-500">-5%</span>
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-orange-500/20">
                  <Target className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-pink-500/10 to-pink-600/5 dark:from-pink-500/20 dark:to-pink-600/10">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">ROI</p>
                  <p className="text-xl md:text-2xl font-bold mt-1">{campaignStats.roi}x</p>
                  <div className="flex items-center gap-1 mt-2">
                    <ArrowUpRight className="h-3 w-3 text-green-500" />
                    <span className="text-xs text-green-500">15%</span>
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-pink-500/20">
                  <TrendingUp className="h-4 w-4 text-pink-600 dark:text-pink-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-indigo-500/10 to-indigo-600/5 dark:from-indigo-500/20 dark:to-indigo-600/10">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Active</p>
                  <p className="text-xl md:text-2xl font-bold mt-1">{campaignStats.activeCampaigns}</p>
                  <div className="flex items-center gap-1 mt-2">
                    <Zap className="h-3 w-3 text-yellow-500" />
                    <span className="text-xs text-muted-foreground">Live</span>
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-indigo-500/20">
                  <PlayCircle className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Platform Tabs */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid grid-cols-3 md:grid-cols-6 w-full md:w-auto">
            <TabsTrigger value="all" className="gap-2">
              <Globe className="h-4 w-4" />
              <span className="hidden md:inline">All</span>
            </TabsTrigger>
            <TabsTrigger value="meta" className="gap-2">
              <Facebook className="h-4 w-4" />
              <span className="hidden md:inline">Meta</span>
            </TabsTrigger>
            <TabsTrigger value="google" className="gap-2">
              <Globe className="h-4 w-4" />
              <span className="hidden md:inline">Google</span>
            </TabsTrigger>
            <TabsTrigger value="instagram" className="gap-2">
              <Instagram className="h-4 w-4" />
              <span className="hidden md:inline">Instagram</span>
            </TabsTrigger>
            <TabsTrigger value="youtube" className="gap-2">
              <Youtube className="h-4 w-4" />
              <span className="hidden md:inline">YouTube</span>
            </TabsTrigger>
            <TabsTrigger value="linkedin" className="gap-2">
              <Linkedin className="h-4 w-4" />
              <span className="hidden md:inline">LinkedIn</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6 space-y-6">
            {/* Campaign Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Meta Ads Card - Coming Soon */}
              <Card className="relative overflow-hidden group hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <CardHeader className="relative">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                        <Facebook className="h-6 w-6" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">Meta Ads</CardTitle>
                        <p className="text-sm text-muted-foreground">Facebook & Instagram</p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 text-purple-700 dark:text-purple-300 border-0">
                      <Sparkles className="h-3 w-3 mr-1" />
                      Coming Soon
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="relative space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Campaign Management</span>
                      <Lock className="h-4 w-4 text-muted-foreground/50" />
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Audience Targeting</span>
                      <Lock className="h-4 w-4 text-muted-foreground/50" />
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Ad Creative Builder</span>
                      <Lock className="h-4 w-4 text-muted-foreground/50" />
                    </div>
                  </div>
                  <div className="pt-2">
                    <Progress value={35} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-2">35% Complete</p>
                  </div>
                  <Button 
                    disabled 
                    className="w-full bg-gradient-to-r from-gray-400 to-gray-500 text-white"
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    In Development
                  </Button>
                </CardContent>
              </Card>

              {/* Google Ads Card - Coming Soon */}
              <Card className="relative overflow-hidden group hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50">
                <div className="absolute inset-0 bg-gradient-to-br from-green-600/5 to-emerald-600/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <CardHeader className="relative">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 text-white">
                        <Globe className="h-6 w-6" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">Google Ads</CardTitle>
                        <p className="text-sm text-muted-foreground">Search & Display</p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 text-green-700 dark:text-green-300 border-0">
                      <Sparkles className="h-3 w-3 mr-1" />
                      Coming Soon
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="relative space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Search Campaigns</span>
                      <Lock className="h-4 w-4 text-muted-foreground/50" />
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Display Network</span>
                      <Lock className="h-4 w-4 text-muted-foreground/50" />
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Performance Max</span>
                      <Lock className="h-4 w-4 text-muted-foreground/50" />
                    </div>
                  </div>
                  <div className="pt-2">
                    <Progress value={25} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-2">25% Complete</p>
                  </div>
                  <Button 
                    disabled 
                    className="w-full bg-gradient-to-r from-gray-400 to-gray-500 text-white"
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    In Development
                  </Button>
                </CardContent>
              </Card>

              {/* Instagram Ads Card - Coming Soon */}
              <Card className="relative overflow-hidden group hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-950/50 dark:to-purple-950/50">
                <div className="absolute inset-0 bg-gradient-to-br from-pink-600/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <CardHeader className="relative">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 text-white">
                        <Instagram className="h-6 w-6" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">Instagram Ads</CardTitle>
                        <p className="text-sm text-muted-foreground">Stories & Reels</p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="bg-gradient-to-r from-pink-500/10 to-purple-500/10 text-pink-700 dark:text-pink-300 border-0">
                      <Sparkles className="h-3 w-3 mr-1" />
                      Coming Soon
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="relative space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Story Ads</span>
                      <Lock className="h-4 w-4 text-muted-foreground/50" />
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Reels Promotion</span>
                      <Lock className="h-4 w-4 text-muted-foreground/50" />
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Influencer Collab</span>
                      <Lock className="h-4 w-4 text-muted-foreground/50" />
                    </div>
                  </div>
                  <div className="pt-2">
                    <Progress value={20} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-2">20% Complete</p>
                  </div>
                  <Button 
                    disabled 
                    className="w-full bg-gradient-to-r from-gray-400 to-gray-500 text-white"
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    In Development
                  </Button>
                </CardContent>
              </Card>

              {/* YouTube Ads Card */}
              <Card className="relative overflow-hidden group hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/50 dark:to-orange-950/50">
                <div className="absolute inset-0 bg-gradient-to-br from-red-600/5 to-orange-600/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <CardHeader className="relative">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-xl bg-gradient-to-br from-red-500 to-red-600 text-white">
                        <Youtube className="h-6 w-6" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">YouTube Ads</CardTitle>
                        <p className="text-sm text-muted-foreground">Video Campaigns</p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="bg-gradient-to-r from-red-500/10 to-orange-500/10 text-red-700 dark:text-red-300 border-0">
                      <Sparkles className="h-3 w-3 mr-1" />
                      Coming Soon
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="relative space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">TrueView Ads</span>
                      <Lock className="h-4 w-4 text-muted-foreground/50" />
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Bumper Ads</span>
                      <Lock className="h-4 w-4 text-muted-foreground/50" />
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Discovery Ads</span>
                      <Lock className="h-4 w-4 text-muted-foreground/50" />
                    </div>
                  </div>
                  <div className="pt-2">
                    <Progress value={15} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-2">15% Complete</p>
                  </div>
                  <Button 
                    disabled 
                    className="w-full bg-gradient-to-r from-gray-400 to-gray-500 text-white"
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    In Development
                  </Button>
                </CardContent>
              </Card>

              {/* LinkedIn Ads Card */}
              <Card className="relative overflow-hidden group hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-blue-50 to-sky-50 dark:from-blue-950/50 dark:to-sky-950/50">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-sky-600/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <CardHeader className="relative">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 text-white">
                        <Linkedin className="h-6 w-6" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">LinkedIn Ads</CardTitle>
                        <p className="text-sm text-muted-foreground">B2B Marketing</p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="bg-gradient-to-r from-blue-500/10 to-sky-500/10 text-blue-700 dark:text-blue-300 border-0">
                      <Sparkles className="h-3 w-3 mr-1" />
                      Coming Soon
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="relative space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Sponsored Content</span>
                      <Lock className="h-4 w-4 text-muted-foreground/50" />
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Message Ads</span>
                      <Lock className="h-4 w-4 text-muted-foreground/50" />
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Lead Gen Forms</span>
                      <Lock className="h-4 w-4 text-muted-foreground/50" />
                    </div>
                  </div>
                  <div className="pt-2">
                    <Progress value={10} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-2">10% Complete</p>
                  </div>
                  <Button 
                    disabled 
                    className="w-full bg-gradient-to-r from-gray-400 to-gray-500 text-white"
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    In Development
                  </Button>
                </CardContent>
              </Card>

              {/* Email Marketing Card */}
              <Card className="relative overflow-hidden group hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/50 dark:to-purple-950/50">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <CardHeader className="relative">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                        <Megaphone className="h-6 w-6" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">Email Marketing</CardTitle>
                        <p className="text-sm text-muted-foreground">Campaigns & Automation</p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 text-indigo-700 dark:text-indigo-300 border-0">
                      <Sparkles className="h-3 w-3 mr-1" />
                      Coming Soon
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="relative space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Email Templates</span>
                      <Lock className="h-4 w-4 text-muted-foreground/50" />
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Automation Flows</span>
                      <Lock className="h-4 w-4 text-muted-foreground/50" />
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">A/B Testing</span>
                      <Lock className="h-4 w-4 text-muted-foreground/50" />
                    </div>
                  </div>
                  <div className="pt-2">
                    <Progress value={30} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-2">30% Complete</p>
                  </div>
                  <Button 
                    disabled 
                    className="w-full bg-gradient-to-r from-gray-400 to-gray-500 text-white"
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    In Development
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Coming Features Section */}
            <Card className="border-0 bg-gradient-to-br from-purple-50/50 to-blue-50/50 dark:from-purple-950/20 dark:to-blue-950/20">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-blue-500/20">
                    <Zap className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <CardTitle>Upcoming Features</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/10 to-blue-500/10">
                      <BarChart3 className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Advanced Analytics</p>
                      <p className="text-xs text-muted-foreground">Cross-platform performance metrics</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-green-500/10 to-emerald-500/10">
                      <Target className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">AI Audience Builder</p>
                      <p className="text-xs text-muted-foreground">Smart audience segmentation</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500/10 to-red-500/10">
                      <RefreshCw className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Auto-Optimization</p>
                      <p className="text-xs text-muted-foreground">AI-powered campaign optimization</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-pink-500/10 to-purple-500/10">
                      <Sparkles className="h-4 w-4 text-pink-600 dark:text-pink-400" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Creative Studio</p>
                      <p className="text-xs text-muted-foreground">AI-generated ad creatives</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/10 to-indigo-500/10">
                      <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Campaign Scheduler</p>
                      <p className="text-xs text-muted-foreground">Automated campaign scheduling</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500/10 to-purple-500/10">
                      <Share2 className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Multi-Channel Sync</p>
                      <p className="text-xs text-muted-foreground">Unified campaign management</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Other tab contents would follow similar pattern */}
          <TabsContent value="meta" className="mt-6">
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="p-6 rounded-full bg-gradient-to-br from-blue-500/10 to-purple-500/10 mb-6">
                <Facebook className="h-12 w-12 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Meta Ads Integration</h3>
              <p className="text-muted-foreground max-w-md">
                Connect your Facebook Business Manager to create and manage campaigns across Facebook and Instagram.
              </p>
              <Button className="mt-6" disabled>
                <Clock className="h-4 w-4 mr-2" />
                Coming Soon
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="google" className="mt-6">
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="p-6 rounded-full bg-gradient-to-br from-green-500/10 to-emerald-500/10 mb-6">
                <Globe className="h-12 w-12 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Google Ads Integration</h3>
              <p className="text-muted-foreground max-w-md">
                Connect your Google Ads account to manage Search, Display, and YouTube campaigns.
              </p>
              <Button className="mt-6" disabled>
                <Clock className="h-4 w-4 mr-2" />
                Coming Soon
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}